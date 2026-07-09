"""
数据库层 — 使用 SQLite（零外部依赖，便于本地/MVP 快速部署）

表结构对齐 PRD 附录 A 数据模型：
  users / scenes / sentences / learning_records / achievements / user_achievements
"""

import sqlite3
import os
import json

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "xiaoshanhua.db")


def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """建表（幂等）"""
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        openid TEXT UNIQUE NOT NULL,
        nickname TEXT,
        avatar_url TEXT,
        total_score INTEGER DEFAULT 0,
        streak_days INTEGER DEFAULT 0,
        last_checkin_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scenes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        "order" INTEGER,
        sentence_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sentences (
        id TEXT PRIMARY KEY,
        scene_id TEXT,
        "order" INTEGER,
        text_xiaoshan TEXT,
        text_pinyin TEXT,
        text_mandarin TEXT,
        audio_url TEXT,
        audio_slow_url TEXT,
        difficulty INTEGER DEFAULT 1,
        FOREIGN KEY (scene_id) REFERENCES scenes(id)
    );

    CREATE TABLE IF NOT EXISTS learning_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        sentence_id TEXT,
        score REAL,
        audio_url TEXT,
        weak_regions TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (sentence_id) REFERENCES sentences(id)
    );

    CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        icon TEXT,
        condition_type TEXT,
        condition_value INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        achievement_id TEXT,
        unlocked_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (achievement_id) REFERENCES achievements(id)
    );
    """)
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print(f"数据库已初始化: {DB_PATH}")
