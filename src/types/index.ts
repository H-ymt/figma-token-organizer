// 色の使用コンテキスト（AIに渡す情報）
export interface ColorUsageContext {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  parentPath: string; // 親ノードの階層パス（例: "Frame/Button/Icon"）
  usageType: "fill" | "stroke";
}

// 抽出された色
export interface ExtractedColor {
  hex: string;
  count: number; // 使用回数
  usages: Array<{
    nodeId: string;
    type: "fill" | "stroke";
    index: number;
  }>;
  // コンテキスト情報（AIでのトークン名生成精度向上用）
  contexts: ColorUsageContext[];
}

// ノードの色情報
export interface NodeColorInfo {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  parentPath: string; // 親ノードの階層パス
  fills: Array<{ hex: string; index: number }>;
  strokes: Array<{ hex: string; index: number }>;
}

// AIが生成するトークン定義
export interface TokenDefinition {
  hex: string;
  name: string; // セマンティック名 (例: "Action/Primary", "Text/Secondary")
}

// AIへのリクエスト
export interface GenerateTokensRequest {
  colors: ExtractedColor[];
}

// AIからのレスポンス
export interface GenerateTokensResponse {
  tokens: TokenDefinition[];
}

// 適用結果
export interface ApplyResult {
  success: number;
  failed: number;
  errors: string[];
}
