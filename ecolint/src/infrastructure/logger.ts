import { OutputChannel } from 'vscode';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private outputChannel: OutputChannel | undefined;
  private logLevel: LogLevel = 'info';

  public setOutputChannel(channel: OutputChannel): void {
    this.outputChannel = channel;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, data);
    }
  }

  public info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, data);
    }
  }

  public warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, data);
    }
  }

  public error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('ERROR', message, { error: errorMessage });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  private log(level: string, message: string, data?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }

    if (this.outputChannel) {
      this.outputChannel.appendLine(logMessage);
    }
  }
}