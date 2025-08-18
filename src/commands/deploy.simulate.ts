import theme from '@/src/utils/theme.ts'
import type { DeployRequest } from '@/src/types/types.ts'
import { postDeployRequest } from '@/src/services/backend.ts'

export async function deploySimulation(params: {
  accountId: string
  region: string
  astraopsConfig: any
}): Promise<string> {
  const { accountId, region, astraopsConfig } = params
  console.log(theme.white('Simulation mode enabled (SIMULATE=true). Skipping IAM setup...'))

  const acc = /^\d{12}$/.test(accountId) ? accountId : '000000000000'
  const roleArn = `arn:aws:iam::${acc}:role/SimulateRole`

  const request: DeployRequest = {
    accountId,
    region,
    roleArn,
    astraopsConfig,
  }

  const { jobId } = await postDeployRequest(request, { simulate: true })
  return jobId
}


