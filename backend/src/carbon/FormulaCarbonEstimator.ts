/**
 * Formula-Based Carbon Estimator
 * 
 * Implements deterministic carbon estimation using the following formulas:
 * 
 * Power(W) = 20 + (CPU% × 0.45) + (Memory_MB × 0.015)
 * Energy(Wh) = Power × Runtime(ms) / 3,600,000
 * CO₂(g) = Energy × GridCarbonIntensity / 1000
 * 
 * @example
 * ```typescript
 * const estimator = new FormulaCarbonEstimator(450); // 450 gCO₂/kWh
 * const result = estimator.estimate(1000, 50, 128);
 * // Returns: { powerWatts: 42.42, energyWattHours: 0.0118, carbonGrams: 0.0053, gridCarbonIntensity: 450 }
 * ```
 */

import { CarbonEstimate } from '../types/benchmark';
import { CarbonEstimator } from './CarbonEstimator';

/**
 * Default grid carbon intensity in gCO₂/kWh
 * Global average is approximately 450 gCO₂/kWh
 */
export const DEFAULT_GRID_CARBON_INTENSITY = 450;

/**
 * Formula-based carbon estimator
 * 
 * Uses deterministic formulas to estimate power consumption,
 * energy usage, and carbon emissions from benchmark metrics.
 */
export class FormulaCarbonEstimator implements CarbonEstimator {
  private readonly gridCarbonIntensity: number;

  /**
   * Create a new FormulaCarbonEstimator
   * 
   * @param gridCarbonIntensity - Grid carbon intensity in gCO₂/kWh (default: 450)
   */
  constructor(gridCarbonIntensity: number = DEFAULT_GRID_CARBON_INTENSITY) {
    this.gridCarbonIntensity = gridCarbonIntensity;
  }

  /**
   * Estimate carbon footprint from benchmark metrics
   * 
   * @param runtimeMs - Execution time in milliseconds
   * @param cpuPercent - Average CPU usage percentage (0-100)
   * @param memoryMB - Peak memory usage in megabytes
   * @returns CarbonEstimate with power, energy, and carbon values
   */
  estimate(runtimeMs: number, cpuPercent: number, memoryMB: number): CarbonEstimate {
    // Calculate power consumption in watts
    // Base power: 20W (idle system overhead)
    // CPU contribution: 0.45W per 1% CPU usage
    // Memory contribution: 0.015W per 1MB memory
    const powerWatts = 20 + (cpuPercent * 0.45) + (memoryMB * 0.015);

    // Calculate energy consumption in watt-hours
    // Energy(Wh) = Power(W) × Time(h) = Power(W) × Runtime(ms) / 3,600,000
    const energyWattHours = (powerWatts * runtimeMs) / 3_600_000;

    // Calculate carbon emissions in grams
    // CO₂(g) = Energy(Wh) / 1000 × GridCarbonIntensity(gCO₂/kWh)
    // Since Energy is in Wh and GridCarbonIntensity is in gCO₂/kWh:
    // CO₂(g) = Energy(Wh) × GridCarbonIntensity / 1000
    const carbonGrams = (energyWattHours * this.gridCarbonIntensity) / 1000;

    return {
      powerWatts: Math.round(powerWatts * 1000) / 1000,
      energyWattHours: Math.round(energyWattHours * 1000000) / 1000000,
      carbonGrams: Math.round(carbonGrams * 1000000) / 1000000,
      gridCarbonIntensity: this.gridCarbonIntensity,
    };
  }

  /**
   * Get the configured grid carbon intensity
   */
  getGridCarbonIntensity(): number {
    return this.gridCarbonIntensity;
  }
}