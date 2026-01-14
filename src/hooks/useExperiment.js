import { useState, useCallback } from 'react';
import { getProvider } from '../services/llm';
import { independentTTest } from '../services/statistics';

/**
 * Custom hook for running experiments.
 */
export function useExperiment() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const runExperiment = useCallback(async (
    image1Data,
    image2Data,
    question,
    providerName = 'mock',
    providerConfig = {},
    sampleSize = 50
  ) => {
    setIsRunning(true);
    setError(null);
    setResults(null);
    setProgress({ current: 0, total: sampleSize * 2 });

    try {
      const provider = getProvider(providerName, providerConfig);

      // Check if provider is available
      const available = await provider.isAvailable();
      if (!available) {
        throw new Error(`Provider "${providerName}" is not available. Make sure the service is running.`);
      }

      // Collect ratings for both images
      const ratings1 = [];
      const ratings2 = [];

      // Run ratings for image 1
      for (let i = 0; i < sampleSize; i++) {
        const rating = await provider.rateImage(image1Data, question);
        ratings1.push(rating);
        setProgress(p => ({ ...p, current: p.current + 1 }));
      }

      // Run ratings for image 2
      for (let i = 0; i < sampleSize; i++) {
        const rating = await provider.rateImage(image2Data, question);
        ratings2.push(rating);
        setProgress(p => ({ ...p, current: p.current + 1 }));
      }

      // Perform statistical analysis
      const stats = independentTTest(ratings1, ratings2);

      setResults({
        image1: {
          ratings: ratings1,
          mean: stats.mean1,
          std: stats.std1,
        },
        image2: {
          ratings: ratings2,
          mean: stats.mean2,
          std: stats.std2,
        },
        statistics: {
          tStatistic: stats.tStatistic,
          degreesOfFreedom: stats.degreesOfFreedom,
          pValue: stats.pValue,
          isSignificant: stats.isSignificant,
          effectSize: stats.effectSize,
        },
        provider: provider.getInfo(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
    setProgress({ current: 0, total: 0 });
  }, []);

  return {
    runExperiment,
    isRunning,
    progress,
    results,
    error,
    reset,
  };
}
