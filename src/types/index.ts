// 抽出された色
export interface ExtractedColor {
  hex: string;
  count: number; // 使用回数
  usages: Array<{
    nodeId: string;
    type: "fill" | "stroke";
    index: number;
  }>;
}

// ノードの色情報
export interface NodeColorInfo {
  nodeId: string;
  nodeName: string;
  nodeType: string;
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
