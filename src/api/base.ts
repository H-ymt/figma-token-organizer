import type { AIClientConfig, ColorInput, GenerateTokensResponse, PromptConfig, RefineTokensRequest, RefineTokensResponse, TokenOutput } from "./types";

export abstract class AIClient {
  protected config: AIClientConfig;

  constructor(config: AIClientConfig) {
    this.config = config;
  }

  abstract generateTokens(colors: ColorInput[], promptConfig: PromptConfig): Promise<GenerateTokensResponse>;
  abstract refineTokens(request: RefineTokensRequest): Promise<RefineTokensResponse>;

  protected buildPrompt(colors: ColorInput[], promptConfig: PromptConfig): string {
    const colorList = colors
      .sort((a, b) => b.count - a.count)
      .map((c) => `  - ${c.hex} (used ${c.count} times)`)
      .join("\n");

    // 命名スタイルの説明
    const styleGuide = this.getStyleGuide(promptConfig.namingStyle);

    // 既存トークンの例
    const existingGuide = promptConfig.existingTokens
      ? `\nFollow this existing token naming pattern:\n${promptConfig.existingTokens}\n`
      : "";

    return `You are a design system expert. Analyze these colors and create semantic design tokens.

Colors:
${colorList}

${styleGuide}
${existingGuide}
Rules:
- Use "/" as separator for hierarchy
- Keep original hex values exactly
- Every input color must appear in output

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
Examples: primary-500, secondary-300, neutral-900, accent-400`;

      case "material":
        return `Naming Style: Material Design
Use semantic naming like: primary, onPrimary, surface, onSurface, error
Examples: Primary/Main, Primary/Light, Surface/Background, Text/OnPrimary`;

      case "custom":
      default:
        return `Naming Style: Semantic
Use meaningful semantic names based on the color's likely purpose in the UI.
Group by function: Text/, Background/, Border/, Action/, Status/`;
    }
  }

  protected buildRefinePrompt(request: RefineTokensRequest): string {
    const tokenList = request.currentTokens
      .map((t) => `  - ${t.hex}: "${t.name}"`)
      .join("\n");

    if (request.targetToken) {
      // 個別トークンの改善
      return `You are a design system expert. A user wants to rename a specific token.

Current tokens:
${tokenList}

Target token to rename: ${request.targetToken.hex} (currently named "${request.targetToken.name}")

User feedback: "${request.feedback}"

Suggest a new name for ONLY this token based on the feedback. Keep all other tokens unchanged.

Return ONLY valid JSON with ALL tokens (changed and unchanged):
{
  "tokens": [
    { "hex": "#XXXXXX", "name": "Category/Name" }
  ]
}`;
    } else {
      // 全体の改善
      return `You are a design system expert. A user wants to improve the token names.

Current tokens:
${tokenList}

User feedback: "${request.feedback}"

Improve the token names based on the feedback while keeping the same hex values.

Return ONLY valid JSON:
{
  "tokens": [
    { "hex": "#XXXXXX", "name": "Category/Name" }
  ]
}`;
    }
  }
}
