/**
 * E2B Sandbox Service
 * 
 * Handles code execution in isolated E2B sandboxes.
 * Provides secure, sandboxed execution environment for untrusted code.
 * Falls back to local execution if E2B is not configured.
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { logger } from '../infrastructure/logger';
import { SandboxExecutionResult } from '../types/benchmark';

export interface E2BConfig {
  /** E2B API key */
  apiKey: string;
  /** Default execution timeout in ms */
  timeout: number;
  /** Maximum memory in MB */
  maxMemory: number;
}

/**
 * Language to file extension mapping
 */
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  python: 'py',
  javascript: 'js',
  typescript: 'ts',
  go: 'go',
  rust: 'rs',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
};

/**
 * Language to execution command mapping
 */
const LANGUAGE_COMMANDS: Record<string, string> = {
  python: 'python3',
  javascript: 'node',
  typescript: 'npx ts-node',
  go: 'go run',
  rust: 'rustc',
  java: 'javac',
  c: 'gcc',
  cpp: 'g++',
};

/**
 * E2B Sandbox execution service
 * 
 * Provides isolated code execution using E2B sandboxes.
 * Falls back to local execution if E2B is not configured.
 */
export class E2BSandboxService {
  private readonly config: E2BConfig;
  private readonly useE2B: boolean;

  /**
   * Create a new E2BSandboxService
   * 
   * @param config - E2B configuration
   */
  constructor(config: E2BConfig) {
    this.config = config;
    this.useE2B = Boolean(config.apiKey);
    
    if (!this.useE2B) {
      logger.warn('E2B API key not configured, sandbox execution will use local fallback');
    }
  }

  /**
   * Execute code in a sandbox
   * 
   * @param code - Source code to execute
   * @param language - Programming language
   * @param timeout - Execution timeout in ms
   * @returns Execution result
   */
  async executeInSandbox(
    code: string,
    language: string,
    timeout: number = this.config.timeout
  ): Promise<SandboxExecutionResult> {
    if (this.useE2B) {
      try {
        return await this.executeInE2B(code, language, timeout);
      } catch (error) {
        logger.error('E2B sandbox execution failed, falling back to local', { error });
        return this.executeLocally(code, language, timeout);
      }
    }
    
    // Fallback to local execution
    return this.executeLocally(code, language, timeout);
  }

  /**
   * Execute code in E2B sandbox
   * 
   * @param code - Source code
   * @param language - Programming language
   * @param timeout - Timeout in ms
   * @returns Execution result
   */
  private async executeInE2B(
    code: string,
    language: string,
    timeout: number
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const lang = language.toLowerCase();

    logger.info(`Creating E2B sandbox for ${language}`);
    
    // Use the new @e2b/code-interpreter SDK
    const { Sandbox } = await import('@e2b/code-interpreter');
    
    const sandbox = await Sandbox.create({
      apiKey: this.config.apiKey,
    });

    const sandboxId = sandbox.sandboxId || 'unknown';
    logger.info(`E2B sandbox created: ${sandboxId}`);

    try {
      // Run code directly using runCode method
      // Map language names to what E2B expects
      const e2bLanguage = lang === 'javascript' || lang === 'typescript' ? 'javascript' : lang;
      
      // Use a longer timeout for complex code (up to 5 minutes)
      const e2bTimeout = Math.min(timeout * 2, 300000);
      
      const execution = await sandbox.runCode(code, {
        language: e2bLanguage,
        timeoutMs: e2bTimeout,
      });

      const runtime = Date.now() - startTime;

      // Extract stdout from logs
      const stdout = execution.logs?.stdout?.join('\n') || '';
      const stderr = execution.logs?.stderr?.join('\n') || '';

      // E2B doesn't provide direct memory metrics, estimate based on runtime
      // Complex code that runs longer typically uses more memory
      const peakMemory = Math.max(10, Math.round(runtime / 100));
      
      return {
        stdout,
        stderr,
        exitCode: execution.error ? 1 : 0,
        runtime,
        peakMemory,
        averageCpu: 0,
        metrics: [],
      };
    } finally {
      await sandbox.kill();
      logger.info('E2B sandbox closed');
    }
  }

  /**
   * Build execution command for a language
   * 
   * @param language - Programming language
   * @param fileName - Source file name
   * @returns Execution command
   */
  private buildCommand(language: string, fileName: string): string {
    switch (language) {
      case 'python':
        return `python3 ${fileName}`;
      case 'javascript':
        return `node ${fileName}`;
      case 'typescript':
        return `npx ts-node ${fileName}`;
      case 'go':
        return `go run ${fileName}`;
      case 'rust':
        return `rustc ${fileName} -o /tmp/program && /tmp/program`;
      case 'java':
        return `javac ${fileName} && java ${fileName.replace('.java', '')}`;
      case 'c':
        return `gcc ${fileName} -o /tmp/program && /tmp/program`;
      case 'cpp':
        return `g++ ${fileName} -o /tmp/program && /tmp/program`;
      default:
        return `${LANGUAGE_COMMANDS[language] || 'node'} ${fileName}`;
    }
  }

  /**
   * Execute code locally (fallback)
   * 
   * @param code - Source code
   * @param language - Programming language
   * @param timeout - Timeout in ms
   * @returns Execution result
   */
  private executeLocally(
    code: string,
    language: string,
    timeout: number
  ): Promise<SandboxExecutionResult> {
    const startTime = Date.now();
    const lang = language.toLowerCase();
    const extension = LANGUAGE_EXTENSIONS[lang];
    
    if (!extension) {
      return Promise.reject(new Error(`Unsupported language: ${language}`));
    }

    // Create temporary file
    const tempDir = os.tmpdir();
    const fileName = `ecolint-${randomUUID()}.${extension}`;
    const filePath = path.join(tempDir, fileName);
    
    return fs.promises.writeFile(filePath, code, 'utf-8')
      .then(() => {
        const command = LANGUAGE_COMMANDS[lang];
        
        if (!command) {
          return Promise.reject(new Error(`Unsupported language: ${language}`));
        }
        
        // For Java, we need to handle compilation and execution differently
        if (lang === 'java') {
          // Java needs special handling - compile first, then run
          return this.executeJavaCode(filePath, fileName, startTime, timeout);
        }
        
        return this.spawnProcess(command, [filePath], startTime, timeout);
      })
      .finally(async () => {
        // Cleanup temp file
        try {
          await fs.promises.unlink(filePath);
        } catch {
          // Ignore cleanup errors
        }
      });
  }

  /**
   * Execute Java code (compile and run)
   */
  private executeJavaCode(
    filePath: string,
    fileName: string,
    startTime: number,
    timeout: number
  ): Promise<SandboxExecutionResult> {
    const className = fileName.replace('.java', '') || 'Main';
    
    return new Promise<SandboxExecutionResult>((resolve, reject) => {
      // First compile
      const compileProc = spawn('javac', [filePath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let compileStdout = '';
      let compileStderr = '';

      compileProc.stdout?.on('data', (data: Buffer) => {
        compileStdout += data.toString();
      });

      compileProc.stderr?.on('data', (data: Buffer) => {
        compileStderr += data.toString();
      });

      compileProc.on('close', (exitCode) => {
        if (exitCode !== 0) {
          resolve({
            stdout: compileStdout,
            stderr: compileStderr,
            exitCode: exitCode ?? -1,
            runtime: Date.now() - startTime,
            peakMemory: 0,
            averageCpu: 0,
            metrics: [],
          });
          return;
        }

        // Then run
        this.spawnProcess('java', ['-cp', path.dirname(filePath), className], startTime, timeout)
          .then(resolve)
          .catch(reject);
      });

      compileProc.on('error', reject);

      // Set compile timeout
      setTimeout(() => {
        compileProc.kill('SIGTERM');
      }, timeout);
    });
  }

  /**
   * Spawn a process and return execution result
   */
  private spawnProcess(
    command: string,
    args: string[],
    startTime: number,
    timeout: number
  ): Promise<SandboxExecutionResult> {
    return new Promise<SandboxExecutionResult>((resolve, reject) => {
      const proc: ChildProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      let peakMemory = 0;

      const timeoutHandle = setTimeout(() => {
        proc.kill('SIGTERM');
      }, timeout);

      proc.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Collect memory metrics periodically
      const metricsInterval = setInterval(() => {
        if (proc.pid) {
          this.getProcessMemory(proc.pid).then((mem) => {
            peakMemory = Math.max(peakMemory, mem);
          }).catch(() => {
            // Ignore errors
          });
        }
      }, 100);

      proc.on('close', (exitCode) => {
        clearTimeout(timeoutHandle);
        clearInterval(metricsInterval);

        const runtime = Date.now() - startTime;

        resolve({
          stdout,
          stderr,
          exitCode: exitCode ?? -1,
          runtime,
          peakMemory,
          averageCpu: 0,
          metrics: [],
        });
      });

      proc.on('error', (error) => {
        clearTimeout(timeoutHandle);
        clearInterval(metricsInterval);
        reject(error);
      });
    });
  }

  /**
   * Get memory usage of a process
   * 
   * @param pid - Process ID
   * @returns Memory in MB
   */
  private async getProcessMemory(pid: number): Promise<number> {
    const platform = process.platform;

    return new Promise((resolve) => {
      let cmd: string;
      let args: string[];

      if (platform === 'win32') {
        cmd = 'wmic';
        args = ['process', 'where', `ProcessId=${pid}`, 'get', 'WorkingSetSize'];
      } else {
        cmd = 'ps';
        args = ['-p', pid.toString(), '-o', 'rss='];
      }

      const proc = spawn(cmd, args);
      let output = '';

      proc.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      proc.on('close', () => {
        const match = output.match(/(\d+)/);
        const bytes = match && match[1] ? parseInt(match[1], 10) : 0;
        // RSS is in KB on Unix, bytes on Windows
        const memoryMB = platform === 'win32' 
          ? Math.round(bytes / (1024 * 1024))
          : Math.round(bytes / 1024);
        resolve(memoryMB);
      });

      proc.on('error', () => resolve(0));
    });
  }

  /**
   * Check if E2B is configured
   */
  isE2BConfigured(): boolean {
    return this.useE2B;
  }
}