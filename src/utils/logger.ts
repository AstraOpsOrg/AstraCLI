import theme from '@/src/utils/theme.ts';

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    VERBOSE = 3,
    DEBUG = 4
}

export class Logger {
    private level: LogLevel;

    constructor(verbose: boolean = false) {
        this.level = verbose ? LogLevel.VERBOSE : LogLevel.INFO;
    }

    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        return `${theme.dim(`[${timestamp}]`)} ${level}: ${message}`;
    }

    error(message: string): void {
        if (this.level >= LogLevel.ERROR) {
            console.error(this.formatMessage(theme.bold(theme.red('❌ ERROR')), theme.red(message)));
        }
    }

    warn(message: string): void {
        if (this.level >= LogLevel.WARN) {
            console.warn(this.formatMessage(theme.bold(theme.yellow('⚠️  WARN')), theme.yellow(message)));
        }
    }

    info(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(this.formatMessage(theme.bold(theme.blue('ℹ️  INFO')), theme.white(message)));
        }
    }

    success(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(this.formatMessage(theme.bold(theme.green('✅ SUCCESS')), theme.green(message)));
        }
    }

    verbose(message: string): void {
        if (this.level >= LogLevel.VERBOSE) {
            console.log(this.formatMessage(theme.bold(theme.cyan('🔍 VERBOSE')), theme.cyan(message)));
        }
    }

    debug(message: string): void {
        if (this.level >= LogLevel.DEBUG) {
            console.log(this.formatMessage(theme.bold(theme.magenta('🐛 DEBUG')), theme.magenta(message)));
        }
    }

    step(stepNumber: number, message: string): void {
        if (this.level >= LogLevel.INFO) {
            const stepLabel = theme.bold(theme.blue(`🔄 Step ${stepNumber}`));
            const stepMessage = theme.white(message);
            console.log(`\n${stepLabel}: ${stepMessage}`);
            
            // Add a subtle progress indicator
            if (this.level >= LogLevel.VERBOSE) {
                const progressBar = '▓'.repeat(stepNumber) + '░'.repeat(Math.max(0, 9 - stepNumber));
                console.log(theme.dim(`   Progress: [${theme.blue(progressBar)}] ${stepNumber}/9`));
            }
        }
    }

    // New utility methods for better UX
    loading(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(this.formatMessage(theme.bold(theme.yellow('⏳ LOADING')), theme.yellow(message)));
        }
    }

    completed(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(this.formatMessage(theme.bold(theme.green('🎉 COMPLETED')), theme.green(message)));
        }
    }

    highlight(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(theme.bold(theme.cyan(`🔥 ${message}`)));
        }
    }

    table(title: string, data: Record<string, string>): void {
        if (this.level >= LogLevel.INFO) {
            console.log(theme.bold(theme.blue(`\n📋 ${title}:`)));
            Object.entries(data).forEach(([key, value]) => {
                console.log(`  ${theme.gray(key + ':')} ${theme.cyan(value)}`);
            });
        }
    }

    setLevel(level: LogLevel): void {
        this.level = level;
    }
} 