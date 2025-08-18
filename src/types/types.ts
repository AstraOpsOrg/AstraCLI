export type DeployRequest = {
  accountId: string;
  region: string;
  roleArn: string;
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string;
    expiration?: string;
  };
  astraopsConfig: unknown;
};


