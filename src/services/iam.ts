import theme from '@/src/utils/theme.ts';
import {
  IAMClient,
  GetRoleCommand,
  CreateRoleCommand,
  PutRolePolicyCommand,
  GetUserCommand,
  CreateUserCommand,
  CreateAccessKeyCommand,
  ListAccessKeysCommand,
  PutUserPolicyCommand,
  DeleteAccessKeyCommand,
} from '@aws-sdk/client-iam';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { buildLeastPrivilegeExecutionPolicy } from '@/src/policies/executionRolePolicy.ts';
import { wait } from '@/src/utils/config.ts';

// Helper for retries
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelay: number,
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt === maxAttempts) throw e;
      await wait(Math.min(8000, baseDelay * Math.pow(2, attempt)));
    }
  }
  throw new Error('Retry failed');
}

export async function setupExecutionRole(params: {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  region: string;
}): Promise<{
  roleArn: string;
  userAccessKeyId: string;
  userSecretAccessKey: string;
}> {
  const { accessKeyId, secretAccessKey, accountId, region } = params;
  const iam = new IAMClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
  const roleName = 'AstraOpsExecutionRole';
  const userName = 'AstraOpsBackendCaller';
  const inlinePolicyName = 'AstraOpsExecutionInlinePolicy';

  // Create/Get user
  try {
    await iam.send(new GetUserCommand({ UserName: userName }));
    console.log(theme.greenCustom(`✅ IAM User found: ${userName}`));
    console.log(
      theme.gray(`User already exists, proceeding to rotate access keys...`),
    );
  } catch (error: any) {
    if (
      error.name?.includes('NoSuchEntity') ||
      error.Code?.includes('NoSuchEntity')
    ) {
      console.log(
        theme.yellowCustom(`🔑 Creating IAM User: ${userName}...`),
      );
      try {
        await iam.send(new CreateUserCommand({ UserName: userName }));
        await retry(
          () => iam.send(new GetUserCommand({ UserName: userName })),
          3,
          500,
        );
        console.log(theme.greenCustom(`✅ IAM User created: ${userName}`));
      } catch (createError: any) {
        console.error(
          theme.red(
            `❌ Failed to create IAM User: ${
              createError.message || createError
            }`,
          ),
        );
        process.exit(1);
      }
    } else {
      console.error(
        theme.red(
          `❌ Failed to check IAM User: ${error.message || error}`,
        ),
      );
      process.exit(1);
    }
  }

  // Clean up and create keys (always rotate)
  const accessKeys = await iam.send(
    new ListAccessKeysCommand({ UserName: userName }),
  );
  const existingKeys = accessKeys.AccessKeyMetadata || [];
  if (existingKeys.length > 0) {
    console.log(
      theme.gray(
        `🗑️ Found ${existingKeys.length} existing keys, cleaning up...`,
      ),
    );
    for (const key of existingKeys) {
      if (key.AccessKeyId) {
        console.log(
          theme.gray(`Deleting old access key: ${key.AccessKeyId}`),
        );
        await iam.send(
          new DeleteAccessKeyCommand({
            UserName: userName,
            AccessKeyId: key.AccessKeyId,
          }),
        );
      }
    }
  } else {
    console.log(theme.gray(`No existing access keys to clean up.`));
  }

  console.log(
    theme.yellowCustom(`🔑 Creating access keys for IAM User: ${userName}...`),
  );
  const accessKeyResult = await iam.send(
    new CreateAccessKeyCommand({ UserName: userName }),
  );
  const userAccessKeyId = accessKeyResult.AccessKey?.AccessKeyId!;
  const userSecretAccessKey = accessKeyResult.AccessKey?.SecretAccessKey!;
  console.log(theme.greenCustom(`✅ Access keys created for IAM User`));

  // Assume role policy
  console.log(theme.gray(`Attaching assume role policy to user...`));
  const userPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: 'sts:AssumeRole',
        Resource: `arn:aws:iam::${accountId}:role/${roleName}`,
      },
    ],
  };
  await iam.send(
    new PutUserPolicyCommand({
      UserName: userName,
      PolicyName: 'AstraOpsAssumeRolePolicy',
      PolicyDocument: JSON.stringify(userPolicy),
    }),
  );
  console.log(theme.greenCustom(`✅ Assume role policy attached.`));

  // Create/Get role
  let roleArn: string;
  try {
    const existing = await iam.send(
      new GetRoleCommand({ RoleName: roleName }),
    );
    const existingArn = existing.Role?.Arn;
    if (!existingArn) {
      console.error(theme.red('❌ Failed to read existing role ARN'));
      process.exit(1);
    }
    roleArn = existingArn;
    console.log(theme.greenCustom(`✅ IAM Role found: ${roleArn}`));

    // Ensure inline S3 policy is attached/updated with write permissions
    const bucketName = `astraops-tfstate-${accountId}`;
    const inlinePolicy = buildLeastPrivilegeExecutionPolicy(bucketName);
    await iam.send(
      new PutRolePolicyCommand({
        RoleName: roleName,
        PolicyName: inlinePolicyName,
        PolicyDocument: JSON.stringify(inlinePolicy),
      }),
    );
  } catch (error: any) {
    if (
      error.name?.includes('NoSuchEntity') ||
      error.Code?.includes('NoSuchEntity')
    ) {
      console.log(theme.yellowCustom('🔑 Creating persistent IAM Role...'));
      const trustPolicy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${accountId}:user/${userName}`,
            },
            Action: 'sts:AssumeRole',
          },
        ],
      };

      try {
        // Retry to handle propagation delays
        const created = await retry(
          () =>
            iam.send(
              new CreateRoleCommand({
                RoleName: roleName,
                AssumeRolePolicyDocument: JSON.stringify(trustPolicy),
                Description: 'Persistent role for AstraOps',
              }),
            ),
          5,
          1000, // Base delay of 1s
        );
        const createdArn = created.Role?.Arn;
        if (!createdArn) {
          console.error(theme.red('❌ Failed to read created role ARN'));
          process.exit(1);
        }
        roleArn = createdArn;
        console.log(theme.greenCustom(`✅ IAM Role created: ${roleArn}`));

        // Inline S3 policy (with write permissions)
        console.log(
          theme.gray(`Attaching inline S3 policy to role...`),
        );
        const bucketName = `astraops-tfstate-${accountId}`;
        const inlinePolicy = buildLeastPrivilegeExecutionPolicy(bucketName);
        await iam.send(
          new PutRolePolicyCommand({
            RoleName: roleName,
            PolicyName: inlinePolicyName,
            PolicyDocument: JSON.stringify(inlinePolicy),
          }),
        );
        // Removed: we don't attach managed wide policies; we use inline least-privilege
        console.log(theme.greenCustom(`✅ Inline S3 policy attached.`));
        await wait(2000); // Minimum delay
        console.log(theme.greenCustom('✅ Persistent IAM Role ready'));
      } catch (createError: any) {
        console.error(
          theme.red(
            `❌ Failed to create IAM Role: ${
              createError.message || createError
            }`,
          ),
        );
        process.exit(1);
      }
    } else {
      console.error(
        theme.red(
          `❌ Failed to check IAM Role: ${error.message || error}`,
        ),
      );
      process.exit(1);
    }
  }

  return { roleArn, userAccessKeyId, userSecretAccessKey };
}

export async function assumeExecutionRole(
  roleArn: string,
  userAccessKeyId: string,
  userSecretAccessKey: string,
) {
  const region = Bun.env.AWS_REGION || 'us-west-2';
  const client = new STSClient({
    region,
    credentials: {
      accessKeyId: userAccessKeyId,
      secretAccessKey: userSecretAccessKey,
    },
  });
  console.log(theme.gray(`Assuming role: ${roleArn}...`));
  const out = await retry(
    () =>
      client.send(
        new AssumeRoleCommand({
          RoleArn: roleArn,
          RoleSessionName: `astraops-cli-${Date.now()}`,
          DurationSeconds: 3600,
        }),
      ),
    6,
    750,
  );
  const c = out.Credentials;
  if (!c?.AccessKeyId || !c?.SecretAccessKey || !c?.SessionToken) {
    console.error(
      theme.red('❌ Failed to assume role: missing credentials in STS response'),
    );
    process.exit(1);
  }
  console.log(theme.greenCustom(`✅ Role assumed successfully.`));
  return {
    AccessKeyId: c.AccessKeyId,
    SecretAccessKey: c.SecretAccessKey,
    SessionToken: c.SessionToken,
    Expiration: c.Expiration?.toISOString(),
  };
}