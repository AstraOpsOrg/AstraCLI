import { validateAndGetConfig } from '@/src/config.ts';
import { createAWSClients, getAWSAccountId } from '@/src/aws-clients.ts';
import { IAMService } from '@/src/iam-service.ts';
import { AstraOpsService } from '@/src/astraops-service.ts';
import { LogStreamer } from '@/src/logger.ts';
import { Logger } from '@/src/utils/logger.ts';
import type { CLIOptions } from '@/src/types.ts';
import theme from '@/src/utils/theme.ts';

export async function main(options: CLIOptions = {}) {
    const logger = new Logger(options.verbose);
    
    logger.highlight('Welcome to AstraOps CLI Setup! 🚀');

    try {
        // 1. Validar configuración
        logger.step(1, 'Validating environment configuration');
        logger.loading('Checking environment variables...');
        const config = validateAndGetConfig();
        
        logger.table('Configuration Summary', {
            'AWS Region': config.aws.region,
            'AstraOps API': config.astraops.apiUrl,
            'AWS Access Key': config.aws.accessKeyId.substring(0, 8) + '...',
        });
        logger.completed('Environment configuration validated');

        // 2. Crear clientes AWS
        logger.step(2, 'Initializing AWS clients');
        logger.loading('Creating IAM and STS clients...');
        const { iam, sts } = createAWSClients(config.aws);
        logger.success('AWS clients initialized successfully');

        // 3. Obtener Account ID
        logger.step(3, 'Retrieving AWS Account information');
        logger.loading('Getting AWS Account ID via STS...');
        const accountId = await getAWSAccountId(sts);
        logger.table('AWS Account Info', {
            'Account ID': accountId,
            'Region': config.aws.region
        });
        logger.completed('AWS Account ID retrieved');

        // 4. Configurar servicios
        logger.verbose('Initializing AstraOps services...');
        const iamService = new IAMService(iam, logger);
        const astraopsService = new AstraOpsService(config.astraops, logger);
        const logStreamer = new LogStreamer(config.astraops, logger);

        // 5. Definir nombres de recursos
        const servicePrincipalUserName = "AstraOpsApiServicePrincipalUser";
        const executionRoleName = "AstraOpsExecutionRoleForUser";
        const managedPolicyName = "AstraOpsUserManagedPolicy";

        logger.table('Resource Names', {
            'Service Principal User': servicePrincipalUserName,
            'Execution Role': executionRoleName,
            'Managed Policy': managedPolicyName
        });

        // 6. Crear Service Principal User
        logger.step(4, 'Creating Service Principal User & Policies');
        logger.loading('Setting up IAM user with AssumeRole permissions...');
        const servicePrincipal = await iamService.createServicePrincipal(
            servicePrincipalUserName,
            executionRoleName,
            accountId
        );
        logger.completed('Service Principal User created with credentials');

        // 7. Crear Managed Policy
        logger.step(5, 'Creating Managed Policy for EKS operations');
        logger.loading('Generating policy document with EKS, ECR, S3 permissions...');
        const managedPolicyDoc = iamService.getManagedPolicyDocument();
        const managedPolicy = await iamService.createManagedPolicy(managedPolicyName, managedPolicyDoc);
        logger.completed('Managed Policy created successfully');

        // 8. Crear Execution Role
        logger.step(6, 'Creating Execution Role for AstraOps');
        logger.loading('Setting up role with trust relationship...');
        const executionRole = await iamService.createExecutionRole(
            executionRoleName,
            servicePrincipal.arn
        );
        logger.completed('Execution Role created with trust policy');

        // 9. Adjuntar política al rol
        logger.step(7, 'Attaching permissions to Execution Role');
        logger.loading('Linking managed policy to execution role...');
        await iamService.attachPolicyToRole(executionRoleName, managedPolicy.arn);
        logger.completed('Policy successfully attached to role');

        // 10. Registrar con AstraOps API
        logger.step(8, 'Registering with AstraOps Platform');
        logger.loading('Sending credentials to AstraOps API...');
        const jobId = await astraopsService.registerRole(
            executionRole.arn,
            {
                accessKeyId: servicePrincipal.accessKeyId,
                secretAccessKey: servicePrincipal.secretAccessKey
            }
        );
        
        logger.table('Registration Results', {
            'Job ID': jobId,
            'Execution Role ARN': executionRole.arn,
            'Status': 'Registered Successfully'
        });
        logger.completed('Successfully registered with AstraOps API');

        // 11. Stream de logs
        logger.step(9, 'Monitoring EKS setup progress');
        logger.highlight('Starting real-time log streaming...');
        logger.info('Connecting to AstraOps log stream for setup monitoring');
        await logStreamer.streamLogs(jobId);

    } catch (error) {
        logger.error(`Setup failed: ${error}`);
        console.log(theme.red('\n💥 Setup encountered an error!'));
        console.log(theme.yellow('🔧 Troubleshooting tips:'));
        console.log(theme.gray('  • Check your AWS credentials and permissions'));
        console.log(theme.gray('  • Verify AstraOps API key and endpoint'));
        console.log(theme.gray('  • Ensure required environment variables are set'));
        console.log(theme.gray('  • Run with --verbose for detailed logs'));
        throw error;
    }
}

// Ejecutar si es el archivo principal
if (import.meta.main) {
    main().catch((error) => {
        console.error(theme.bold(theme.red("❌ Unhandled error in main:")), theme.red(String(error)));
        process.exit(1);
    });
} 