import { IAMClient } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import type { AWSConfig } from '@/src/types.ts';

export function createAWSClients(config: AWSConfig) {
    const clientConfig = {
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        }
    };

    return {
        iam: new IAMClient(clientConfig),
        sts: new STSClient(clientConfig)
    };
}

export async function getAWSAccountId(stsClient: STSClient): Promise<string> {
    try {
        const callerIdentity = await stsClient.send(new GetCallerIdentityCommand({}));
        if (!callerIdentity.Account) {
            throw new Error("Could not retrieve AWS Account ID.");
        }
        console.log(`Operating in AWS Account ID: ${callerIdentity.Account}`);
        return callerIdentity.Account;
    } catch (error) {
        console.error("Error getting AWS Caller Identity:", error);
        process.exit(1);
    }
} 