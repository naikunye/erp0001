
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private static formatMessage(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  static info(message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`%c ${this.formatMessage('info', message)}`, 'color: #0ea5e9', data || '');
    }
  }

  static warn(message: string, data?: any) {
    console.warn(`%c ${this.formatMessage('warn', message)}`, 'color: #f59e0b', data || '');
  }

  static error(message: string, error?: any) {
    console.error(`%c ${this.formatMessage('error', message)}`, 'color: #ef4444; font-weight: bold', error || '');
    // TODO: Send to Sentry or other error tracking service
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`%c ${this.formatMessage('debug', message)}`, 'color: #a8a29e', data || '');
    }
  }
}

export default Logger;
