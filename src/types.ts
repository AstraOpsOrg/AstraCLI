export interface AWSConfig {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
}

export interface AstraOpsConfig {
    apiUrl: string;
    apiKey: string;
}

export interface ServicePrincipalCredentials {
    accessKeyId: string;
    secretAccessKey: string;
}

export interface AstraOpsRegistrationPayload {
    userRoleToAssumeArn: string;
    apiServicePrincipalCredentials: ServicePrincipalCredentials;
}

export interface AstraOpsRegistrationResponse {
    jobId: string;
}

export interface ServicePrincipalResult {
    arn: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export interface IAMResourceResult {
    arn: string;
}

export interface CLIOptions {
    verbose?: boolean;
    dryRun?: boolean;
} 