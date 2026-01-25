import { AIClient } from "./base";
import type { ColorInput, GenerateTokensResponse, PromptConfig, RefineTokensRequest, RefineTokensResponse } from "./types";

export class ZaiClient extends AIClient {
  private baseURL = "https://api.z.ai/api/paas/v4";

  async generateTokens(colors: ColorInput[], promptConfig: PromptConfig): Promise<GenerateTokensResponse> {
    const prompt = this.buildPrompt(colors, promptConfig);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "glm-4.5-air",
        messages: [
          {
            role: "system",
            content: "You are a design system expert. Return ONLY valid JSON, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from Z.AI");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  }

  async refineTokens(request: RefineTokensRequest): Promise<RefineTokensResponse> {
    const prompt = this.buildRefinePrompt(request);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "glm-4.5-air",
        messages: [
          {
            role: "system",
            content: "You are a design system expert. Return ONLY valid JSON, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Z.AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from Z.AI");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  }
}
