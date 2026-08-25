export type AIProviderId = 'gemini' | 'groq' | 'openai' | 'openrouter' | 'anthropic';

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  badge: string;
  isFreeTierAvailable: boolean;
  defaultModel: string;
  exampleModels: { id: string; label: string; isDefault?: boolean }[];
  apiKeyPlaceholder: string;
  apiKeyHelpUrl: string;
  apiKeyHelpText: string;
  modelPlaceholder: string;
}

export const AI_PROVIDERS: Record<AIProviderId, AIProviderConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Rekomendasi (Free Tier)',
    isFreeTierAvailable: true,
    defaultModel: 'gemini-2.5-flash',
    exampleModels: [
      { id: 'gemini-2.5-flash', label: 'gemini-2.5-flash', isDefault: true },
      { id: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
      { id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    ],
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHelpUrl: 'https://aistudio.google.com/app/apikey',
    apiKeyHelpText: 'Dapatkan API Key gratis di Google AI Studio (tanpa kartu kredit)',
    modelPlaceholder: 'contoh: gemini-2.5-flash',
  },
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Ultra Fast (Free Tier)',
    isFreeTierAvailable: true,
    defaultModel: 'llama-3.3-70b-versatile',
    exampleModels: [
      { id: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile', isDefault: true },
      { id: 'deepseek-r1-distill-llama-70b', label: 'deepseek-r1-distill-llama-70b' },
      { id: 'qwen-2.5-32b', label: 'qwen-2.5-32b' },
      { id: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant' },
    ],
    apiKeyPlaceholder: 'gsk_...',
    apiKeyHelpUrl: 'https://console.groq.com/keys',
    apiKeyHelpText: 'Dapatkan API Key gratis di Groq Cloud Console',
    modelPlaceholder: 'contoh: llama-3.3-70b-versatile',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Official GPT',
    isFreeTierAvailable: false,
    defaultModel: 'gpt-4o-mini',
    exampleModels: [
      { id: 'gpt-4o-mini', label: 'gpt-4o-mini', isDefault: true },
      { id: 'gpt-4o', label: 'gpt-4o' },
      { id: 'o3-mini', label: 'o3-mini' },
      { id: 'o1-mini', label: 'o1-mini' },
    ],
    apiKeyPlaceholder: 'sk-proj-...',
    apiKeyHelpUrl: 'https://platform.openai.com/api-keys',
    apiKeyHelpText: 'Dapatkan API Key di OpenAI Platform Dashboard',
    modelPlaceholder: 'contoh: gpt-4o-mini',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Multi-Model Hub',
    isFreeTierAvailable: true,
    defaultModel: 'deepseek/deepseek-chat',
    exampleModels: [
      { id: 'deepseek/deepseek-chat', label: 'deepseek/deepseek-chat', isDefault: true },
      { id: 'deepseek/deepseek-r1', label: 'deepseek/deepseek-r1' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'meta-llama/llama-3.3-70b-instruct' },
      { id: 'google/gemini-2.5-flash', label: 'google/gemini-2.5-flash' },
    ],
    apiKeyPlaceholder: 'sk-or-v1-...',
    apiKeyHelpUrl: 'https://openrouter.ai/keys',
    apiKeyHelpText: 'Dapatkan API Key di OpenRouter API Keys',
    modelPlaceholder: 'contoh: deepseek/deepseek-chat',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude 3.7 / 3.5',
    isFreeTierAvailable: false,
    defaultModel: 'claude-3-7-sonnet-latest',
    exampleModels: [
      { id: 'claude-3-7-sonnet-latest', label: 'claude-3-7-sonnet-latest', isDefault: true },
      { id: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest' },
      { id: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest' },
    ],
    apiKeyPlaceholder: 'sk-ant-api03-...',
    apiKeyHelpUrl: 'https://console.anthropic.com/settings/keys',
    apiKeyHelpText: 'Dapatkan API Key di Anthropic Console',
    modelPlaceholder: 'contoh: claude-3-7-sonnet-latest',
  },
};
