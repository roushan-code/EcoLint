/**
 * Formula-Based Carbon Estimator
 * 
 * Estimates carbon footprint using a deterministic formula based on
 * CPU usage and memory consumption.
 * 
 * Formula:
 *   Power(W) = 20 + (CPU% × 0.45) + (Memory_MB × 0.015)
 *   Energy(Wh) = Power × Runtime(ms) / 3,600,000
 *   CO₂(g) = Energy × GridCarbonIntensity / 1000
 * 
 * Default GridCarbonIntensity: 450 gCO₂/kWh (global average)
 */

import { CarbonEstimator } from './CarbonEstimator';
import { CarbonEstimate } from '../types/benchmark';

/**
 * Configuration for the FormulaCarbonEstimator
 */
export interface FormulaCarbonEstimatorConfig {
  /** Grid carbon intensity in gCO₂/kWh (default: 450) */
  gridCarbonIntensity?: number;
  /** Base power consumption in Watts (default: 20) */
  basePowerWatts?: number;
  /** CPU power coefficient (default: 0.45) */
  cpuCoefficient?: number;
  /** Memory power coefficient (default: 0.015) */
  memoryCoefficient?: number;
}

/**
 * Formula-based carbon estimator implementation
 * 
 * Uses a deterministic formula to estimate power consumption,
 * energy usage, and carbon emissions based on runtime metrics.
 */
export class FormulaCarbonEstimator implements CarbonEstimator {
  private readonly gridCarbonIntensity: number;
  private readonly basePowerWatts: number;
  private readonly cpuCoefficient: number;
  private readonly memoryCoefficient: number;

  /**
   * Create a new FormulaCarbonEstimator
   * 
   * @param config - Optional configuration parameters
   */
  constructor(config: FormulaCarbonEstimatorConfig = {}) {
    this.gridCarbonIntensity = config.gridCarbonIntensity ?? 450;
    this.basePowerWatts = config.basePowerWatts ?? 20;
    this.cpuCoefficient = config.cpuCoefficient ?? 0.45;
    this.memoryCoefficient = config.memoryCoefficient ?? 0.015;
  }

  /**
   * Estimate carbon footprint from benchmark metrics
   * 
   * @param runtimeMs - Execution time in milliseconds
   * @param cpuPercent - Average CPU usage percentage
   * @param memoryMB - Peak memory usage in MB
   * @returns Carbon estimate with power, energy, and carbon values
   */
  estimate(runtimeMs: number, cpuPercent: number, memoryMB: number): CarbonEstimate {
    // Calculate power consumption in Watts
    // Power(W) = Base + (CPU% × CPU_Coefficient) + (Memory_MB × Memory_Coefficient)
    const powerWatts = this.calculatePower(cpuPercent, memoryMB);

    // Calculate energy consumption in Watt-hours
    // Energy(Wh) = Power × Runtime(ms) / 3,600,000
    const energyWattHours = this.calculateEnergy(powerWatts, runtimeMs);

    // Calculate carbon emissions in grams
    // CO₂(g) = Energy(Wh) / 1000 × GridCarbonIntensity
    const carbonGrams = this.calculateCarbon(energyWattHours);

    return {
      powerWatts: Math.round(powerWatts * 1000) / 1000,
      energyWattHours: Math.round(energyWattHours * 10000) / 10000,
      carbonGrams: Math.round(carbonGrams * 10000) / 10000,
    };
  }

  /**
   * Calculate power consumption in Watts
   * 
   * @param cpuPercent - CPU usage percentage
   * @param memoryMB - Memory usage in MB
   * @returns Power in Watts
   */
  private calculatePower(cpuPercent: number, memoryMB: number): number {
    const cpuPower = cpuPercent * this.cpuCoefficient;
    const memoryPower = memoryMB * this.memoryCoefficient;
    return this.basePowerWatts + cpuPower + memoryPower;
  }

  /**
   * Calculate energy consumption in Watt-hours
   * 
   * @param powerWatts - Power in Watts
   * @param runtimeMs - Runtime in milliseconds
   * @returns Energy in Watt-hours
   */
  private calculateEnergy(powerWatts: number, runtimeMs: number): number {
    // Convert milliseconds to hours: ms / 3,600,000
    const runtimeHours = runtimeMs / 3_600_000;
    return powerWatts * runtimeHours;
  }

  /**
   * Calculate carbon emissions in grams
   * 
   * @param energyWattHours - Energy in Watt-hours
   * @returns Carbon in grams
   */
  private calculateCarbon(energyWattHours: number): number {
    // Convert Wh to kWh and multiply by gCO₂/kWh
    const energyKwh = energyWattHours / 1000;
    return energyKwh * this.gridCarbonIntensity;
  }

  /**
   * Get the name of the estimation method
   */
  getMethodName(): string {
    return 'formula';
  }

  /**
   * Get the current configuration
   */
  getConfig(): FormulaCarbonEstimatorConfig {
    return {
      gridCarbonIntensity: this.gridCarbonIntensity,
      basePowerWatts: this.basePowerWatts,
      cpuCoefficient: this.cpuCoefficient,
      memoryCoefficient: this.memoryCoefficient,
    };
  }
}