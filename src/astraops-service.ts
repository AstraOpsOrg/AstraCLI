import type { 
    AstraOpsConfig, 
    AstraOpsRegistrationPayload, 
    AstraOpsRegistrationResponse,
    ServicePrincipalCredentials 
} from '@/src/types.ts';
import type { Logger } from '@/src/utils/logger.ts';

export class AstraOpsService {
    constructor(private config: AstraOpsConfig, private logger?: Logger) {}

    async registerRole(
        userRoleToAssumeArn: string,
        credentials: ServicePrincipalCredentials
    ): Promise<string> {
        try {
            const payload: AstraOpsRegistrationPayload = {
                userRoleToAssumeArn: userRoleToAssumeArn,
                apiServicePrincipalCredentials: credentials
            };

            const response = await fetch(`${this.config.apiUrl}/api/v1/platform/setup/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorData}`);
            }

            const responseData = await response.json() as AstraOpsRegistrationResponse;
            const jobId = responseData.jobId;
            
            if (this.logger) {
                this.logger.success(`Role registered with AstraOps API. Job ID for EKS setup: ${jobId}`);
            } else {
                console.log(`Role registered with AstraOps API. Job ID for EKS setup: ${jobId}`);
            }
            return jobId;
        } catch (error) {
            if (this.logger) {
                this.logger.error(`Error registering role with AstraOps API: ${error}`);
            } else {
                console.error("Error registering role with AstraOps API:", error);
            }
            process.exit(1);
        }
    }
} 