import { createLogger, format, transports } from 'winston';
import * as morgan from 'morgan';
import * as moment from 'moment-timezone';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { Injectable, LoggerService } from '@nestjs/common';

const { combine, label, printf } = format;

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '14d';
const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Tokyo';

// Winston timezone
const appendTimestamp = format((info, opts) => {
  if (opts.tz) info.timestamp = moment().tz(opts.tz).format();
  return info;
});

// Winston format
const myFormat = printf((info) => {
  return `${info.timestamp} ${info.level}: ${info.message}`;
});

// Morgan timezone
morgan.token('TIME', () => moment().tz(TIME_ZONE).format());

// Morgan format
morgan.format(
  'myformat',
  `[:date[${TIME_ZONE}]] :remote-addr ":method :url" :status :res[content-length] - :response-time ms`,
);

const defaultRotate = (logClass: string) => ({
  level: LOG_LEVEL,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: LOG_MAX_SIZE,
  maxFiles: LOG_MAX_FILES,
  dirname: `logs/${logClass}`,
  filename: `${logClass}-%DATE%.log`,
});

/** 操作ログ **/
const systemLogger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    label({ label: 'main' }),
    appendTimestamp({ tz: TIME_ZONE }),
    myFormat,
  ),
  transports: [
    new DailyRotateFile({
      ...defaultRotate('system'),
    }),
    new transports.Console(),
  ],
});

/** クエリログ **/
const queryLogger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    label({ label: 'query' }),
    appendTimestamp({ tz: TIME_ZONE }),
    myFormat,
  ),
  transports: [
    new DailyRotateFile({
      ...defaultRotate('query'),
    }),
  ],
});

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string) {
    systemLogger.info(message);
  }
  error(message: string, trace: string) {
    systemLogger.error(`${message} - ${trace}`);
  }
  warn(message: string) {
    systemLogger.warn(message);
  }
  debug(message: string) {
    systemLogger.debug(message);
  }
  verbose(message: string) {
    systemLogger.verbose(message);
  }
}

export const accessLogger = morgan('myformat', {
  stream: { write: (message) => systemLogger.info(message.trim()) },
});
export const systemLoggerInstance = systemLogger;
export const queryLoggerInstance = queryLogger;
