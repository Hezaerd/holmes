import type { Service, CheckResult } from '../types';
import services from './fetcher/services.json';

export class ServiceManager {
  private services: Service[];

  constructor() {
    this.services = services;
  }

  public getServices(includeNSFW: boolean = false): Service[] {
    return this.services.filter(service => includeNSFW ? true : !service.isNSFW);
  }

  public async checkUsername(username: string, includeNSFW: boolean = false): Promise<CheckResult[]> {
    const services = this.getServices(includeNSFW);
    const results = await Promise.all(
      services.map(service => this.checkService(service, username))
    );
    return results;
  }

  private async checkService(service: Service, username: string): Promise<CheckResult> {
    const url = service.url.replace("{username}", username);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const responseTime = Date.now() - startTime;

      if (response.status === 429) {
        return { service: service.name, exist: false, url, error: 'Rate limited' };
      }

      const result = await this.validateResponse(service, response, responseTime);
      return { ...result, url };

    } catch (error) {
      return this.handleError(service, url, error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async validateResponse(service: Service, response: Response, responseTime: number): Promise<CheckResult> {
    switch (service.errorType) {
      case 'status_code':
        return {
          service: service.name,
          exist: response.status === service.existsWhen,
          responseTime,
          url: response.url
        };

      case 'message':
        const text = await response.text();
        if (service.regexCheck) {
          const regex = new RegExp(service.regexCheck);
          return {
            service: service.name,
            exist: regex.test(text),
            responseTime,
            url: response.url
          };
        }
        return {
          service: service.name,
          exist: !text.includes(service.errorMsg || ''),
          responseTime,
          url: response.url
        };

      case 'response_time':
        return {
          service: service.name,
          exist: responseTime > 200,
          responseTime,
          url: response.url
        };

      default:
        return {
          service: service.name,
          exist: response.status === service.existsWhen,
          responseTime,
          url: response.url
        };
    }
  }

  private handleError(service: Service, url: string, error: unknown): CheckResult {
    let errorMessage = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.name === 'AbortError' ? 'Timeout' : 'Network error';
    }

    return {
      service: service.name,
      exist: false,
      url,
      error: errorMessage
    };
  }
}