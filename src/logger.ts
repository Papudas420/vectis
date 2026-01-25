import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { util } from 'zod'; // We can use util from some package or just use node's util
import utilNode from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, '../vectis.log');

export enum LogLevel {
    INFO = 'INFO',
    ERROR = 'ERROR',
    WARN = 'WARN',
    DEBUG = 'DEBUG'
}

export class Logger {
    private static instance: Logger;
    private logStream: fs.WriteStream;

    private constructor() {
        this.logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg =>
            typeof arg === 'object' ? utilNode.inspect(arg, { depth: null, colors: false }) : String(arg)
        ).join(' ') : '';

        return `[${timestamp}] [${level}] ${message}${formattedArgs}\n`;
    }

    public info(message: string, ...args: any[]) {
        this.write(LogLevel.INFO, message, ...args);
    }

    public error(message: string, ...args: any[]) {
        this.write(LogLevel.ERROR, message, ...args);
    }

    public warn(message: string, ...args: any[]) {
        this.write(LogLevel.WARN, message, ...args);
    }

    public debug(message: string, ...args: any[]) {
        this.write(LogLevel.DEBUG, message, ...args);
    }

    private write(level: LogLevel, message: string, ...args: any[]) {
        const formatted = this.formatMessage(level, message, ...args);
        // CRITICAL: NEVER use console.log here. ONLY console.error to avoid breaking MCP protocol.
        process.stderr.write(formatted);
        this.logStream.write(formatted);
    }

    public async shutdown() {
        return new Promise<void>((resolve) => {
            this.logStream.end(() => resolve());
        });
    }
}
