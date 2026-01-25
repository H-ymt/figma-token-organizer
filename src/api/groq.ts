import { AIClient } from "./base";
import type { ColorInput, GenerateTokensResponse, PromptConfig, RefineTokensRequest, RefineTokensResponse } from "./types";

export class GroqClient extends AIClient {
  private baseURL = "https://api.groq.com/openai/v1";

  async generateTokens(colors: ColorInput[], promptConfig: PromptConfig): Promise<GenerateTokensResponse> {
    const prompt = this.buildPrompt(colors, promptConfig);

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a design system expert. Return ONLY valid JSON, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from Groq");

    return JSON.parse(content);
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
        model: this.config.model || "llama-3.1-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a design system expert. Return ONLY valid JSON, no explanations.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No response from Groq");

    return JSON.parse(content);
  }
}
