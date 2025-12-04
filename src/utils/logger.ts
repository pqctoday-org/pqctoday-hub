/**
 * Logger utility for development and production environments
 * In production, logs are disabled by default to prevent sensitive data exposure
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
  enabled: boolean
  level: LogLevel
}

const config: LoggerConfig = {
  enabled: import.meta.env.DEV, // Only enable in development by default
  level: 'debug',
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Configure the logger
 */
export const configureLogger = (newConfig: Partial<LoggerConfig>) => {
  Object.assign(config, newConfig)
}

/**
 * Check if a log level should be logged
 */
const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false
  // eslint-disable-next-line security/detect-object-injection
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level]
}

/**
 * Format log messages with timestamp and context
 */
const formatMessage = (context: string, message: string): string => {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${context}] ${message}`
}

/**
 * Logger class with context
 */
class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(formatMessage(this.context, message), ...args)
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatMessage(this.context, message), ...args)
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage(this.context, message), ...args)
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(formatMessage(this.context, message), ...args)
    }
  }
}

/**
 * Create a logger instance with a specific context
 * @param context - Context string (e.g., 'mlkem_wasm', 'Playground', 'Worker')
 */
export const createLogger = (context: string): Logger => {
  return new Logger(context)
}

/**
 * Default logger for general use
 */
export const logger = createLogger('App')
