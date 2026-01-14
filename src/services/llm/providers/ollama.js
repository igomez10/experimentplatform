/**
 * Ollama LLM Provider - Uses local Ollama for vision model inference
 */

export class OllamaProvider {
  constructor(config = {}) {
    this.name = 'ollama';
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
    this.model = config.model ?? 'llama3.2-vision:latest';
  }

  /**
   * Rate an image on a scale using Ollama vision model
   * @param {string} imageBase64 - Base64 encoded image data (with or without data URL prefix)
   * @param {string} question - The question to ask about the image
   * @returns {Promise<number>} Rating between 1-10
   */
  async rateImage(imageBase64, question) {
    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const prompt = `${question}

IMPORTANT: You must respond with ONLY a single number between 1 and 10. No words, no explanation, just the number.`;

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: prompt,
            images: [base64Data],
          },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 10, // Limit response length
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.message?.content?.trim() ?? '';

    // Extract number from response
    const rating = this.extractRating(content);
    return rating;
  }

  /**
   * Extract a rating number from LLM response
   */
  extractRating(response) {
    // Try to find a number between 1-10 in the response
    const match = response.match(/\b([1-9]|10)\b/);
    if (match) {
      return parseInt(match[1], 10);
    }

    // Fallback: if no valid number found, return middle value
    console.warn(`Could not extract rating from: "${response}", using default 5`);
    return 5;
  }

  /**
   * Check if Ollama is available and has the required model
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return false;

      const data = await response.json();
      const models = data.models?.map(m => m.name) ?? [];
      return models.some(m => m.includes('vision') || m === this.model);
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = await response.json();
      return data.models ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: 'Ollama',
      description: `Local LLM inference using ${this.model}`,
      supportsVision: true,
      model: this.model,
      baseUrl: this.baseUrl,
    };
  }
}
