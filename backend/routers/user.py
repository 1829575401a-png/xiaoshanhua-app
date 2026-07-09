"""
用户路由 — 个人概览 / 学习统计 / 成就
"""

import datetime

from fastapi import APIRouter

from db import get_conn
from services.progress import get_achievement_status

router = APIRouter(prefix="/user", tags=["user"])


def _first_user_id():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users LIMIT 1")
    u = cur.fetchone()
    conn.close()
    return u["id"] if u else None


@router.get("/profile")
def user_profile():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users LIMIT 1")
    u = cur.fetchone()
    cur.execute("SELECT COUNT(*) AS c FROM learning_records")
    learned = cur.fetchone()["c"]
    cur.execute("SELECT AVG(score) AS a FROM learning_records")
    avg = cur.fetchone()["a"] or 0
    conn.close()
    return {
        "userInfo": {"nickName": u["nickname"] or "新萧山人", "avatarUrl": u["avatar_url"] or ""},
        "streakDays": u["streak_days"] or 0,
        "learnedCount": learned,
        "avgScore": round(float(avg), 1),
        "totalPoints": u["total_score"] or 0,
        "checkedInToday": (u["last_checkin_date"] == datetime.date.today().isoformat()),
    }


@router.get("/learning-stats")
def learning_stats():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM learning_records")
    learned = cur.fetchone()["c"]
    cur.execute("SELECT AVG(score) AS a FROM learning_records")
    avg = cur.fetchone()["a"] or 0
    cur.execute("SELECT * FROM users LIMIT 1")
    u = cur.fetchone()
    conn.close()
    # 演示：生成近 30 天打卡热力
    import datetime
    weeks = []
    today = datetime.date.today()
    for w in range(5):
        week = []
        for d in range(7):
            day_idx = (4 - w) * 7 + d
            if day_idx > 29: continue
            dt = today - datetime.timedelta(days=29 - day_idx)
            level = (dt.day + dt.month) % 4  # 伪随机演示
            week.append({"d": day_idx, "level": level})
        if week: weeks.append(week)
    return {
        "userInfo": {"nickName": u["nickname"] or "新萧山人", "avatarUrl": u["avatar_url"] or ""},
        "streakDays": u["streak_days"] or 0,
        "learnedCount": learned,
        "avgScore": round(float(avg), 1),
        "totalPoints": u["total_score"] or 0,
        "checkedInToday": (u["last_checkin_date"] == today.isoformat()),
        "lastLearnedText": "今天学了「个菜新鲜弗新鲜？」得分 85" if learned else "",
        "heatWeeks": weeks,
    }


@router.get("/achievements")
def list_achievements():
    uid = _first_user_id()
    if not uid:
        return []
    # 真实解锁状态：基于 user_achievements 表
    return get_achievement_status(uid)


@router.get("/review")
def review_list():
    """待巩固（错题本）列表：最新分低于阈值或含薄弱段的句子"""
    uid = _first_user_id()
    if not uid:
        return []
    from services.progress import get_review_list
    return get_review_list(uid)
