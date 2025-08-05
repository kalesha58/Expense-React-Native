type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
}

class Logger {
  private config: LoggerConfig = {
    level: __DEV__ ? 'debug' : 'warn',
    enableConsole: __DEV__,
    enableRemote: !__DEV__,
  };

  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data, null, 2)}`;
    }
    
    return `${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    if (this.config.enableConsole) {
      switch (level) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(formattedMessage);
          break;
        case 'info':
          // eslint-disable-next-line no-console
          console.info(formattedMessage);
          break;
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(formattedMessage);
          break;
        case 'error':
          // eslint-disable-next-line no-console
          console.error(formattedMessage);
          break;
      }
    }

    if (this.config.enableRemote) {
      this.sendToRemote(level, message, data);
    }
  }

  private sendToRemote(level: LogLevel, message: string, data?: unknown): void {
    // TODO: Implement remote logging service (e.g., Crashlytics, Sentry)
    // This is a placeholder for remote logging implementation
  }

  debug(message: string, data?: unknown): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: unknown): void {
    this.log('error', message, data);
  }

  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const logger = new Logger(); 