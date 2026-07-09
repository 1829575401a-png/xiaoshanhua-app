"""
AI 发音评分路由 — DTW + MFCC 规则评分
"""

import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.scorer import score_pronunciation, score_with_standard

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

    # 句子存在性校验
    from db import get_conn
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT text_xiaoshan FROM sentences WHERE id=?", (body.sentence_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="句子不存在")

    # 评分：优先用真实标准音（backend/data/audio/{sentence_id}.mp3），
    # 缺失时自动回退到 demo 行为（以用户音频自身为基准）。
    try:
        result = score_with_standard(body.sentence_id, audio_bytes)
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return result
