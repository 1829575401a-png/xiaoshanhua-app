"""
鉴权路由 — 微信登录

流程：
  1. 小程序 wx.login → code
  2. 后端用 code 调微信接口换 openid + session_key
  3. 创建/更新用户 → 返回 access_token

MVP 说明：微信 code→session 的真实换取需 appid/secret，
此处用 mock 实现（本地起可直接跑），上线前替换为真实调用。
"""

import time
import base64
import json
from fastapi import APIRouter, HTTPException

from db import get_conn

router = APIRouter(prefix="/auth", tags=["auth"])

# 演示用：真实环境请替换为微信 code2session 接口
# GET https://api.weixin.qq.com/sns/jscode2session?appid=&secret=&js_code=&grant_type=authorization_code
WECHAT_APPID = "touristappid"
WECHAT_SECRET = "mock_secret"


def _mock_wechat_code2session(code: str):
    """演示：code→openid 的 mock 实现"""
    # 真实环境应调微信接口；此处用 code 派生稳定 openid
    raw = f"{code}:{WECHAT_APPID}"
    openid = "oX" + base64.b64encode(raw.encode()).decode()[:24].replace("+", "A").replace("/", "B")
    return openid, "mock_session_key"


def _gen_token(openid: str):
    """生成演示 token（上线前请换 JWT）"""
    payload = json.dumps({"openid": openid, "ts": int(time.time())})
    return base64.b64encode(payload.encode()).decode()


@router.post("/wechat-login")
def wechat_login(body: dict):
    code = body.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="缺少 code")

    # 1. 换取 openid（mock）
    openid, session_key = _mock_wechat_code2session(code)

    # 2. upsert 用户
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, nickname, avatar_url FROM users WHERE openid=?", (openid,))
    row = cur.fetchone()
    if not row:
        uid = f"u_{int(time.time()*1000)}_{openid[-6:]}"
        cur.execute(
            "INSERT INTO users (id, openid, nickname) VALUES (?,?, '新萧山人')",
            (uid, openid),
        )
        conn.commit()
        cur.execute("SELECT id, nickname, avatar_url FROM users WHERE id=?", (uid,))
        row = cur.fetchone()
    conn.close()

    user = {
        "openid": openid,
        "nickname": row["nickname"],
        "avatar_url": row["avatar_url"],
    }
    return {
        "access_token": _gen_token(openid),
        "refresh_token": _gen_token(openid + "_r"),
        "user": user,
    }
