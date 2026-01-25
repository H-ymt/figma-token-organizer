import { AIClient } from "./base";
import type { ColorInput, GenerateTokensResponse, PromptConfig, RefineTokensRequest, RefineTokensResponse } from "./types";

export class ClaudeClient extends AIClient {
  private baseURL = "https://api.anthropic.com/v1";

  async generateTokens(colors: ColorInput[], promptConfig: PromptConfig): Promise<GenerateTokensResponse> {
    const prompt = this.buildPrompt(colors, promptConfig);

    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0];
    if (content.type !== "text") throw new Error("Invalid response format");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  }

  async refineTokens(request: RefineTokensRequest): Promise<RefineTokensResponse> {
    const prompt = this.buildRefinePrompt(request);

    const response = await fetch(`${this.baseURL}/messages`, {
      method: "POST",
      headers: {
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.content[0];
    if (content.type !== "text") throw new Error("Invalid response format");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  }
}
