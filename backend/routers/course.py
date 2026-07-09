"""
课程路由 — 场景 / 句子 / 学习上报
"""

import json
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_conn

router = APIRouter(prefix="/course", tags=["course"])


class LearningReport(BaseModel):
    sentence_id: str
    scene_id: str
    score: float
    weak_regions: list = []  # 来自评分引擎的薄弱段（秒区间 + 严重度）


def _row_to_scene(r):
    return {
        "id": r["id"],
        "name": r["name"],
        "icon": r["icon"],
        "order": r["order"],
        "sentence_count": r["sentence_count"],
    }


@router.get("/scenes")
def list_scenes():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM scenes ORDER BY \"order\" ASC")
    rows = cur.fetchall()
    scenes = [_row_to_scene(r) for r in rows]

    # 进度与锁定：完成上一场景才解锁下一场景
    cur.execute("""
        SELECT s.scene_id, COUNT(*) AS done
        FROM learning_records lr
        JOIN sentences s ON lr.sentence_id = s.id
        GROUP BY s.scene_id
    """)
    done_map = {r["scene_id"]: r["done"] for r in cur.fetchall()}
    conn.close()

    prev_done = True
    for sc in scenes:
        total = sc["sentence_count"]
        learned = done_map.get(sc["id"], 0)
        sc["learned"] = learned
        sc["progress"] = round(learned / total * 100) if total else 0
        sc["locked"] = not prev_done
        prev_done = sc["progress"] >= 100
    return scenes


@router.get("/scenes/{scene_id}")
def scene_detail(scene_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM scenes WHERE id=?", (scene_id,))
    srow = cur.fetchone()
    if not srow:
        raise HTTPException(status_code=404, detail="场景不存在")
    cur.execute("SELECT * FROM sentences WHERE scene_id=? ORDER BY \"order\" ASC", (scene_id,))
    sents = [
        {
            "id": r["id"],
            "scene_id": r["scene_id"],
            "order": r["order"],
            "xiaoshan": r["text_xiaoshan"],
            "pinyin": r["text_pinyin"],
            "mandarin": r["text_mandarin"],
            "audio_url": r["audio_url"],
            "audio_slow_url": r["audio_slow_url"],
            "difficulty": r["difficulty"],
        }
        for r in cur.fetchall()
    ]
    conn.close()
    return {
        "id": srow["id"],
        "name": srow["name"],
        "icon": srow["icon"],
        "sentences": sents,
    }


@router.get("/sentences/{sentence_id}")
def get_sentence(sentence_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM sentences WHERE id=?", (sentence_id,))
    r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="句子不存在")
    conn.close()
    return {
        "id": r["id"],
        "scene_id": r["scene_id"],
        "order": r["order"],
        "xiaoshan": r["text_xiaoshan"],
        "pinyin": r["text_pinyin"],
        "mandarin": r["text_mandarin"],
        "audio_url": r["audio_url"],
        "audio_slow_url": r["audio_slow_url"],
        "difficulty": r["difficulty"],
    }


@router.post("/learning/record")
def report_learning(body: LearningReport):
    from services.progress import update_streak, evaluate_achievements

    # MVP：无 token 鉴权，取首个用户（或创建演示用户）作为进度归属
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users LIMIT 1")
    u = cur.fetchone()
    if not u:
        uid = "u_demo"
        cur.execute(
            "INSERT INTO users (id, openid, nickname) VALUES (?, ?, '新萧山人')",
            (uid, "demo_openid"),
        )
        conn.commit()
    else:
        uid = u["id"]

    cur.execute(
        "INSERT INTO learning_records (id, user_id, sentence_id, score, weak_regions) VALUES (?,?,?,?,?)",
        (f"lr_{int(time.time()*1000)}", uid, body.sentence_id, body.score,
         json.dumps(body.weak_regions, ensure_ascii=False)),
    )
    # 积分：高分 +15，普通 +10
    bonus = 15 if body.score >= 80 else 10
    cur.execute("UPDATE users SET total_score = total_score + ? WHERE id=?", (bonus, uid))
    conn.commit()
    conn.close()

    # 真实进度与成就：连续打卡 + 条件解锁
    streak = update_streak(uid)
    new_ach = evaluate_achievements(uid)

    return {
        "ok": True,
        "bonus_points": bonus,
        "streak_days": streak["streak_days"],
        "checked_in_today": streak["checked_in_today"],
        "new_achievements": new_ach,
    }
