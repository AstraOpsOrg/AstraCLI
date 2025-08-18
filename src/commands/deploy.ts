import { Command } from 'commander';
import theme from '@/src/utils/theme.ts';
import { setupExecutionRole, assumeExecutionRole } from '@/src/services/iam.ts';
import { readAstraopsYaml, requiredEnv } from '@/src/utils/config.ts';
import { postDeployRequest, streamLogs } from '@/src/services/backend.ts';
import type { DeployRequest } from '@/src/types/types.ts';
import { deploySimulation } from '@/src/commands/deploy.simulate.ts'

export function registerDeployCommand(program: Command) {
  program
    .command('deploy')
    .summary(`Deploy or update cluster: ${theme.greenCustom('--monitoring')} or ${theme.greenCustom('-m')} sets up a  ${theme.yellowCustom('Grafana dashboard')} after successful deploy`)
    .option('-m, --monitoring', 'Sets up a Grafana dashboard after successful deploy')
    .action(async (opts) => {
      try {
        console.log(theme.bold('🔄 AstraOps deploy starting...'));
      const simulate = String(Bun.env.SIMULATE || '').toLowerCase() === 'true';

      console.log(theme.white(`📄 ${theme.bg.green('Phase 1')}: Reading configuration astraops.yaml file...`));
      const astraopsConfig = await readAstraopsYaml('./astraops.yaml');
      const accountId = requiredEnv('AWS_ACCOUNT_ID');
      const region = requiredEnv('AWS_REGION');
      const accessKeyId = requiredEnv('AWS_ACCESS_KEY_ID');
      const secretAccessKey = requiredEnv('AWS_SECRET_ACCESS_KEY');

      if (simulate) {
        const jobId = await deploySimulation({ accountId, region, astraopsConfig });
        console.log(theme.greenCustom(`✅ Simulation started. JobId: ${jobId}`));
        console.log(theme.white('📄 Streaming simulation logs...'));
        await streamLogs(jobId, { appName: astraopsConfig?.applicationName });
      } else {
        console.log(theme.white(`📄 ${theme.bg.green('Phase 2')}: Checking IAM Role...`));
        const { roleArn, userAccessKeyId, userSecretAccessKey } = await setupExecutionRole({ accessKeyId, secretAccessKey, accountId, region });
        // Obtaining temporary credentials from the role and attaching them
        const awsCredentials = await assumeExecutionRole(roleArn, userAccessKeyId, userSecretAccessKey);
        const normalizedAwsCredentials = {
          accessKeyId: awsCredentials.AccessKeyId,
          secretAccessKey: awsCredentials.SecretAccessKey,
          sessionToken: awsCredentials.SessionToken,
          expiration: awsCredentials.Expiration,
        };
        console.log(theme.greenCustom(`✅ IAM Role setup and STS credentials obtained successfully!`));
        console.log(theme.gray(`Role ARN: ${roleArn}`));
        console.log(theme.gray(`Temporary credentials valid until: ${awsCredentials.Expiration}`));
        console.log(theme.white(`📄 ${theme.bg.green('Phase 3')}: Sending deploy request to backend...`));
        const request: DeployRequest = { accountId, region, roleArn, astraopsConfig };
        const { jobId } = await postDeployRequest({ ...request, awsCredentials: normalizedAwsCredentials });
        console.log(theme.greenCustom(`✅ Deployment initiated. JobId: ${jobId}`));
        console.log(theme.white(`📄 ${theme.bg.green('Phase 4')}: Streaming deployment logs...`));
        await streamLogs(jobId);

        // Optional monitoring setup after SUCCESS
        if (opts?.monitoring) {
          console.log(theme.white(`📄 ${theme.bg.green('Phase 5')}: Checking job status for monitoring setup...`));
          const { getJobStatus, setupMonitoring } = await import('@/src/services/backend.ts');
          const status = await getJobStatus(jobId);
          if (status === 'COMPLETED') {
              console.log(theme.white(`📄 ${theme.bg.green('Phase 6')}: Setting up monitoring (Grafana)...`));
            const { url } = await setupMonitoring(jobId);
            console.log(theme.greenCustom(`✅ Monitoring ready: ${url}`));
          } else {
            console.log(theme.yellowCustom('⚠️ Skipping monitoring setup (job not successful).'));
          }
        }
      }
      } catch (error: any) {
        console.error(theme.red(`Error: ${String(error?.message || error)}`));
        process.exit(1);
      }
    });
}


