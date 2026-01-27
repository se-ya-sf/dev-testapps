# WBS Progress Management App

## Project Overview
- **Name**: WBS Progress Management
- **Version**: 1.0.0-mvp
- **Goal**: 社内のプロジェクト進捗管理を、WBS（階層タスク）とガントを中心に一元化
- **Tech Stack**: Next.js + NestJS + Prisma + SQLite (dev) / Azure SQL (prod)

## Features (MVP)

### ✅ Implemented
- **認証**: Entra ID OIDC対応 (開発モードではモック認証)
- **認可**: プロジェクト単位RBAC (Admin/PM/Manager/Contributor/Viewer)
- **プロジェクト管理**: 作成/一覧/更新
- **WBS (階層タスク)**: CRUD、並び替え、インデント/アウトデント
- **ガント表示**: WBSと同期、日/週/月ズーム
- **依存関係**: FS（Finish→Start）+ ラグ（日）、循環検出
- **スケジュール自動調整**: プロジェクト設定でON/OFF
- **進捗管理**: % + ステータス（NotStarted/InProgress/Blocked/Done）
- **工数管理**: 人日（PD）見積 + 実績（日次ログ）
- **ベースライン**: スナップショット作成 + 差分表示
- **コメント**: @メンション対応
- **変更履歴**: フィールド差分
- **Teams通知**: Incoming Webhook（mention/overdue/baselineCreated）
- **Excel出力**: 報告用xlsx
- **成果物**: URL紐づけ

## Project Structure

```
wbs-progress-management/
├── api/                    # NestJS Backend API
│   ├── prisma/             # Database schema & migrations
│   │   ├── schema.prisma   # Prisma schema
│   │   └── seed.ts         # Seed data
│   ├── src/
│   │   ├── auth/           # Authentication (Entra ID / Mock)
│   │   ├── projects/       # Project management
│   │   ├── tasks/          # WBS task management
│   │   ├── dependencies/   # Task dependencies
│   │   ├── baselines/      # Baseline snapshots
│   │   ├── timelogs/       # Time logging
│   │   ├── comments/       # Comments & mentions
│   │   ├── deliverables/   # Deliverable URLs
│   │   ├── teams/          # Teams integration
│   │   ├── export/         # Excel export
│   │   └── changelog/      # Audit trail
│   └── package.json
├── web/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilities & stores
│   │   └── types/          # TypeScript types
│   └── package.json
└── package.json            # Root (monorepo)
```

## URLs

### Development
- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000/api
- **Swagger Docs**: http://localhost:4000/api/docs

### Test Accounts (Development Mode)
| Email | Role |
|-------|------|
| admin@example.com | Admin |
| pm@example.com | Project Manager |
| dev@example.com | Developer |

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
# Install dependencies
npm install

# Setup database
cd api
npm run db:generate
npm run db:push
npm run db:seed
cd ..
```

### Development

```bash
# Start both API and Web
npm run dev

# Or start individually
npm run dev:api    # API on port 4000
npm run dev:web    # Web on port 3000
```

### Build

```bash
npm run build
```

## API Endpoints

### Auth
- `GET /api/me` - Get current user profile
- `POST /api/auth/dev-login` - Development login

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project detail
- `PATCH /api/projects/:id` - Update project

### Members
- `GET /api/projects/:id/members` - List members
- `POST /api/projects/:id/members` - Add member
- `PATCH /api/projects/:id/members/:userId` - Update role

### Tasks
- `GET /api/projects/:id/tasks` - List tasks
- `POST /api/projects/:id/tasks` - Create task
- `GET /api/tasks/:id` - Get task detail
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/move` - Move task

### Dependencies
- `GET /api/projects/:id/dependencies` - List dependencies
- `POST /api/projects/:id/dependencies` - Create dependency
- `DELETE /api/dependencies/:id` - Delete dependency

### Baselines
- `GET /api/projects/:id/baselines` - List baselines
- `POST /api/projects/:id/baselines` - Create baseline
- `GET /api/baselines/:id/diff?compare=current` - Get diff

### Time Logs
- `GET /api/tasks/:id/time-logs` - List time logs
- `POST /api/tasks/:id/time-logs` - Create time log

### Comments
- `GET /api/tasks/:id/comments` - List comments
- `POST /api/tasks/:id/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### History
- `GET /api/tasks/:id/history` - List change history

### Export
- `POST /api/projects/:id/export/excel` - Export to Excel

### Teams
- `PUT /api/projects/:id/teams-setting` - Upsert Teams settings
- `POST /api/projects/:id/teams-setting/test` - Test webhook

## Data Models

### Core Entities
- **User**: Entra ID連携ユーザー
- **Project**: プロジェクト (autoSchedule設定あり)
- **ProjectMember**: プロジェクトメンバー (RBAC)
- **Task**: WBSタスク (task/summary/milestone)
- **Dependency**: タスク依存関係 (FS + lag)
- **TimeLog**: 工数実績
- **Baseline/BaselineTask**: ベースラインスナップショット
- **Comment**: コメント (@mention対応)
- **ChangeLog**: 変更履歴
- **Deliverable**: 成果物URL
- **TeamsSetting**: Teams Webhook設定
- **IntegrationLog**: 連携ログ

## Deployment

### Azure Deployment (Production)

1. **Azure SQL Database**: 
   - Update `DATABASE_URL` in `.env`
   - Run `npx prisma migrate deploy`

2. **Azure App Service (API)**:
   - Deploy `api/` folder
   - Set environment variables

3. **Azure App Service (Web)**:
   - Deploy `web/` folder
   - Set `NEXT_PUBLIC_API_URL`

4. **Entra ID Configuration**:
   - Set `ENTRA_TENANT_ID`, `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`
   - Set `AUTH_MODE=entra`

## Next Steps (Recommended)

1. **UI/UX改善**
   - ドラッグ&ドロップでタスク並び替え
   - ガントバーのドラッグで日付変更
   - タスクフィルタ（担当者、ステータス、遅延）

2. **機能追加**
   - 担当者の自動補完UI
   - 成果物管理UI
   - ベースライン差分の可視化

3. **バッチジョブ**
   - 期限超過通知の定期実行
   - Azure Functions / Cron job

4. **テスト**
   - Unit tests
   - E2E tests

## License

Proprietary - Internal Use Only
