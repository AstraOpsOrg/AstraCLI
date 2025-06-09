import type { AWSConfig, AstraOpsConfig } from '@/src/types.ts';

export function validateAndGetConfig(): { aws: AWSConfig; astraops: AstraOpsConfig } {
    const accessKeyId = Bun.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = Bun.env.AWS_SECRET_ACCESS_KEY;
    const region = Bun.env.AWS_REGION;
    const astraopsApiUrl = Bun.env.ASTRAOPS_API_URL;
    const astraopsApiKey = Bun.env.ASTRAOPS_API_KEY;

    if (!accessKeyId || !secretAccessKey || !region || !astraopsApiUrl || !astraopsApiKey) {
        console.error("Error: Missing required environment variables in .env file or environment.");
        console.log("Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, ASTRAOPS_API_URL, ASTRAOPS_API_KEY");
        process.exit(1);
    }

    return {
        aws: {
            accessKeyId,
            secretAccessKey,
            region
        },
        astraops: {
            apiUrl: astraopsApiUrl,
            apiKey: astraopsApiKey
        }
    };
} 