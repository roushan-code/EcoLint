import { workspace, ConfigurationChangeEvent } from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface EcoLintConfig {
  apiEndpoint: string;
  enableNotifications: boolean;
  autoAnalyze: boolean;
  analysisTimeout: number;
  logLevel: LogLevel;
}

export class ConfigurationService {
  private readonly configPrefix = 'ecolint';

  public getConfig(): EcoLintConfig {
    const config = workspace.getConfiguration(this.configPrefix);
    return {
      apiEndpoint: config.get<string>('apiEndpoint', 'http://localhost:3000'),
      enableNotifications: config.get<boolean>('enableNotifications', true),
      autoAnalyze: config.get<boolean>('autoAnalyze', false),
      analysisTimeout: config.get<number>('analysisTimeout', 30000),
      logLevel: config.get<LogLevel>('logLevel', 'info'),
    };
  }

  public getApiEndpoint(): string {
    return this.getConfig().apiEndpoint;
  }

  public getEnableNotifications(): boolean {
    return this.getConfig().enableNotifications;
  }

  public getAutoAnalyze(): boolean {
    return this.getConfig().autoAnalyze;
  }

  public getAnalysisTimeout(): number {
    return this.getConfig().analysisTimeout;
  }

  public getLogLevel(): LogLevel {
    return this.getConfig().logLevel;
  }

  public onConfigurationChange(callback: (config: EcoLintConfig) => void): void {
    void workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
      if (event.affectsConfiguration(this.configPrefix)) {
        callback(this.getConfig());
      }
    });
  }
}