"""
种子数据 — 将课程语料与成就写入 SQLite

说明：语料为 MVP 示例内容，正式上线前需语言学顾问 + 发音人审定。
音频地址为占位符，待发音人录制后替换。
"""

import sqlite3
import os
import uuid

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "xiaoshanhua.db")

# 6 大场景（顺序即闯关顺序）
SCENES = [
    {
        "id": "scene_market", "name": "菜市场", "icon": "🥬", "order": 1,
        "sentences": [
            {"xiaoshan": "个菜新鲜弗新鲜？", "pinyin": "geʔ tsʰɛ ɕiɲɕiɛ fəʔ", "mandarin": "这个菜新鲜吗？", "diff": 2},
            {"xiaoshan": "来两斤", "pinyin": "lɛ liã tɕiŋ", "mandarin": "来两斤", "diff": 1},
            {"xiaoshan": "多少钱？", "pinyin": "tuo ʑiɔ tsʰiã", "mandarin": "多少钱？", "diff": 1},
            {"xiaoshan": "太贵了，便宜点", "pinyin": "tʰɛ kuei lɛ, bɛ ɲi ti", "mandarin": "太贵了，便宜点", "diff": 2},
            {"xiaoshan": "有葱弗？", "pinyin": "ɦiəu tsʰoŋ fəʔ", "mandarin": "有葱吗？", "diff": 2},
            {"xiaoshan": "五块两", "pinyin": "ŋ kʰuɛ liã", "mandarin": "五块二", "diff": 1},
        ],
    },
    {
        "id": "scene_hospital", "name": "看病就医", "icon": "🏥", "order": 2,
        "sentences": [
            {"xiaoshan": "挂个号", "pinyin": "ko ka ɦɔ", "mandarin": "挂个号", "diff": 1},
            {"xiaoshan": "我头疼", "pinyin": "ŋ dɤ dɤ", "mandarin": "我头疼", "diff": 1},
            {"xiaoshan": "在哪里取药？", "pinyin": "zɛ nɑ lɪ tɕʰyøʔ", "mandarin": "在哪里取药？", "diff": 2},
            {"xiaoshan": "要排队弗？", "pinyin": "iɔ dʑiɛ dɤ fəʔ", "mandarin": "要排队吗？", "diff": 2},
            {"xiaoshan": "几楼看？", "pinyin": "tɕi lɤ kʰø̃", "mandarin": "几楼看？", "diff": 1},
        ],
    },
    {
        "id": "scene_traffic", "name": "交通出行", "icon": "🚌", "order": 3,
        "sentences": [
            {"xiaoshan": "去人民路哪亨走？", "pinyin": "tɕʰyø ʐiəŋ lɤ na ɦã tsɤ", "mandarin": "去人民路怎么走？", "diff": 3},
            {"xiaoshan": "勒此地落车", "pinyin": "ləʔ tsʰɪ di loʔ tsʰo", "mandarin": "在这里下车", "diff": 2},
            {"xiaoshan": "一位几钿？", "pinyin": "iəʔ uei tɕi dʑi", "mandarin": "一位多少钱？", "diff": 2},
            {"xiaoshan": "末班车几点？", "pinyin": "məʔ pæ tsʰø ti tɕi", "mandarin": "末班车几点？", "diff": 3},
        ],
    },
    {
        "id": "scene_office", "name": "办事大厅", "icon": "🏢", "order": 4,
        "sentences": [
            {"xiaoshan": "勒几楼？", "pinyin": "ləʔ tɕi lɤ", "mandarin": "在几楼？", "diff": 1},
            {"xiaoshan": "带点啥材料？", "pinyin": "ta tiã sa dzɛ liɔ", "mandarin": "带什么材料？", "diff": 2},
            {"xiaoshan": "要排队弗？", "pinyin": "iɔ dʑiɛ dɤ fəʔ", "mandarin": "要排队吗？", "diff": 2},
            {"xiaoshan": "啥辰光好办？", "pinyin": "sa zəŋ kuã ɦɔ bɛ", "mandarin": "什么时候好办？", "diff": 3},
        ],
    },
    {
        "id": "scene_family", "name": "家庭交流", "icon": "👨‍👩‍👧", "order": 5,
        "sentences": [
            {"xiaoshan": "饭吃了弗？", "pinyin": "vɛ tɕʰiəʔ lɛ fəʔ", "mandarin": "吃饭了吗？", "diff": 1},
            {"xiaoshan": "今朝菜弗错", "pinyin": "tɕiŋ tsɔ tsʰɛ fəʔ tsʰu", "mandarin": "今天菜不错", "diff": 2},
            {"xiaoshan": "倷身体好弗？", "pinyin": "nɔŋ sɛn tʰi ɦɔ fəʔ", "mandarin": "你身体好吗？", "diff": 2},
            {"xiaoshan": "姆妈勒屋里", "pinyin": "m̩ ma ləʔ oʔ lɪ", "mandarin": "妈妈在家里", "diff": 2},
            {"xiaoshan": "囡囡困着了", "pinyin": "nɔ nɔ kʰuəʔ dʑʰa lɛ", "mandarin": "小孩睡着了", "diff": 3},
        ],
    },
    {
        "id": "scene_work", "name": "职场寒暄", "icon": "💼", "order": 6,
        "sentences": [
            {"xiaoshan": "今朝忙弗忙？", "pinyin": "tɕiŋ tsɔ mã fəʔ mã", "mandarin": "今天忙不忙？", "diff": 2},
            {"xiaoshan": "吃饭了弗？", "pinyin": "tɕʰiəʔ vɛ lɛ fəʔ", "mandarin": "吃饭了吗？", "diff": 1},
            {"xiaoshan": "周末去何里？", "pinyin": "tsɤ muɪ tɕʰyø ɦa lɪ", "mandarin": "周末去哪里？", "diff": 3},
            {"xiaoshan": "多谢侬", "pinyin": "tuo ʑia nɔŋ", "mandarin": "多谢你", "diff": 1},
        ],
    },
]

ACHIEVEMENTS = [
    {"id": "a1", "name": "初次开口", "icon": "🗣️", "desc": "完成第一次跟读", "cond": "first_record", "val": 1},
    {"id": "a2", "name": "坚持3天", "icon": "🔥", "desc": "连续打卡3天", "cond": "streak", "val": 3},
    {"id": "a3", "name": "坚持7天", "icon": "🔥🔥", "desc": "连续打卡7天", "cond": "streak", "val": 7},
    {"id": "a4", "name": "学完菜场", "icon": "🥬", "desc": "完成菜市场场景", "cond": "scene_done", "val": 1},
    {"id": "a5", "name": "学完看病", "icon": "🏥", "desc": "完成看病场景", "cond": "scene_done", "val": 2},
    {"id": "a6", "name": "发音达人", "icon": "⭐", "desc": "单句得分≥90", "cond": "high_score", "val": 90},
]


def seed():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # 清空（幂等）
    cur.executescript("""
        DELETE FROM user_achievements;
        DELETE FROM achievements;
        DELETE FROM learning_records;
        DELETE FROM sentences;
        DELETE FROM scenes;
    """)

    for s in SCENES:
        cur.execute(
            "INSERT INTO scenes (id, name, icon, \"order\", sentence_count) VALUES (?,?,?,?,?)",
            (s["id"], s["name"], s["icon"], s["order"], len(s["sentences"])),
        )
        for i, sent in enumerate(s["sentences"]):
            sid = f"{s['id']}_{i+1}"
            audio = f"https://cdn.xiaoshanhua.app/audio/{sid}.mp3"
            cur.execute(
                """INSERT INTO sentences
                   (id, scene_id, "order", text_xiaoshan, text_pinyin, text_mandarin, audio_url, difficulty)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (sid, s["id"], i + 1, sent["xiaoshan"], sent["pinyin"],
                 sent["mandarin"], audio, sent["diff"]),
            )

    for a in ACHIEVEMENTS:
        cur.execute(
            "INSERT INTO achievements (id, name, description, icon, condition_type, condition_value) VALUES (?,?,?,?,?,?)",
            (a["id"], a["name"], a["desc"], a["icon"], a["cond"], a["val"]),
        )

    conn.commit()
    conn.close()
    total_sent = sum(len(s["sentences"]) for s in SCENES)
    print(f"种子数据写入完成：{len(SCENES)} 场景 / {total_sent} 句 / {len(ACHIEVEMENTS)} 成就")


if __name__ == "__main__":
    seed()
