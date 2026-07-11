/**
 * Carbon Estimator Interface
 * 
 * This interface defines the contract for carbon estimation.
 * It allows for easy replacement of the formula-based estimator
 * with an ML model in the future.
 * 
 * @example
 * ```typescript
 * // Using formula estimator (default)
 * const estimator = new FormulaCarbonEstimator(450);
 * const result = estimator.estimate(1000, 50, 128);
 * 
 * // Later, replace with ML model
 * const mlEstimator = new MLCarbonEstimator(modelPath);
 * const result = mlEstimator.estimate(1000, 50, 128);
 * ```
 */

import { CarbonEstimate } from '../types/benchmark';

/**
 * Interface for carbon footprint estimation
 * 
 * Implementations can use different methods:
 * - Formula-based (deterministic)
 * - ML-based (trained model)
 * - Hardware-specific measurements
 */
export interface CarbonEstimator {
  /**
   * Estimate carbon footprint from benchmark metrics
   * 
   * @param runtimeMs - Execution time in milliseconds
   * @param cpuPercent - Average CPU usage percentage (0-100)
   * @param memoryMB - Peak memory usage in megabytes
   * @returns CarbonEstimate with power, energy, and carbon values
   */
  estimate(runtimeMs: number, cpuPercent: number, memoryMB: number): CarbonEstimate;
}