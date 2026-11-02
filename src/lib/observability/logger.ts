import { randomUUID } from 'crypto';

export interface LogContext {
  requestId: string;
  provider?: string;
  endpoint?: string;
  method?: string;
  path?: string;
  latencyMs?: number;
  statusCode?: number;
  cacheHit?: boolean;
  limiterAction?: 'allow' | 'delay' | 'deny';
  errorClass?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private baseContext: Partial<LogContext> = {};

  withContext(context: Partial<LogContext>): Logger {
    const child = new Logger();
    child.baseContext = { ...this.baseContext, ...context };
    return child;
  }

  info(message: string, extra?: Partial<LogContext>): void {
    this.log('INFO', message, extra);
  }

  warn(message: string, extra?: Partial<LogContext>): void {
    this.log('WARN', message, extra);
  }

  error(message: string, extra?: Partial<LogContext>): void {
    this.log('ERROR', message, extra);
  }

  private log(level: string, message: string, extra?: Partial<LogContext>): void {
    const entry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...this.baseContext,
      ...extra,
    };
    console.log(JSON.stringify(entry));
  }
}

export const logger = new Logger();

export function generateRequestId(): string {
  return randomUUID();
}

export function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized = { ...headers };
  delete sanitized['authorization'];
  delete sanitized['Authorization'];
  delete sanitized['x-api-key'];
  delete sanitized['cookie'];
  return sanitized;
}
