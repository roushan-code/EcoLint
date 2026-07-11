import { Logger } from '../infrastructure/logger.js';
import { ConfigurationService } from '../config/configurationService.js';

export class HttpClient {
  private readonly logger: Logger;
  private readonly configService: ConfigurationService;

  constructor(logger: Logger, configService: ConfigurationService) {
    this.logger = logger;
    this.configService = configService;
  }

  public async get<T>(endpoint: string): Promise<T> {
    const baseUrl = this.configService.getApiEndpoint();
    const url = `${baseUrl}${endpoint}`;

    this.logger.info(`GET ${url}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as T;
      this.logger.info(`GET ${url} - Success`);
      return data;
    } catch (error) {
      this.logger.error(`GET ${url} - Failed`, error);
      throw error;
    }
  }

  public async post<T, R>(endpoint: string, body: T): Promise<R> {
    const baseUrl = this.configService.getApiEndpoint();
    const url = `${baseUrl}${endpoint}`;

    this.logger.info(`POST ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as R;
      this.logger.info(`POST ${url} - Success`);
      return data;
    } catch (error) {
      this.logger.error(`POST ${url} - Failed`, error);
      throw error;
    }
  }
}