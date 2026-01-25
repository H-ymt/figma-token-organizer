import { AIClient } from "./base";
import type { AIClientConfig, ColorInput, GenerateTokensResponse, PromptConfig, RefineTokensRequest, RefineTokensResponse } from "./types";

export interface OpenAICompatibleConfig extends AIClientConfig {
  baseURL: string;
}

export class OpenAICompatibleClient extends AIClient {
  private baseURL: string;

  constructor(config: OpenAICompatibleConfig) {
    super(config);
    this.baseURL = config.baseURL.replace(/\/$/, "");
  }

  async generateTokens(colors: ColorInput[], promptConfig: PromptConfig): Promise<GenerateTokensResponse> {
    const prompt = this.buildPrompt(colors, promptConfig);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.config.model || "llama3",
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
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from API");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  }

  async refineTokens(request: RefineTokensRequest): Promise<RefineTokensResponse> {
    const prompt = this.buildRefinePrompt(request);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.config.model || "llama3",
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
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from API");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");

    return JSON.parse(jsonMatch[0]);
  }
}
