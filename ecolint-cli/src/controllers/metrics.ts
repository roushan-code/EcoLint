export interface TelemetryMetrics {
  originalTokens: number;
  optimizedTokens: number;
  tokenSavings: number;
  estimatedRuntimeSavingsMs: number;
  estimatedRamReductionMb: number;
  carbonSavedGrams: number;
  costSavedCents: number;
}

export function computeMetrics(originalCode: string, optimizedCode: string, isMaxPerformance: boolean): TelemetryMetrics {
  // Rough token estimation: ~4 characters per token
  const originalTokens = Math.ceil(originalCode.length / 4);
  const optimizedTokens = Math.ceil(optimizedCode.length / 4);
  const tokenSavings = Math.max(0, originalTokens - optimizedTokens);

  // Simulated metrics based on mode and savings
  const performanceMultiplier = isMaxPerformance ? 2.5 : 1.2;
  
  const estimatedRuntimeSavingsMs = Math.round((tokenSavings * 0.15) * performanceMultiplier);
  const estimatedRamReductionMb = Number(((tokenSavings * 0.05) * performanceMultiplier).toFixed(2));
  
  // Rough carbon estimate: 0.0001g CO2e per ms saved
  const carbonSavedGrams = Number((estimatedRuntimeSavingsMs * 0.0001).toFixed(4));
  
  // Cost: $0.000001 per token saved -> converted to cents
  const costSavedCents = Number((tokenSavings * 0.0001).toFixed(4));

  return {
    originalTokens,
    optimizedTokens,
    tokenSavings,
    estimatedRuntimeSavingsMs,
    estimatedRamReductionMb,
    carbonSavedGrams,
    costSavedCents
  };
}

export function printMetrics(metrics: TelemetryMetrics) {
  console.log('\n📊 ' + '\x1b[1m\x1b[36mEco Metrics: Impact Evaluation\x1b[0m');
  console.log('----------------------------------------');
  console.log(`⏱️  Runtime Latency Differential: \x1b[32m-${metrics.estimatedRuntimeSavingsMs}ms\x1b[0m`);
  console.log(`💾 Hardware Overhead (RAM):     \x1b[32m-${metrics.estimatedRamReductionMb}MB\x1b[0m`);
  console.log(`🪙  Token Awareness Layer:       \x1b[33m${metrics.tokenSavings} tokens saved\x1b[0m (Orig: ${metrics.originalTokens} | Opt: ${metrics.optimizedTokens})`);
  console.log(`🍃 Carbon Footprint Reduction:  \x1b[32m-${metrics.carbonSavedGrams}g CO2e\x1b[0m`);
  console.log(`💵 Cloud FinOps Cost Savings:   \x1b[32m$${(metrics.costSavedCents / 100).toFixed(6)}\x1b[0m`);
  console.log('----------------------------------------\n');
}
