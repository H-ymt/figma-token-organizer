export type AIProvider = "groq" | "claude" | "zai" | "ollama" | "openai-compatible";
export type NamingStyle = "tailwind" | "material" | "custom";

export interface AIClientConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
}

// プロンプト設定
export interface PromptConfig {
  namingStyle: NamingStyle;
  existingTokens?: string;
}

// 色の使用コンテキスト
export interface ColorContext {
  nodeName: string;
  nodeType: string;
  parentPath: string;
  usageType: "fill" | "stroke";
}

// 抽出された色（使用回数とコンテキスト付き）
export interface ColorInput {
  hex: string;
  count: number;
  contexts: ColorContext[]; // 使用されている場所の情報
}

// AIが生成するトークン
export interface TokenOutput {
  hex: string;
  name: string;
}

export interface GenerateTokensResponse {
  tokens: TokenOutput[];
}

// チャットによるトークン改善リクエスト
export interface RefineTokensRequest {
  currentTokens: TokenOutput[];
  feedback: string;
  targetToken?: TokenOutput; // 特定のトークンのみ対象の場合
}

export interface RefineTokensResponse {
  tokens: TokenOutput[];
}
