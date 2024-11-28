export interface Service {
  name: string;
  url: string;
  existsWhen: number;
  errorType?: 'status_code' | 'message' | 'response_time';
  errorMsg?: string;
  regexCheck?: string;
  isNSFW?: boolean;
}

export interface CheckResult {
  service: string;
  exist: boolean;
  url: string;
  error?: string;
  responseTime?: number;
}

export interface ServiceGroup {
  name: string;
  services: Service[];
}