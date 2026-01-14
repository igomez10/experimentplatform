/**
 * Mock LLM Provider - Simulates LLM responses for testing
 */

export class MockProvider {
  constructor(config = {}) {
    this.name = 'mock';
    this.delay = config.delay ?? { min: 20, max: 50 };
  }

  /**
   * Rate an image on a scale (mock implementation)
   * @param {string} imageBase64 - Base64 encoded image data
   * @param {string} question - The question to ask about the image
   * @returns {Promise<number>} Rating between 1-10
   */
  async rateImage(imageBase64, question) {
    // Simulate network delay
    const delayMs = this.delay.min + Math.random() * (this.delay.max - this.delay.min);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Generate rating based on image hash for consistency
    const hash = this.simpleHash(imageBase64);
    const baseRating = 3 + (hash % 5); // Base rating between 3-7
    const variation = (Math.random() - 0.5) * 4;

    return Math.round(Math.min(10, Math.max(1, baseRating + variation)));
  }

  /**
   * Check if the provider is available
   */
  async isAvailable() {
    return true;
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      name: 'Mock Provider',
      description: 'Simulated responses for testing',
      supportsVision: true,
    };
  }

  simpleHash(str) {
    let hash = 0;
    const sampleSize = Math.min(str.length, 1000);
    for (let i = 0; i < sampleSize; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}
