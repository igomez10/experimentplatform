/**
 * LLM Wrapper - Unified interface for different LLM providers
 */

import { MockProvider } from './providers/mock.js';
import { OllamaProvider } from './providers/ollama.js';

const providers = {
  mock: MockProvider,
  ollama: OllamaProvider,
};

/**
 * Get an LLM provider instance
 * @param {string} providerName - Name of the provider ('mock' | 'ollama')
 * @param {Object} config - Provider-specific configuration
 * @returns {Object} Provider instance
 */
export function getProvider(providerName, config = {}) {
  const Provider = providers[providerName];
  if (!Provider) {
    throw new Error(`Unknown provider: ${providerName}. Available: ${Object.keys(providers).join(', ')}`);
  }
  return new Provider(config);
}

/**
 * List available providers
 */
export function listProviders() {
  return Object.keys(providers);
}

export { MockProvider, OllamaProvider };
