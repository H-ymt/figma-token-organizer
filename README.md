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
| **Groq**       | 高速・無料枠あり（推奨）| [Groq Console](https://console.groq.com/keys)       |
| **Claude**     | 高精度                 | [Anthropic Console](https://console.anthropic.com/) |
| **Z.AI**       | GLMベース              | [Z.AI](https://z.ai/model-api)                      |
| **Ollama**     | ローカル実行・無料     | 不要（[セットアップ手順](#ollamaのセットアップ)を参照）|
| **OpenAI互換** | カスタムエンドポイント | プロバイダーによる                                  |

#### Ollamaのセットアップ

Ollamaを使用すると、AIをローカルで実行できるため、API料金がかからず、データがインターネットに送信されません。

##### 1. Ollamaのインストール

[Ollama公式サイト](https://ollama.com/)からダウンロードしてインストールしてください。

##### 2. モデルのダウンロード

ターミナル（Windowsの場合はコマンドプロンプト）を開いて、以下を実行：

```bash
ollama pull gemma3
```

> 💡 他のモデル（`llama3`、`mistral`等）も使用可能です。プラグインの設定でモデル名を変更してください。

##### 3. CORS制限の解除（重要）

FigmaプラグインからOllamaに接続するには、CORS制限を解除する必要があります。

<details>
<summary><strong>macOS</strong></summary>

1. メニューバーのOllamaアイコンをクリックして「Quit Ollama」で終了
2. ターミナルを開いて以下を実行：

```bash
OLLAMA_ORIGINS="*" ollama serve
```

> ⚠️ このターミナルウィンドウは開いたままにしてください。閉じるとOllamaが停止します。

</details>

<details>
<summary><strong>Windows</strong></summary>

1. タスクトレイのOllamaアイコンを右クリックして終了
2. システム環境変数を設定：
   - 「スタート」→「システム環境変数の編集」を検索して開く
   - 「環境変数」ボタンをクリック
   - 「ユーザー環境変数」の「新規」をクリック
   - 変数名: `OLLAMA_ORIGINS`
   - 変数値: `*`
   - 「OK」で保存
3. Ollamaを再起動

</details>

<details>
<summary><strong>Linux</strong></summary>

```bash
# systemdを使用している場合
sudo systemctl stop ollama
sudo systemctl edit ollama.service
```

以下を追加：
```ini
[Service]
Environment="OLLAMA_ORIGINS=*"
```

保存後：
```bash
sudo systemctl daemon-reload
sudo systemctl start ollama
```

</details>

##### 4. プラグインでの設定

1. プロバイダー: **Ollama** を選択
2. Base URL: `http://localhost:11434/v1`（デフォルト）
3. Model: `gemma3`（または他のダウンロード済みモデル）

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
