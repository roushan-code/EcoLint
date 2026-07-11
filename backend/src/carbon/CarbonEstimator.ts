/**
 * Carbon Estimator Interface
 * 
 * Defines the contract for carbon estimation implementations.
 * This interface allows for different estimation strategies (formula-based, ML-based, etc.)
 */

import { CarbonEstimate } from '../types/benchmark';

/**
 * Carbon Estimator Interface
 * 
 * Implementations of this interface provide carbon footprint estimation
 * based on benchmark execution metrics.
 */
export interface CarbonEstimator {
  /**
   * Estimate carbon footprint from benchmark metrics
   * 
   * @param runtimeMs - Execution time in milliseconds
   * @param cpuPercent - Average CPU usage percentage
   * @param memoryMB - Peak memory usage in MB
   * @returns Carbon estimate with power, energy, and carbon values
   */
  estimate(runtimeMs: number, cpuPercent: number, memoryMB: number): CarbonEstimate;

  /**
   * Get the name of the estimation method
   */
  getMethodName(): string;
}