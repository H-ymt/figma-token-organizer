# Figma Token Organizer

Figmaで選択したデザインから色を抽出し、AIがセマンティックなデザイントークン名を提案するプラグイン。

## 機能

- 🎨 **色の抽出**: 選択したノードの塗り（Fills）と線（Strokes）から使用色を自動抽出
- 🤖 **AI命名**: AIがデザインシステムに適したセマンティックなトークン名を提案
- 💬 **対話的な改善**: AIへのフィードバックでトークン名を調整可能
- ✏️ **手動編集**: トークン名を直接クリックして編集可能
- 🔧 **変数作成**: Figma変数（Variable）として自動作成・適用

## インストール

### GitHubからダウンロード

```bash
# リポジトリをクローン
git clone https://github.com/H-ymt/figma-token-organizer.git
cd figma-token-organizer

# 依存関係のインストール
npm install

# ビルド
npm run build
```

または、[Releases](https://github.com/H-ymt/figma-token-organizer/releases)から最新版のZIPをダウンロードして展開してください。

### Figmaへのインストール

Figmaデスクトップアプリで:

1. 任意のFigmaファイルを開く
2. Quick Actions（Cmd+/ または Ctrl+/）で `Import plugin from manifest…` を検索して実行
3. プロジェクトの `manifest.json` を選択

## 使い方

### 1. AI設定

プラグインUIの「設定」から、使用するAIプロバイダーとAPI Keyを設定します。

| プロバイダー   | 特徴                   | API Key取得                                         |
| -------------- | ---------------------- | --------------------------------------------------- |
| **Groq**       | 高速・無料枠あり       | [Groq Console](https://console.groq.com/keys)       |
| **Claude**     | 高精度                 | [Anthropic Console](https://console.anthropic.com/) |
| **Z.AI**       | GLMベース              | [Z.AI](https://z.ai/model-api)                      |
| **Ollama**     | ローカル実行           | 不要（`OLLAMA_ORIGINS="*" ollama serve`で起動）     |
| **OpenAI互換** | カスタムエンドポイント | プロバイダーによる                                  |

### 2. デザイントークンの生成

1. Figmaでオブジェクトを選択
2. 「色を抽出」をクリック → 使用されている色が一覧表示される
3. 「AIでトークン名を生成」をクリック → AIがセマンティックな名前を提案
4. 必要に応じてトークン名を調整:
   - トークン名をクリックして直接編集
   - チャット欄からAIにフィードバックして再提案を依頼
5. 「変数を作成して適用」をクリック → Figma変数が作成され、ノードに適用される

### 3. プロンプト設定（オプション）

「プロンプト設定」から命名スタイルをカスタマイズ可能:

- **セマンティック**: `Text/Primary`, `Background/Surface` など
- **Tailwind**: `blue-500`, `gray-100` など
- **Material**: `primary`, `surface`, `onPrimary` など

既存のトークン名パターンを入力すると、AIがそのスタイルに合わせて提案します。

## 開発

### 前提条件

- Node.js v22
- [Figmaデスクトップアプリ](https://figma.com/downloads/)

### コマンド

```bash
# ビルド
npm run build

# ウォッチモード（開発時）
npm run watch

# リント
npm run lint

# フォーマット
npm run format
```

## プロジェクト構成

```text
src/
├── main.ts              # Figma Sandbox（プラグインエントリー）
├── ui.tsx               # Plugin UI（Preact）
├── store.ts             # 状態管理（Zustand）
├── styles.css           # スタイル（Tailwind CSS）
├── api/                 # AIプロバイダー
│   ├── base.ts          # 共通インターフェース
│   ├── groq.ts          # Groq API
│   ├── claude.ts        # Claude API
│   ├── zai.ts           # Z.AI API
│   └── openai-compatible.ts  # OpenAI互換API
├── scanner/             # 色抽出
│   └── color-scanner.ts
├── patcher/             # 変数適用
│   └── color-patcher.ts
├── utils/               # ユーティリティ
│   ├── color-matcher.ts
│   └── figma-helpers.ts
└── types/               # 型定義
    └── index.ts
```

## 技術スタック

- **Platform**: Figma Plugin ([Create Figma Plugin](https://yuanqing.github.io/create-figma-plugin/))
- **Frontend**: Preact + Tailwind CSS
- **State**: Zustand
- **Linting**: oxlint
- **Formatting**: oxfmt

## ロードマップ

- [x] Phase 1: Color Snapper（MVP）
- [ ] Phase 2: Layout & Typography Fixer
- [ ] Phase 3: Component Recognizer

## 参考リンク

- [Create Figma Plugin ドキュメント](https://yuanqing.github.io/create-figma-plugin/)
- [Figma Plugin API ドキュメント](https://figma.com/plugin-docs/)
- [figma/plugin-samples](https://github.com/figma/plugin-samples)
