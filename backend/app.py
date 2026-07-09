"""
萧山话学堂 — 后端主入口（FastAPI）

启动：
    pip install -r requirements.txt
    python app.py
或：
    uvicorn app:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from db import init_db
from routers import auth, course, score, user

app = FastAPI(title="萧山话学堂 API", version="1.1.0")

# 跨域（小程序开发期真机调试需放开）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 启动初始化数据库
init_db()

app.include_router(auth.router)
app.include_router(course.router)
app.include_router(score.router)
app.include_router(user.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
