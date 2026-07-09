"""
萧山话发音评分引擎 — DTW + MFCC 声学特征规则评分

原理：
  1. 将标准发音与用户发音都转成 39 维 MFCC 特征序列
  2. 用 DTW 对齐两段音频的时间轴（处理语速差异）
  3. 逐帧计算余弦相似度
  4. 映射为 0-100 分，并标注薄弱时间段

注意：本方案为 MVP 规则评分，不依赖任何第三方方言评测 API。
准确率（与人工评分相关性）需用真实萧山话录音进一步校准。
"""

import io
import os
import numpy as np
import librosa
from typing import Optional
from fastdtw import fastdtw
from scipy.spatial.distance import euclidean, cosine
from scipy.signal import find_peaks

# 标准音目录：backend/data/audio/{sentence_id}.mp3(.wav)
# 录音到位后，把城厢音标准音文件丢进该目录即可启用，无需改任何逻辑。
STANDARD_AUDIO_DIR = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "data", "audio"
)

# 特征配置
SR = 16000
N_MFCC = 13
HOP = 160  # 10ms
FMIN, FMAX = 80, 4000


def preprocess(y: np.ndarray) -> np.ndarray:
    """
    真实录音鲁棒性预处理（无需语料即可生效）：
      1. 裁剪首尾静音：去掉环境底噪与起止停顿，避免静音帧污染 MFCC。
      2. RMS 归一化：消除音量大小带来的评分偏差，使不同设备/距离录音可比。
    """
    if y.size == 0:
        return y.astype(np.float32)
    # 裁剪静音（top_db=30 较保守，避免误裁词内停顿）
    y_trim, _ = librosa.effects.trim(y, top_db=30)
    if y_trim.size > 0:
        y = y_trim
    # RMS 归一化
    rms = float(np.sqrt(np.mean(y ** 2)))
    if rms > 1e-6:
        y = y / rms
    return y.astype(np.float32)


def load_audio(audio_bytes: bytes, sr: int = SR):
    """从字节加载音频，返回 (waveform, sr)"""
    try:
        # 优先用 librosa（支持 mp3/wav 等，依赖 ffmpeg/soundfile）
        y, _ = librosa.load(io.BytesIO(audio_bytes), sr=sr, mono=True)
        return preprocess(y.astype(np.float32))
    except Exception as e:
        raise RuntimeError(f"音频解码失败: {e}")


def extract_mfcc(y: np.ndarray, sr: int = SR, n_mfcc: int = N_MFCC):
    """提取 39 维 MFCC 特征（13 MFCC + Δ + ΔΔ），返回 (frames, 39)"""
    mfcc = librosa.feature.mfcc(
        y=y, sr=sr, n_mfcc=n_mfcc,
        n_fft=512, hop_length=HOP, fmin=FMIN, fmax=FMAX,
    )
    delta = librosa.feature.delta(mfcc, width=9)
    delta2 = librosa.feature.delta(mfcc, order=2, width=9)
    feat = np.vstack([mfcc, delta, delta2])  # (39, T)
    return feat.T  # (T, 39)


def score_pronunciation(
    ref_audio: bytes,
    user_audio: bytes,
    weak_threshold_pct: float = 20.0,
):
    """
    核心评分函数

    Args:
        ref_audio: 标准发音音频字节（mp3/wav）
        user_audio: 用户发音音频字节
        weak_threshold_pct: 薄弱帧分位阈值（默认最低 20% 帧视为薄弱）

    Returns:
        dict: { score, mean_similarity, dtw_distance, weak_regions, grade }
    """
    # 特征提取
    ref_y = load_audio(ref_audio)
    user_y = load_audio(user_audio)
    ref_feat = extract_mfcc(ref_y)
    user_feat = extract_mfcc(user_y)

    if ref_feat.shape[0] < 3 or user_feat.shape[0] < 3:
        # 音频过短，无法评分
        return {
            "score": 0,
            "mean_similarity": 0.0,
            "dtw_distance": 0.0,
            "weak_regions": [],
            "grade": "poor",
            "error": "audio_too_short",
        }

    # DTW 对齐
    dist, path = fastdtw(ref_feat, user_feat, dist=euclidean)
    path = np.array(path)

    # 逐帧余弦相似度
    sims = []
    for r, u in path:
        cos = 1.0 - cosine(ref_feat[r], user_feat[u])
        sims.append(max(0.0, min(1.0, cos)))
    sims = np.array(sims)

    mean_sim = float(np.mean(sims))
    # 非线性映射：相似度 0.95→95, 0.8→60, 0.5→20
    score = min(100.0, max(0.0, 100.0 * (mean_sim ** 1.5)))

    # 薄弱区域检测
    weak_regions = _detect_weak_regions(sims, path, weak_threshold_pct)

    grade = "excellent" if score >= 80 else ("good" if score >= 60 else "poor")

    return {
        "score": round(score, 1),
        "mean_similarity": round(mean_sim, 4),
        "dtw_distance": round(float(dist), 2),
        "weak_regions": weak_regions,
        "grade": grade,
        "frame_count": int(len(sims)),
    }


def _detect_weak_regions(sims: np.ndarray, path: np.ndarray, threshold_pct: float):
    """
    检测薄弱区域：
    将相似度最低的 threshold_pct% 帧标记为薄弱，
    合并连续薄弱帧为时间段，估算偏差严重度。
    """
    if len(sims) < 5:
        return []

    threshold = np.percentile(sims, threshold_pct)
    weak_mask = sims < threshold

    regions = []
    in_weak = False
    start = 0
    for i, is_weak in enumerate(weak_mask):
        if is_weak and not in_weak:
            start = i
            in_weak = True
        elif not is_weak and in_weak:
            regions.append((start, i))
            in_weak = False
    if in_weak:
        regions.append((start, len(sims)))

    # 转成时间段（10ms/帧）+ 严重度
    result = []
    for s, e in regions:
        seg = sims[s:e]
        severity = int(round((1.0 - float(np.mean(seg))) * 100))
        # 取代表帧对应的用户音频时间（用 path 中 user 索引近似）
        result.append({
            "start_sec": round(s * HOP / SR, 2),
            "end_sec": round(e * HOP / SR, 2),
            "severity": max(0, severity),
        })
    # 按严重度排序，最多 3 段
    result.sort(key=lambda x: -x["severity"])
    return result[:3]


def load_standard_audio(sentence_id: str) -> Optional[bytes]:
    """
    按 sentence_id 从标准音目录加载真实标准发音字节。

    支持扩展名：.mp3（优先）/ .wav。文件不存在返回 None，
    调用方据此回退到 demo 行为（用用户音频自身作基准）。
    """
    if not sentence_id:
        return None
    candidates = [
        os.path.join(STANDARD_AUDIO_DIR, f"{sentence_id}.mp3"),
        os.path.join(STANDARD_AUDIO_DIR, f"{sentence_id}.wav"),
        os.path.join(STANDARD_AUDIO_DIR, f"{sentence_id}.MP3"),
    ]
    for path in candidates:
        if os.path.isfile(path):
            try:
                with open(path, "rb") as f:
                    return f.read()
            except Exception:
                return None
    return None


def score_with_standard(
    sentence_id: str,
    user_audio: bytes,
    weak_threshold_pct: float = 20.0,
):
    """
    生产形态评分入口：优先用真实标准音，缺失时回退 demo。

    Returns: 在 score_pronunciation 结果基础上附加
        demo_mode: bool  是否处于回退（无标准音）状态
        standard_audio_used: bool  是否使用了真实标准音文件
    """
    ref_audio = load_standard_audio(sentence_id)
    demo_mode = ref_audio is None
    if demo_mode:
        # MVP 回退：没有标准音时以用户音频自身为基准（评分偏高，仅演示链路）
        ref_audio = user_audio

    result = score_pronunciation(ref_audio, user_audio, weak_threshold_pct)
    result["demo_mode"] = demo_mode
    result["standard_audio_used"] = not demo_mode
    result["sentence_id"] = sentence_id
    return result


if __name__ == "__main__":
    # 本地自检：用正弦波模拟两段音频验证链路
    import sys
    sr = SR
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    ref = (0.5 * np.sin(2 * np.pi * 200 * t)).astype(np.float32)
    user = (0.5 * np.sin(2 * np.pi * 210 * t)).astype(np.float32)
    import soundfile as sf
    buf_ref, buf_user = io.BytesIO(), io.BytesIO()
    sf.write(buf_ref, ref, sr, format="WAV")
    sf.write(buf_user, user, sr, format="WAV")
    out = score_pronunciation(buf_ref.getvalue(), buf_user.getvalue())
    print("自检结果:", out)
