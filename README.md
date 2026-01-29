# WBS プロジェクト管理アプリ

OpenProjectライクな本格的WBS（Work Breakdown Structure）とガントチャートを備えたプロジェクト管理アプリケーションです。

![Version](https://img.shields.io/badge/version-1.0.0--mvp-blue)
![Tech Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20NestJS%20%2B%20Prisma-green)

## 📸 スクリーンショット

### ログイン画面
- ブランドカラー（青 #1A67A3）を基調としたモダンなデザイン
- 開発モード用のテストアカウント選択機能

### プロジェクト一覧
- リスト/グリッドビュー切り替え
- プロジェクトステータス表示（Active/Planning/OnHold/Done/Archived）

### WBSテーブル + ガントチャート
- **スプリットビュー**: 左にWBSテーブル、右にガントチャート
- **WBSテーブル**: ID/Type/Subject/Status/Start/End/Duration/Progress列
- **ガントチャート**: 日/週/月ズーム、依存矢印、今日線

---

## 🚀 主な機能

### ✅ 実装済み（MVP）

| カテゴリ | 機能 |
|---------|------|
| **認証** | Microsoft Entra ID OIDC対応（開発モードはモック認証） |
| **認可** | プロジェクト単位RBAC（Admin/PM/Manager/Contributor/Viewer） |
| **プロジェクト管理** | 作成・一覧・詳細・更新 |
| **WBS（階層タスク）** | CRUD、階層表示、展開/折りたたみ |
| **ガントチャート** | 日/週/月ズーム、バー表示、マイルストーン◆ |
| **依存関係** | FS（Finish→Start）、ラグ日数、循環検出、矢印表示 |
| **スケジュール自動調整** | 依存関係に基づく日程自動計算（ON/OFF切替可） |
| **進捗管理** | 進捗率(%) + ステータス（未着手/進行中/ブロック/完了） |
| **工数管理** | 見積人日(PD) + 実績工数ログ |
| **ベースライン** | スナップショット作成 + 差分比較 |
| **コメント** | タスクへのコメント機能 |
| **変更履歴** | フィールド単位の変更追跡 |
| **Teams通知** | Incoming Webhookによる通知 |
| **Excel出力** | プロジェクトレポートのxlsx出力 |
| **成果物管理** | URL紐づけ |

---

## 🛠️ 技術スタック

| レイヤー | 技術 |
|---------|------|
| **フロントエンド** | Next.js 14 (App Router) + React 18 + TypeScript |
| **スタイリング** | Tailwind CSS + カスタムCSS |
| **状態管理** | Zustand + TanStack Query |
| **バックエンドAPI** | NestJS + TypeScript |
| **ORM** | Prisma |
| **データベース** | SQLite（開発）/ Azure SQL（本番） |
| **認証** | Microsoft Entra ID（本番）/ モック認証（開発） |

---

## 📁 プロジェクト構成

```
wbs-progress-management/
├── api/                        # NestJS バックエンドAPI
│   ├── prisma/
│   │   ├── schema.prisma       # データベーススキーマ
│   │   └── seed.ts             # シードデータ
│   ├── src/
│   │   ├── auth/               # 認証モジュール
│   │   ├── projects/           # プロジェクト管理
│   │   ├── tasks/              # タスク（WBS）管理
│   │   ├── dependencies/       # 依存関係管理
│   │   ├── baselines/          # ベースライン管理
│   │   ├── timelogs/           # 工数ログ
│   │   ├── comments/           # コメント
│   │   ├── deliverables/       # 成果物
│   │   ├── teams/              # Teams連携
│   │   ├── export/             # Excel出力
│   │   └── changelog/          # 変更履歴
│   └── package.json
│
├── web/                        # Next.js フロントエンド
│   ├── src/
│   │   ├── app/                # App Routerページ
│   │   │   ├── login/          # ログインページ
│   │   │   ├── projects/       # プロジェクト一覧・詳細
│   │   │   └── layout.tsx      # ルートレイアウト
│   │   ├── components/
│   │   │   ├── layout/         # サイドバー・ヘッダー
│   │   │   ├── wbs/            # WBSテーブル
│   │   │   ├── gantt/          # ガントチャート
│   │   │   └── task/           # タスク詳細パネル
│   │   ├── lib/                # ユーティリティ・ストア
│   │   └── types/              # TypeScript型定義
│   └── package.json
│
├── ecosystem.config.cjs        # PM2設定
└── package.json                # ルート（モノレポ）
```

---

## 🖥️ 開発環境セットアップ

### 前提条件
- Node.js >= 18.0.0
- npm >= 9.0.0

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/se-ya-sf/dev-testapps.git
cd dev-testapps

# 依存パッケージのインストール
npm install

# データベースのセットアップ
cd api
npm run db:generate    # Prisma Clientの生成
npm run db:push        # スキーマをDBに反映
npm run db:seed        # テストデータの投入
cd ..
```

### 開発サーバーの起動

```bash
# API + Web を同時起動
npm run dev

# または個別に起動
npm run dev:api    # API: http://localhost:4000
npm run dev:web    # Web: http://localhost:3000
```

### ビルド

```bash
npm run build
```

---

## 🔗 URL一覧

### 開発環境
| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:3000 |
| バックエンドAPI | http://localhost:4000/api |
| Swagger API仕様書 | http://localhost:4000/api/docs |

### テストアカウント（開発モード）

| メールアドレス | ロール | 権限 |
|---------------|-------|------|
| admin@example.com | Admin | 全権限 |
| pm@example.com | Project Manager | プロジェクト管理権限 |
| dev@example.com | Developer | タスク編集権限 |

---

## 📡 API エンドポイント

### 認証
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/me` | ログインユーザー情報取得 |
| POST | `/api/auth/dev-login` | 開発用ログイン |

### プロジェクト
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/projects` | プロジェクト一覧 |
| POST | `/api/projects` | プロジェクト作成 |
| GET | `/api/projects/:id` | プロジェクト詳細 |
| PATCH | `/api/projects/:id` | プロジェクト更新 |

### タスク（WBS）
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/projects/:id/tasks` | タスク一覧 |
| POST | `/api/projects/:id/tasks` | タスク作成 |
| GET | `/api/tasks/:id` | タスク詳細 |
| PATCH | `/api/tasks/:id` | タスク更新 |
| DELETE | `/api/tasks/:id` | タスク削除（論理削除） |
| POST | `/api/tasks/:id/move` | タスク移動 |

### 依存関係
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | `/api/projects/:id/dependencies` | 依存関係一覧 |
| POST | `/api/projects/:id/dependencies` | 依存関係作成 |
| DELETE | `/api/dependencies/:id` | 依存関係削除 |

### その他
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET/POST | `/api/tasks/:id/time-logs` | 工数ログ |
| GET/POST | `/api/tasks/:id/comments` | コメント |
| GET | `/api/tasks/:id/history` | 変更履歴 |
| GET/POST | `/api/projects/:id/baselines` | ベースライン |
| POST | `/api/projects/:id/export/excel` | Excel出力 |

---

## 📊 データモデル

### 主要エンティティ

| エンティティ | 説明 |
|-------------|------|
| **User** | ユーザー（Entra ID連携） |
| **Project** | プロジェクト（autoSchedule設定含む） |
| **ProjectMember** | プロジェクトメンバー（RBAC） |
| **Task** | WBSタスク（task/summary/milestone） |
| **Dependency** | タスク依存関係（FS + lagDays） |
| **TimeLog** | 工数実績ログ |
| **Baseline** | ベースラインスナップショット |
| **Comment** | タスクコメント |
| **ChangeLog** | 変更履歴 |
| **Deliverable** | 成果物URL |
| **TeamsSetting** | Teams Webhook設定 |

### タスクタイプ
- `task` - 通常タスク（📋）
- `summary` - フェーズ/サマリー（📁）
- `milestone` - マイルストーン（◆）

### タスクステータス
- `NotStarted` - 未着手
- `InProgress` - 進行中
- `Blocked` - ブロック中
- `Done` - 完了

---

## 🚀 本番デプロイ（Azure）

### 1. Azure SQL Database
```bash
# DATABASE_URLを本番用に更新
DATABASE_URL="sqlserver://..."

# マイグレーション実行
npx prisma migrate deploy
```

### 2. Azure App Service（API）
- `api/` フォルダをデプロイ
- 環境変数を設定:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `AUTH_MODE=entra`
  - `ENTRA_TENANT_ID`
  - `ENTRA_CLIENT_ID`
  - `ENTRA_CLIENT_SECRET`

### 3. Azure App Service（Web）
- `web/` フォルダをデプロイ
- 環境変数を設定:
  - `NEXT_PUBLIC_API_URL`

---

## 📝 今後の開発予定

### UI/UX改善
- [ ] ドラッグ&ドロップでタスク並び替え
- [ ] ガントバーのドラッグで日程変更
- [ ] タスクフィルタ（担当者、ステータス、遅延）
- [ ] カラムのリサイズ・並び替え

### 機能追加
- [ ] 担当者アサイン機能
- [ ] 成果物管理UI
- [ ] ベースライン差分の可視化
- [ ] ダッシュボード画面

### インフラ
- [ ] CI/CD パイプライン構築
- [ ] 自動テスト（Unit / E2E）
- [ ] 期限超過通知のバッチジョブ

---

## 📄 ライセンス

Proprietary - 社内利用限定

---

## 🤝 開発者向け情報

### コミット規約
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他
```

### ブランチ戦略
- `main` - 本番環境
- `develop` - 開発環境
- `feature/*` - 機能開発
- `fix/*` - バグ修正
