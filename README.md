# 萧山话学堂 (Xiaoshanhua Academy)

> 🗣️ 面向新萧山人的方言 AI 学习微信小程序

## 项目简介

「萧山话学堂」是一款专为"新萧山人"打造的微信小程序，通过**场景化日常用语学习 + AI 语音纠音**，帮助外地人快速掌握实用萧山话（吴语·太湖片·临绍小片），打破方言壁垒，融入本地生活。

- **目标用户**：因工作、婚嫁、经商等原因来到萧山的外地人
- **产品形态**：微信小程序（原生 WXML/WXSS/JS）
- **核心功能**：场景化课程 + AI 发音评分 + 闯关游戏化 + 成就体系
- **技术方案**：DTW+MFCC 声学特征规则评分（**自研**，所有云 API 均不支持吴语，故自建模）

## 项目状态

| 阶段 | 状态 |
|------|------|
| 阶段一：需求规划 | ✅ 完成 |
| 阶段二：PRD 撰写 | ✅ 完成 (v1.1) |
| 阶段三：设计与研发评审 | ✅ 完成（材料齐备，待正式评审会议） |
| 阶段四：MVP 开发 | ✅ 完成（前端 + 后端 + 评分引擎，本地跑通） |

## 目录结构

```
xiaoshanhua-app/
├── docs/                         # 规划与评审文档
│   ├── 需求规划-阶段一.md
│   ├── PRD-v1.1.md              # 完整产品需求文档（EARS 原则）
│   ├── 技术决策-四大问题.md      # AI评测选型、录音接口、发音人、标准音
│   └── 评审准备-阶段三.md
├── poc/
│   └── poc_dtw_score.py         # DTW+MFCC 发音评分方案 PoC 验证
├── miniprogram/                  # 微信小程序前端（原生）
│   ├── app.js / app.json / app.wxss
│   ├── pages/                    # launch / login / home / scene / learn / profile / achievements
│   ├── components/               # record-button（长按录音）, score-modal（评分弹窗）
│   ├── utils/                    # request / auth / audio 封装
│   └── services/                 # course / score / user / mock 数据
└── backend/                      # Python FastAPI 后端（MVP）
    ├── app.py                    # 入口，含 /health
    ├── db.py                     # SQLite 建表（幂等）
    ├── seed_data.py              # 6 场景 / 28 句 / 6 成就 种子
    ├── services/scorer.py        # DTW+MFCC 发音评分引擎
    ├── routers/                  # auth / course / score / user
    └── requirements.txt
```

## 技术栈

- **前端**：微信小程序原生（WXML/WXSS/JS），含 tabBar、自定义组件、录音与播放
- **后端**：Python FastAPI（零外部中间件）
- **AI 评分**：librosa + numpy + scipy + fastdtw（39 维 MFCC + Δ + ΔΔ，DTW 对齐 + 余弦相似度）
- **数据库**：SQLite（MVP，零依赖；生产可平滑迁移 MySQL/PostgreSQL）
- **部署**：微信云托管 / 腾讯云（规划）

## 快速开始

### 1. 后端（评分服务）

```bash
cd backend
pip install -r requirements.txt
python db.py            # 建表（幂等）
python seed_data.py     # 写入种子语料（6 场景 / 28 句 / 6 成就）
python app.py           # 启动，默认 http://127.0.0.1:8000
```

启动后校验：

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/course/scenes
```

### 2. 评分接口（自研 DTW+MFCC）

```bash
# 将用户录音（mp3/wav）转 base64 后 POST
curl -X POST http://127.0.0.1:8000/score/pronounce \
  -H "Content-Type: application/json" \
  -d '{"sentence_id":"scene_market_1","audio_base64":"<BASE64>","format":"wav"}'
# 返回 {score, mean_similarity, dtw_distance, weak_regions, grade}
```

> MVP 阶段标准音尚未录制，评分路由以用户音频自身作回退基准（演示链路）；
> 上线前替换为城厢音标准音文件，并接入真实 audio_url。

### 3. 小程序前端

用**微信开发者工具**打开 `miniprogram/` 目录即可预览。前端在后端不可用时自动降级到 `services/mock.js` 本地数据，保证开发期体验。

## 已知限制 / 待办

- [ ] 真实萧山话标准音录制（城厢音，需语言学顾问 + 发音人审定）
- [ ] 评分基准由"用户音频回退"替换为标准音文件
- [ ] 微信登录 code2session 真实接入（现为 mock）
- [ ] 标准音音频 CDN 地址替换占位符
- [ ] 阶段三正式评审会议
- [ ] GitHub 云端仓库推送（需用户提供 PAT，OAuth token 不支持 git push）

## 许可证

MIT
