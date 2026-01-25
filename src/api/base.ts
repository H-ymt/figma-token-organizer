import type { AIClientConfig, ColorContext, ColorInput, GenerateTokensResponse, PromptConfig, RefineTokensRequest, RefineTokensResponse, TokenOutput } from "./types";

export abstract class AIClient {
  protected config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = config;
  }

  abstract generateTokens(colors: ColorInput[], promptConfig: PromptConfig): Promise<GenerateTokensResponse>;
  abstract refineTokens(request: RefineTokensRequest): Promise<RefineTokensResponse>;

  /**
   * コンテキスト情報を要約して、AIが理解しやすい形式にする
   */
  private summarizeContexts(contexts: ColorContext[]): string {
    if (!contexts || contexts.length === 0) return "";

    // ユニークなコンテキストパターンを収集
    const patterns = new Map<string, number>();

    for (const ctx of contexts) {
      // 使用タイプ（fill/stroke）を明示
      const usageLabel = ctx.usageType === "stroke" ? "[border]" : "[fill]";

      // ノード名とノードタイプから用途を推測
      const nodeHint = this.inferNodePurpose(ctx.nodeName, ctx.nodeType);

      // 親パスがあれば階層情報を追加
      const pathHint = ctx.parentPath ? `in ${ctx.parentPath}` : "";

      const pattern = [usageLabel, nodeHint, pathHint].filter(Boolean).join(" ");
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    }

    // 頻度順にソートして上位3つを表示
    const sortedPatterns = Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([pattern, count]) => (count > 1 ? `${pattern} (×${count})` : pattern));

    return sortedPatterns.join(", ");
  }

  /**
   * ノード名とタイプから用途を推測
   */
  private inferNodePurpose(nodeName: string, nodeType: string): string {
    const lowerName = nodeName.toLowerCase();

    // テキスト関連
    if (nodeType === "TEXT" || lowerName.includes("text") || lowerName.includes("label") || lowerName.includes("title") || lowerName.includes("heading")) {
      return "text";
    }

    // ボタン・アクション関連
    if (lowerName.includes("button") || lowerName.includes("btn") || lowerName.includes("cta")) {
      return "button";
    }

    // アイコン関連
    if (lowerName.includes("icon") || lowerName.includes("ico")) {
      return "icon";
    }

    // 背景・コンテナ関連
    if (lowerName.includes("background") || lowerName.includes("bg") || lowerName.includes("container") || lowerName.includes("card") || lowerName.includes("surface")) {
      return "background";
    }

    // 入力フィールド関連
    if (lowerName.includes("input") || lowerName.includes("field") || lowerName.includes("form")) {
      return "input";
    }

    // ナビゲーション関連
    if (lowerName.includes("nav") || lowerName.includes("menu") || lowerName.includes("header") || lowerName.includes("footer") || lowerName.includes("sidebar")) {
      return "navigation";
    }

    // ステータス関連
    if (lowerName.includes("error") || lowerName.includes("success") || lowerName.includes("warning") || lowerName.includes("info") || lowerName.includes("alert")) {
      return "status";
    }

    // リンク関連
    if (lowerName.includes("link") || lowerName.includes("anchor")) {
      return "link";
    }

    // デフォルト
    return nodeName.length <= 20 ? nodeName : "";
  }

  protected buildPrompt(colors: ColorInput[], promptConfig: PromptConfig): string {
    // 色リストをコンテキスト情報付きで構築
    const colorList = colors
      .sort((a, b) => b.count - a.count)
      .map((c) => {
        const contextSummary = this.summarizeContexts(c.contexts);
        const contextInfo = contextSummary ? ` → ${contextSummary}` : "";
        return `  - ${c.hex} (used ${c.count} times)${contextInfo}`;
      })
      .join("\n");

    // 命名スタイルの説明
    const styleGuide = this.getStyleGuide(promptConfig.namingStyle);

    // 既存トークンの例
    const existingGuide = promptConfig.existingTokens
      ? `\nFollow this existing token naming pattern:\n${promptConfig.existingTokens}\n`
      : "";

    return `You are a design system expert. Analyze these colors and create semantic design tokens.

Each color includes usage context: [fill] means background/surface usage, [border] means stroke/outline usage.
Context clues like "text", "button", "background" indicate where the color is used in the UI.

Colors with context:
${colorList}

${styleGuide}
${existingGuide}
Rules:
- Use "/" as separator for hierarchy (e.g., "Text/Primary", "Background/Surface")
- IMPORTANT: Use context clues to determine the correct category:
  - Colors used as [fill] on TEXT nodes → likely Text/ category
  - Colors used as [fill] on buttons → likely Action/ or Button/ category
  - Colors used as [border] → likely Border/ category
  - Colors used as [fill] on large containers → likely Background/ category
- Keep original hex values exactly
- Every input color must appear in output
- Distinguish between primary, secondary, and tertiary variants based on usage frequency

Return ONLY valid JSON:
{
  "tokens": [
    { "hex": "#XXXXXX", "name": "Category/Name" }
  ]
}`;
  }

  private getStyleGuide(style: string): string {
    switch (style) {
      case "tailwind":
        return `Naming Style: Tailwind CSS
Use color-shade format like: blue-500, gray-100, red-600
- For brand colors: primary-{shade}, secondary-{shade}, accent-{shade}
- For neutrals: gray-{shade}, slate-{shade}, neutral-{shade}
- For status: red-{shade} (error), green-{shade} (success), yellow-{shade} (warning), blue-{shade} (info)
Shades: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`;

      case "material":
        return `Naming Style: Material Design 3
Use semantic role-based naming:
- Primary/Main, Primary/Container, Primary/OnContainer
- Secondary/Main, Secondary/Container
- Tertiary/Main, Tertiary/Container
- Surface/Default, Surface/Container, Surface/Dim, Surface/Bright
- OnSurface/Default, OnSurface/Variant
- Outline/Default, Outline/Variant
- Error/Main, Error/Container, Error/OnContainer`;

      case "custom":
      default:
        return `Naming Style: Semantic (Role-Based)
Categorize by UI role and function:

Text Colors:
- Text/Primary: Main body text
- Text/Secondary: Less prominent text
- Text/Disabled: Inactive text
- Text/Inverse: Text on dark backgrounds
- Text/Link: Hyperlink text

Background Colors:
- Background/Default: Main page background
- Background/Surface: Card/container backgrounds
- Background/Elevated: Elevated surfaces (modals, dropdowns)
- Background/Subtle: Subtle backgrounds (hover states)

Action Colors:
- Action/Primary: Primary buttons, CTAs
- Action/Secondary: Secondary buttons
- Action/Disabled: Disabled state
- Action/Hover: Hover state

Border Colors:
- Border/Default: Standard borders
- Border/Subtle: Subtle dividers
- Border/Focus: Focus rings
- Border/Input: Form input borders

Status Colors:
- Status/Success: Success states
- Status/Error: Error states
- Status/Warning: Warning states
- Status/Info: Informational states`;
    }
  }

  protected buildRefinePrompt(request: RefineTokensRequest): string {
    const tokenList = request.currentTokens
      .map((t) => `  - ${t.hex}: "${t.name}"`)
      .join("\n");

    if (request.targetToken) {
      // 個別トークンの改善
      return `You are a design system expert. A user is UNHAPPY with a token name and wants it CHANGED.

Current tokens:
${tokenList}

PROBLEM TOKEN: ${request.targetToken.hex} (current name: "${request.targetToken.name}")

User's complaint/request: "${request.feedback}"

CRITICAL INSTRUCTIONS:
1. You MUST change the name of ${request.targetToken.hex} - the current name "${request.targetToken.name}" is NOT acceptable
2. Create a DIFFERENT name that addresses the user's feedback
3. Do NOT return the same name "${request.targetToken.name}" - this will frustrate the user
4. Keep all other tokens exactly the same
5. Keep all hex values exactly the same

Think about what the user wants:
- If they say "もっとシンプルに" → use shorter, simpler names
- If they say "日本語で" → use Japanese names
- If they mention a specific category → use that category
- If they say it's wrong → infer the correct purpose from the color

Return ONLY valid JSON with ALL tokens:
{
  "tokens": [
    { "hex": "#XXXXXX", "name": "Category/Name" }
  ]
}`;
    } else {
      // 全体の改善
      return `You are a design system expert. A user is UNHAPPY with the current token names and wants them IMPROVED.

Current tokens (these need to be CHANGED):
${tokenList}

User's feedback: "${request.feedback}"

CRITICAL INSTRUCTIONS:
1. You MUST change the token names - the user explicitly asked for changes
2. Do NOT return the same names - this will frustrate the user
3. Apply the user's feedback to ALL relevant tokens
4. Keep all hex values exactly the same

Common user requests and how to handle them:
- "シンプルに" / "短く" → Use shorter names (e.g., "Text/Primary" → "Primary")
- "日本語で" → Use Japanese (e.g., "Text/Primary" → "テキスト/メイン")
- "Tailwind風に" → Use Tailwind format (e.g., "blue-500", "gray-100")
- "もっと具体的に" → Add more specific descriptions
- Mentions specific colors → Focus changes on those colors

Before returning, verify:
- Did you actually CHANGE the names?
- Do the new names address the user's feedback?

Return ONLY valid JSON:
{
  "tokens": [
    { "hex": "#XXXXXX", "name": "Category/Name" }
  ]
}`;
    }
  }
}
