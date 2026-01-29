# WBS プロジェクト管理 - フロントエンド

Next.js 14 (App Router) で構築されたReactアプリケーションです。
OpenProjectライクなUIデザインを採用しています。

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS + カスタムCSS
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query + Axios
- **日付処理**: date-fns

## 📁 ディレクトリ構成

```
web/
├── src/
│   ├── app/                    # App Router ページ
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # トップページ（リダイレクト）
│   │   ├── login/              # ログインページ
│   │   │   └── page.tsx
│   │   └── projects/           # プロジェクト関連
│   │       ├── page.tsx        # プロジェクト一覧
│   │       └── [projectId]/    # プロジェクト詳細
│   │           └── page.tsx
│   │
│   ├── components/             # Reactコンポーネント
│   │   ├── layout/
│   │   │   └── main-layout.tsx # サイドバー + ヘッダー
│   │   ├── wbs/
│   │   │   └── wbs-table.tsx   # WBSテーブル（スプレッドシート風）
│   │   ├── gantt/
│   │   │   └── gantt-chart.tsx # ガントチャート
│   │   ├── task/
│   │   │   └── task-detail-panel.tsx  # タスク詳細パネル
│   │   └── providers.tsx       # React Queryプロバイダー
│   │
│   ├── lib/
│   │   ├── api.ts              # Axiosクライアント
│   │   ├── utils.ts            # ユーティリティ関数
│   │   └── store/
│   │       └── auth.ts         # 認証ストア（Zustand）
│   │
│   └── types/
│       └── index.ts            # TypeScript型定義
│
├── public/                     # 静的ファイル
├── next.config.js              # Next.js設定
├── tailwind.config.js          # Tailwind設定
└── package.json
```

## 🎨 UIコンポーネント

### MainLayout（サイドバー + ヘッダー）
- 青色（#1A67A3）のヘッダーバー
- 折りたたみ可能なサイドバーナビゲーション
- プロジェクトコンテキスト対応

### WbsTable（WBSテーブル）
- スプレッドシート風のテーブルレイアウト
- 列: ID / TYPE / SUBJECT / STATUS / START DATE / FINISH DATE / DURATION / % DONE
- 階層表示（インデント + 展開/折りたたみ）
- ダブルクリックでインライン編集
- ツールバー: Create / Filter / Expand All / Collapse All

### GanttChart（ガントチャート）
- **ズームレベル**: Days / Weeks / Months
- **タスクバー**: 青（進行中）、緑（完了）、赤（ブロック）
- **マイルストーン**: ◆ダイヤモンド形状
- **フェーズ/サマリー**: 角括弧スタイル
- **依存矢印**: タスク間の依存関係を矢印で表示
- **今日線**: 赤い縦線で現在日を表示
- **週末**: グレー背景

### TaskDetailPanel（タスク詳細パネル）
- 右からスライドインするパネル
- **Overview**: ステータス、進捗、日程、工数
- **Activity**: コメント + 変更履歴
- **Time**: 工数ログ一覧
- **Relations**: 依存関係（開発中）

## 🚀 セットアップ

### 環境変数

`.env.local` ファイルを作成:

```env
# バックエンドAPIのURL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### コマンド

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm run start

# Lint実行
npm run lint
```

## 🎯 画面遷移

```
/login
  ↓ ログイン成功
/projects
  ↓ プロジェクト選択
/projects/[projectId]
  - Table ビュー（WBSテーブルのみ）
  - Gantt ビュー（ガントチャートのみ）
  - Split ビュー（左: WBS、右: Gantt）
```

## 🔐 認証フロー

1. `/login` でメールアドレスを入力
2. "Sign in (Development)" をクリック
3. バックエンドの `/api/auth/dev-login` を呼び出し
4. JWTトークンを取得し、Zustandストアに保存
5. `/api/me` でユーザー情報を取得
6. `/projects` へリダイレクト

### トークン管理
- **保存場所**: localStorage + Zustandストア
- **自動付与**: Axiosインターセプターで全リクエストにAuthorizationヘッダーを付与
- **期限切れ**: 401レスポンスでトークンをクリアし `/login` へリダイレクト

## 🎨 カラーテーマ

| 用途 | カラーコード | 説明 |
|-----|-------------|------|
| プライマリ | #1A67A3 | ヘッダー、アクティブ項目、ボタン |
| プライマリ（ダーク）| #155a8a | ホバー時 |
| プライマリ（ライト）| #E8F4FD | 選択行の背景 |
| 成功 | #4CAF50 | 完了ステータス、マイルストーン |
| 警告 | #FF9800 | 警告メッセージ |
| 危険 | #E53935 | ブロック、エラー、今日線 |
| 背景（グレー）| #F3F6F8 | サイドバー、ツールバー |

## 📝 開発時のTips

### ホットリロード
開発サーバー起動中は、ファイル保存で自動リロードされます。

### APIプロキシ
`next.config.js` で `/api/*` へのリクエストをバックエンドにプロキシしています。

### デバッグ
- React DevTools（ブラウザ拡張）
- Redux DevTools（Zustand対応）
