# Resumate

AI 驅動的人才招募管理系統。HR 可上傳候選人履歷，由 Google Gemini 自動解析、評分，並產生面試信件。

---

## 功能特色

- **履歷解析**：上傳 PDF，Gemini AI 自動提取姓名、Email、學歷、工作經歷、技能
- **AI 適配評分**：對比職缺 JD 與文化特質，回傳 0-100 分的配對分析報告（含優勢、風險、建議面試題）
- **盲測模式**：一鍵隱藏候選人學歷，減少無意識偏見
- **狀態管理**：追蹤每位候選人從初篩、面試到錄取/婉拒的完整流程
- **內部筆記**：在每份應徵紀錄上記錄面試觀察
- **信件中心**：AI 生成面試邀約 / 感謝函 / 錄取通知，支援 AI 潤飾，可存草稿或直接寄出

---

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | React 19 + Vite + Tailwind CSS v4 + React Router v7 |
| 後端 | Django 5.2 + Django REST Framework |
| 資料庫 | PostgreSQL 16 |
| AI | Google Gemini (`google-genai`) |
| 容器化 | Docker + Docker Compose |

---

## 專案結構

```
2025_Resumate/
├── docker-compose.yml
├── .env.example              # 設定範本（無密碼）
├── Resumate/                 # Django 後端
│   ├── core/
│   │   ├── models.py         # 資料模型
│   │   ├── views.py          # API 端點
│   │   ├── serializers.py
│   │   ├── services.py       # AI 服務（Gemini）
│   │   └── urls.py
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/                 # React 前端
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # 職缺總覽
    │   │   ├── JobDetail.jsx     # 候選人列表 + AI 報告
    │   │   ├── JobEdit.jsx       # 編輯職缺
    │   │   └── EmailCenter.jsx   # 信件中心
    │   └── components/
    │       └── EmailComposeModal.jsx
    └── Dockerfile
```

---

## 快速開始（Docker Compose）

### 前置需求

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Google Gemini API Key（[取得方式](https://aistudio.google.com/app/apikey)）
- Gmail 應用程式密碼（若要啟用寄信功能）

### 步驟

```bash
# 1. Clone 專案
git clone <repo-url>
cd 2025_Resumate

# 2. 建立環境設定檔
cp .env.example .env
```

開啟 `.env`，填入以下必填欄位：

```env
SECRET_KEY=<隨機字串，可用 python -c "import secrets; print(secrets.token_hex(32))" 產生>
GOOGLE_API_KEY=<你的 Gemini API Key>
DB_PASSWORD=<自訂資料庫密碼>
```

```bash
# 3. 啟動所有服務（首次會自動 build image 並執行 migrate）
docker compose up
```

| 服務 | 網址 |
|------|------|
| 前端 | http://localhost:5173 |
| 後端 API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |

---

## 本地開發（不使用 Docker）

### 後端

```bash
cd Resumate

# 建立虛擬環境
python -m venv myenv
source myenv/Scripts/activate   # Windows
# source myenv/bin/activate      # macOS / Linux

# 安裝依賴
pip install -r requirements.txt

# 建立 .env（參考 ../.env.example，DB_HOST 填 localhost）
cp ../.env.example .env

# 執行 migrate 並啟動
python manage.py migrate
python manage.py runserver
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

---

## 環境變數說明

完整的 `.env.example` 位於專案根目錄。以下為各欄位說明：

| 變數 | 說明 | 必填 |
|------|------|------|
| `SECRET_KEY` | Django 安全金鑰 | ✅ |
| `GOOGLE_API_KEY` | Gemini AI API Key | ✅ |
| `DB_NAME` | 資料庫名稱（預設 `resumate_db`）| ✅ |
| `DB_USER` | 資料庫使用者（預設 `postgres`）| ✅ |
| `DB_PASSWORD` | 資料庫密碼 | ✅ |
| `DB_HOST` | 資料庫主機（本地開發填 `localhost`）| ✅ |
| `EMAIL_HOST_USER` | Gmail 帳號 | 寄信功能 |
| `EMAIL_HOST_PASSWORD` | Gmail 應用程式密碼 | 寄信功能 |

> **Gmail 應用程式密碼**：需先開啟帳號兩步驟驗證，再至「帳號安全性 → 應用程式密碼」產生 16 碼密碼。

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/api/upload/` | 上傳並解析履歷 PDF |
| `POST` | `/api/match/` | 對指定候選人與職缺執行 AI 分析 |
| `GET/POST` | `/api/jobs/` | 列出 / 新增職缺 |
| `GET/PUT/DELETE` | `/api/jobs/<id>/` | 取得 / 修改 / 刪除職缺 |
| `GET` | `/api/jobs/<id>/applications/` | 取得職缺下所有應徵紀錄（依分數排序）|
| `GET/PATCH` | `/api/applications/<id>/` | 取得 / 更新應徵紀錄（狀態、筆記）|
| `POST` | `/api/generate-email/` | AI 生成信件草稿 |
| `POST` | `/api/polish-email/` | AI 潤飾現有信件 |
| `GET` | `/api/email-tasks/all/` | 取得所有信件（支援 `?status=` 過濾）|
| `POST` | `/api/email-tasks/` | 建立信件草稿 |
| `POST` | `/api/email-tasks/<id>/send/` | 寄出指定信件 |
| `DELETE` | `/api/email-tasks/<id>/` | 刪除信件 |
