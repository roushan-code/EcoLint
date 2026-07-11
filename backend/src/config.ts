import 'dotenv/config';

interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  githubToken: string;
  sandboxTimeout: number;
  sandboxMaxMemory: number;
  openaiApiKey: string;
  openaiEndpoint: string;
  openaiModelName: string;
  // Benchmark configuration
  benchmarkTimeout: number;
  e2bApiKey: string;
  gridCarbonIntensity: number;
}

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireEnvNumber(key: string, fallback?: number): number {
  const value = process.env[key];
  if (value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid number for environment variable: ${key}`);
    }
    return parsed;
  }
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Missing required environment variable: ${key}`);
}

export const config: Config = {
  port: requireEnvNumber('PORT', 3000),
  nodeEnv: requireEnv('NODE_ENV', 'development'),
  logLevel: requireEnv('LOG_LEVEL', 'info'),
  githubToken: requireEnv('GITHUB_TOKEN', ''),
  sandboxTimeout: requireEnvNumber('SANDBOX_TIMEOUT', 30000),
  sandboxMaxMemory: requireEnvNumber('SANDBOX_MAX_MEMORY', 512),
  openaiApiKey: requireEnv('OPENAI_API_KEY', ''),
  openaiEndpoint: requireEnv('OPENAI_ENDPOINT', 'https://api.openai.com/v1'),
  openaiModelName: requireEnv('OPENAI_MODEL_NAME', 'gpt-4o-mini'),
  // Benchmark configuration
  benchmarkTimeout: requireEnvNumber('BENCHMARK_TIMEOUT', 30000),
  e2bApiKey: requireEnv('E2B_API_KEY', ''),
  gridCarbonIntensity: requireEnvNumber('GRID_CARBON_INTENSITY', 450),
};
