import type { AstraOpsConfig } from '@/src/types.ts';
import type { Logger } from '@/src/utils/logger.ts';

export class LogStreamer {
    constructor(private config: AstraOpsConfig, private logger?: Logger) {}

    async streamLogs(jobId: string): Promise<void> {
        if (!jobId) {
            if (this.logger) {
                this.logger.error("No job ID provided for log streaming");
            } else {
                console.error("No job ID provided for log streaming");
            }
            return;
        }

        if (this.logger) {
            this.logger.info(`Streaming logs for EKS setup (Job ID: ${jobId})...`);
        } else {
            console.log(`\nStreaming logs for EKS setup (Job ID: ${jobId})...\n`);
        }
        
        const sseUrl = `${this.config.apiUrl}/api/v1/platform/setup/logs/${jobId}/stream`;
        
        // La clase EventSource es global en Bun
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            // Asumimos que el servidor envía datos simples de log
            // o JSON que parsearías aquí.
            const logData = event.data;
            
            if (this.logger) {
                this.logger.info(logData);
            } else {
                console.log(logData); // Imprime el log
            }

            // Detectar mensaje de finalización (esto es una convención que debes definir)
            if (logData.startsWith("JOB_COMPLETE:")) {
                if (this.logger) {
                    this.logger.success("EKS Platform Setup Successful!");
                } else {
                    console.log("\nEKS Platform Setup Successful!");
                }
                eventSource.close();
                process.exit(0);
            } else if (logData.startsWith("JOB_FAILED:")) {
                if (this.logger) {
                    this.logger.error("EKS Platform Setup Failed.");
                } else {
                    console.error("\nEKS Platform Setup Failed.");
                }
                eventSource.close();
                process.exit(1);
            }
        };

        eventSource.onerror = (error) => {
            if (this.logger) {
                this.logger.error(`Error with SSE connection: ${error}`);
            } else {
                console.error("\nError with SSE connection:", error);
            }
            eventSource.close();
            process.exit(1);
        };

        eventSource.onopen = () => {
            if (this.logger) {
                this.logger.info("SSE Connection opened. Waiting for logs...");
            } else {
                console.log("SSE Connection opened. Waiting for logs...");
            }
        };

        // Bun's EventSource tiene .ref() y .unref() para controlar el event loop.
        // Por defecto, mantiene el proceso vivo.
    }
} 