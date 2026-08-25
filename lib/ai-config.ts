export type AIProviderId = 'gemini' | 'groq' | 'openai' | 'openrouter' | 'anthropic';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  badge: string;
  isFreeTierAvailable: boolean;
  defaultModel: string;
  availableModels: { id: string; name: string; isDefault?: boolean }[];
  apiKeyPlaceholder: string;
  apiKeyHelpUrl: string;
  apiKeyHelpText: string;
}

export const AI_PROVIDERS: Record<AIProviderId, AIProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Rekomendasi (Free Tier)',
    isFreeTierAvailable: true,
    defaultModel: 'gemini-2.5-flash',
    availableModels: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Terbaru & Cepat)', isDefault: true },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Stabil)' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)' },
    ],
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
    apiKeyHelpText: 'Dapatkan API Key gratis di Google AI Studio (tanpa kartu kredit)',
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra Fast (Free Tier)',
    isFreeTierAvailable: true,
    defaultModel: 'llama-3.3-70b-versatile',
    availableModels: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Cerdas & Cepat)', isDefault: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Super Cepat)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    ],
    apiKeyPlaceholder: 'gsk_...',
    apiKeyHelpUrl: 'https://console.groq.com/keys',
    apiKeyHelpText: 'Dapatkan API Key gratis di Groq Cloud Console',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Official GPT',
    isFreeTierAvailable: false,
    defaultModel: 'gpt-4o-mini',
    availableModels: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Hemat & Cepat)', isDefault: true },
      { id: 'gpt-4o', name: 'GPT-4o (Flagship Model)' },
    ],
    apiKeyPlaceholder: 'sk-proj-...',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    apiKeyHelpText: 'Dapatkan API Key di OpenAI Platform Dashboard',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Multi-Model Hub',
    isFreeTierAvailable: true,
    defaultModel: 'deepseek/deepseek-chat',
    availableModels: [
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (DeepSeek Chat)', isDefault: true },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free Model)' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free Model)' },
    ],
    apiKeyPlaceholder: 'sk-or-v1-...',
    apiKeyHelpUrl: 'https://openrouter.ai/keys',
    apiKeyHelpText: 'Dapatkan API Key di OpenRouter API Keys',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude 3.5',
    isFreeTierAvailable: false,
    defaultModel: 'claude-3-5-haiku-latest',
    availableModels: [
      { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku (Cepat & Tajam)', isDefault: true },
      { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet (Advanced Reasoning)' },
    ],
    apiKeyPlaceholder: 'sk-ant-api03-...',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyHelpText: 'Dapatkan API Key di Anthropic Console',
  },
};
