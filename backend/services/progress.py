"""
学习进度与成就逻辑（不依赖语料，纯基于学习记录计算）

- 连续打卡 streak：按"每日首次练习"累加，跨天断签归 1
- 成就解锁：依据条件类型实时评估，满足条件即写入 user_achievements
  条件类型（见 seed_data.ACHIEVEMENTS）：
    first_record : 跟读次数 >= val
    streak       : 连续打卡天数 >= val
    scene_done   : 已完成场景数 >= val（场景=全部句子均有学习记录）
    high_score   : 历史最高单句分 >= val
"""

import datetime
import json
import time
import sqlite3

from db import get_conn


def _today() -> str:
    return datetime.date.today().isoformat()


def update_streak(user_id: str) -> dict:
    """
    按"每日首次练习"更新连续打卡天数。
    返回 {streak_days, checked_in_today, incremented}
    """
    today = _today()
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT streak_days, last_checkin_date FROM users WHERE id=?", (user_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return {"streak_days": 0, "checked_in_today": False, "incremented": False}

    prev_streak = row["streak_days"] or 0
    last = row["last_checkin_date"]

    if last == today:
        # 今天已打卡，不重复计数
        conn.close()
        return {"streak_days": prev_streak, "checked_in_today": True, "incremented": False}

    # 昨天则连击 +1，否则断签归 1
    yest = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    new_streak = prev_streak + 1 if last == yest else 1
    cur.execute(
        "UPDATE users SET streak_days=?, last_checkin_date=? WHERE id=?",
        (new_streak, today, user_id),
    )
    conn.commit()
    conn.close()
    return {
        "streak_days": new_streak,
        "checked_in_today": True,
        "incremented": new_streak != prev_streak,
    }


def _record_count(user_id: str) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM learning_records WHERE user_id=?", (user_id,))
    r = cur.fetchone()
    conn.close()
    return int(r["c"]) if r else 0


def _streak_of(user_id: str) -> int:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT streak_days FROM users WHERE id=?", (user_id,))
    r = cur.fetchone()
    conn.close()
    return int(r["streak_days"]) if r and r["streak_days"] is not None else 0


def _completed_scene_count(user_id: str) -> int:
    """已完成（全部句子均有学习记录）的场景数"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT sc.id,
               COUNT(DISTINCT lr.sentence_id) AS done,
               sc.sentence_count        AS total
        FROM scenes sc
        JOIN sentences s ON s.scene_id = sc.id
        LEFT JOIN learning_records lr
               ON lr.sentence_id = s.id AND lr.user_id = ?
        GROUP BY sc.id
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()
    return sum(1 for r in rows if r["total"] and r["done"] >= r["total"])


def _best_score(user_id: str) -> float:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT MAX(score) AS m FROM learning_records WHERE user_id=?", (user_id,))
    r = cur.fetchone()
    conn.close()
    return float(r["m"]) if r and r["m"] is not None else 0.0


def evaluate_achievements(user_id: str) -> list:
    """
    评估并解锁满足条件的成就，返回本次新解锁的成就列表。
    仅评估用户尚未解锁的成就，幂等（已解锁不重复写入）。
    """
    ctx = {
        "record_count": _record_count(user_id),
        "streak": _streak_of(user_id),
        "completed_scenes": _completed_scene_count(user_id),
        "best_score": _best_score(user_id),
    }

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT a.* FROM achievements a
        WHERE a.id NOT IN (
            SELECT achievement_id FROM user_achievements WHERE user_id=?
        )
        """,
        (user_id,),
    )
    candidates = cur.fetchall()

    unlocked = []
    for a in candidates:
        cond = a["condition_type"]
        val = a["condition_value"]
        met = False
        if cond == "first_record":
            met = ctx["record_count"] >= val
        elif cond == "streak":
            met = ctx["streak"] >= val
        elif cond == "scene_done":
            met = ctx["completed_scenes"] >= val
        elif cond == "high_score":
            met = ctx["best_score"] >= val

        if met:
            cur.execute(
                "INSERT INTO user_achievements (id, user_id, achievement_id) VALUES (?,?,?)",
                (f"ua_{int(time.time()*1000)}_{a['id']}", user_id, a["id"]),
            )
            unlocked.append({
                "id": a["id"],
                "name": a["name"],
                "icon": a["icon"],
                "description": a["description"],
            })

    conn.commit()
    conn.close()
    return unlocked


def get_achievement_status(user_id: str) -> list:
    """返回全部成就及其解锁状态（真实，基于 user_achievements）"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT a.id, a.name, a.icon, a.description,
               a.condition_type, a.condition_value,
               CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END AS unlocked
        FROM achievements a
        LEFT JOIN user_achievements ua
               ON ua.achievement_id = a.id AND ua.user_id = ?
        ORDER BY a.condition_value ASC
        """,
        (user_id,),
    )
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_review_list(user_id: str, threshold: float = 80.0) -> list:
    """
    待巩固（错题本）列表：取每句"最新一次"跟读记录，
    若最新分 < 阈值，或存在薄弱段，则纳入复习。
    返回按最新分升序（最弱优先）。
    """
    conn = get_conn()
    cur = conn.cursor()
    # 每句最新一条记录（id 自增，MAX(id) 即最新）
    cur.execute(
        """
        SELECT lr.sentence_id, lr.score, lr.weak_regions, lr.created_at
        FROM learning_records lr
        WHERE lr.user_id = ?
          AND lr.id = (
              SELECT MAX(id) FROM learning_records
              WHERE user_id = ? AND sentence_id = lr.sentence_id
          )
        """,
        (user_id, user_id),
    )
    rows = cur.fetchall()

    result = []
    for r in rows:
        score = float(r["score"]) if r["score"] is not None else 0.0
        weak = []
        try:
            weak = json.loads(r["weak_regions"]) if r["weak_regions"] else []
        except Exception:
            weak = []
        # 待巩固判定：最新分低于阈值，或存在薄弱段
        if score < threshold or len(weak) > 0:
            cur.execute(
                "SELECT text_xiaoshan, text_pinyin, text_mandarin, scene_id "
                "FROM sentences WHERE id=?",
                (r["sentence_id"],),
            )
            s = cur.fetchone()
            if not s:
                continue
            result.append({
                "sentence_id": r["sentence_id"],
                "xiaoshan": s["text_xiaoshan"],
                "pinyin": s["text_pinyin"],
                "mandarin": s["text_mandarin"],
                "scene_id": s["scene_id"],
                "latest_score": round(score, 1),
                "weak_regions": weak,
                "needs_review": score < threshold,
            })

    conn.close()
    result.sort(key=lambda x: x["latest_score"])
    return result
