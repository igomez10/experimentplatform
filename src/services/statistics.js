/**
 * Statistical analysis functions for the experiment platform.
 */

/**
 * Calculates the mean of an array of numbers.
 */
export function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculates the standard deviation of an array of numbers.
 */
export function standardDeviation(arr) {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Performs an independent samples t-test (Welch's t-test).
 * This test does not assume equal variances.
 *
 * @param {number[]} sample1 - First sample array
 * @param {number[]} sample2 - Second sample array
 * @returns {Object} - Test results including t-statistic, p-value, and significance
 */
export function independentTTest(sample1, sample2) {
  const n1 = sample1.length;
  const n2 = sample2.length;

  const mean1 = mean(sample1);
  const mean2 = mean(sample2);

  const std1 = standardDeviation(sample1);
  const std2 = standardDeviation(sample2);

  const var1 = std1 * std1;
  const var2 = std2 * std2;

  // Welch's t-test
  const se = Math.sqrt(var1 / n1 + var2 / n2);
  const tStatistic = (mean1 - mean2) / se;

  // Welch-Satterthwaite degrees of freedom
  const numerator = Math.pow(var1 / n1 + var2 / n2, 2);
  const denominator =
    Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1);
  const df = numerator / denominator;

  // Calculate two-tailed p-value using t-distribution
  const pValue = 2 * (1 - tCDF(Math.abs(tStatistic), df));

  return {
    mean1,
    mean2,
    std1,
    std2,
    tStatistic,
    degreesOfFreedom: df,
    pValue,
    isSignificant: pValue < 0.05,
    effectSize: (mean1 - mean2) / Math.sqrt((var1 + var2) / 2), // Cohen's d approximation
  };
}

/**
 * Approximation of the t-distribution CDF using the regularized incomplete beta function.
 * This is accurate enough for practical purposes.
 */
function tCDF(t, df) {
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(x, df / 2, 0.5);
}

/**
 * Regularized incomplete beta function approximation.
 * Uses a continued fraction expansion for accurate results.
 */
function incompleteBeta(x, a, b) {
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use the continued fraction expansion
  const bt =
    Math.exp(
      gammaLn(a + b) -
        gammaLn(a) -
        gammaLn(b) +
        a * Math.log(x) +
        b * Math.log(1 - x)
    );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaCF(x, a, b)) / a;
  } else {
    return 1 - (bt * betaCF(1 - x, b, a)) / b;
  }
}

/**
 * Continued fraction for incomplete beta function.
 */
function betaCF(x, a, b) {
  const maxIterations = 100;
  const epsilon = 1e-10;

  let m = 1;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;

  if (Math.abs(d) < epsilon) d = epsilon;
  d = 1 / d;
  let h = d;

  for (let i = 1; i <= maxIterations; i++) {
    let m2 = 2 * i;

    // Even step
    let aa = (i * (b - i) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    h *= d * c;

    // Odd step
    aa = (-(a + i) * (qab + i) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < epsilon) d = epsilon;
    c = 1 + aa / c;
    if (Math.abs(c) < epsilon) c = epsilon;
    d = 1 / d;
    let del = d * c;
    h *= del;

    if (Math.abs(del - 1) < epsilon) break;
  }

  return h;
}

/**
 * Log gamma function using Lanczos approximation.
 */
function gammaLn(z) {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - gammaLn(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }

  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
