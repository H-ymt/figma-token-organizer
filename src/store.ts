import { create } from "zustand";

export type AIProvider = "groq" | "claude" | "zai" | "ollama" | "openai-compatible";
export type NamingStyle = "tailwind" | "material" | "custom";

interface ConfigStore {
  // AI設定
  provider: AIProvider;
  groqApiKey: string;
  claudeApiKey: string;
  zaiApiKey: string;
  ollamaBaseURL: string;
  ollamaModel: string;
  openaiCompatibleBaseURL: string;
  openaiCompatibleApiKey: string;
  openaiCompatibleModel: string;

  // プロンプト設定
  namingStyle: NamingStyle;
  existingTokens: string; // 既存トークンの例

  // AI設定のセッター
  setProvider: (provider: AIProvider) => void;
  setGroqApiKey: (apiKey: string) => void;
  setClaudeApiKey: (apiKey: string) => void;
  setZaiApiKey: (apiKey: string) => void;
  setOllamaBaseURL: (url: string) => void;
  setOllamaModel: (model: string) => void;
  setOpenaiCompatibleBaseURL: (url: string) => void;
  setOpenaiCompatibleApiKey: (apiKey: string) => void;
  setOpenaiCompatibleModel: (model: string) => void;

  // プロンプト設定のセッター
  setNamingStyle: (style: NamingStyle) => void;
  setExistingTokens: (tokens: string) => void;
}

export const useConfigStore = create<ConfigStore>()((set) => ({
  // AI設定
  provider: "ollama",
  groqApiKey: "",
  claudeApiKey: "",
  zaiApiKey: "",
  ollamaBaseURL: "http://localhost:11434/v1",
  ollamaModel: "gemma3",
  openaiCompatibleBaseURL: "",
  openaiCompatibleApiKey: "",
  openaiCompatibleModel: "",

  // プロンプト設定
  namingStyle: "custom",
  existingTokens: "",

  // AI設定のセッター
  setProvider: (provider) => set({ provider }),
  setGroqApiKey: (groqApiKey) => set({ groqApiKey }),
  setClaudeApiKey: (claudeApiKey) => set({ claudeApiKey }),
  setZaiApiKey: (zaiApiKey) => set({ zaiApiKey }),
  setOllamaBaseURL: (ollamaBaseURL) => set({ ollamaBaseURL }),
  setOllamaModel: (ollamaModel) => set({ ollamaModel }),
  setOpenaiCompatibleBaseURL: (openaiCompatibleBaseURL) => set({ openaiCompatibleBaseURL }),
  setOpenaiCompatibleApiKey: (openaiCompatibleApiKey) => set({ openaiCompatibleApiKey }),
  setOpenaiCompatibleModel: (openaiCompatibleModel) => set({ openaiCompatibleModel }),

  // プロンプト設定のセッター
  setNamingStyle: (namingStyle) => set({ namingStyle }),
  setExistingTokens: (existingTokens) => set({ existingTokens }),
}));
