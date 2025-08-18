import type { Command } from 'commander'
import theme from '@/src/utils/theme.ts'
import { requiredEnv, readAstraopsYaml } from '@/src/utils/config.ts'
import { setupExecutionRole, assumeExecutionRole } from '@/src/services/iam.ts'
import { postDestroyRequest, streamLogs } from '@/src/services/backend.ts'

export function registerDestroyCommand(program: Command) {
  program
    .command('destroy')
    .description('Destroy eks infrastructure and services')
    .action(async () => {
      try {
        console.log(`${theme.blueCustom('AstraOps destroy starting...')}`)
        const accountId = requiredEnv('AWS_ACCOUNT_ID')
        const region = requiredEnv('AWS_REGION')

        // Read config
        const astraopsConfig = await readAstraopsYaml()

        // Ensure role and get STS
        console.log(`${theme.gray('📄 Phase 1: Ensuring execution role...')}`)
        const { roleArn, userAccessKeyId, userSecretAccessKey } = await setupExecutionRole({
          accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'),
          secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY'),
          accountId,
          region,
        })
        const sts = await assumeExecutionRole(roleArn, userAccessKeyId, userSecretAccessKey)

        // Build request
        const body = {
          accountId,
          region,
          roleArn,
          awsCredentials: {
            accessKeyId: sts.AccessKeyId,
            secretAccessKey: sts.SecretAccessKey,
            sessionToken: sts.SessionToken,
            expiration: sts.Expiration,
          },
          astraopsConfig,
        }

        console.log(`${theme.gray('📄 Phase 2: Sending destroy request to backend...')}`)
        const { jobId } = await postDestroyRequest(body)
        console.log(`${theme.greenCustom('✅ Destroy initiated.')} JobId: ${jobId}`)
        console.log(`${theme.gray('📄 Phase 3: Streaming destroy logs...')}`)
        try {
          await streamLogs(jobId, { type: 'destroy' })
        } catch (err) {
          console.error(theme.red(`Destroy failed: ${String((err as any)?.message || err)}`))
          process.exit(1)
        }
      } catch (e: any) {
        console.error(`${theme.red('Error:')} ${e?.message || e}`)
        process.exit(1)
      }
    })
}


