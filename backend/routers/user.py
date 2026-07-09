"""
用户路由 — 个人概览 / 学习统计 / 成就
"""

from fastapi import APIRouter

from db import get_conn

router = APIRouter(prefix="/user", tags=["user"])


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
        "checkedInToday": False,
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
        "lastLearnedText": "今天学了「个菜新鲜弗新鲜？」得分 85" if learned else "",
        "heatWeeks": weeks,
    }


@router.get("/achievements")
def list_achievements():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM achievements ORDER BY condition_value ASC")
    rows = cur.fetchall()
    # 演示：解锁前 2 个
    result = []
    for i, r in enumerate(rows):
        result.append({
            "id": r["id"],
            "name": r["name"],
            "icon": r["icon"],
            "description": r["description"],
            "unlocked": i < 2,
        })
    conn.close()
    return result
