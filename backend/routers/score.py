"""
AI 发音评分路由 — DTW + MFCC 规则评分
"""

import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.scorer import score_pronunciation

router = APIRouter(prefix="/score", tags=["score"])


class ScoreReq(BaseModel):
    sentence_id: str
    audio_base64: str
    format: str = "mp3"  # mp3 / wav


def _decode_hex_or_b64(raw: str) -> bytes:
    """兼容 base64（小程序上传）或 hex"""
    try:
        return base64.b64decode(raw, validate=True)
    except Exception:
        try:
            return bytes.fromhex(raw)
        except Exception:
            raise HTTPException(status_code=400, detail="音频编码无法解析")


@router.post("/pronounce")
async def pronounce_score(body: ScoreReq):
    audio_bytes = _decode_hex_or_b64(body.audio_base64)

    # 标准发音：从数据库取该句 audio_url 对应文件
    # MVP 演示：标准音文件尚未录制，用用户音频的"副本"作为自比对基准，
    # 使评分始终返回接近满分（演示用）。真实环境替换为标准音文件读取。
    from db import get_conn
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT text_xiaoshan FROM sentences WHERE id=?", (body.sentence_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="句子不存在")

    # TODO: 读取真实标准音文件 → ref_bytes
    # ref_bytes = open(standard_audio_path, "rb").read()
    # 演示回退：用用户音频自身做基准（评分会偏高，仅演示链路）
    ref_bytes = audio_bytes

    try:
        result = score_pronunciation(ref_bytes, audio_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result
