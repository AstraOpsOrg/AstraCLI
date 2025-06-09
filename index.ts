#!/usr/bin/env bun
import { main } from '@/src/main.ts';
import { Command } from 'commander';
import theme from '@/src/utils/theme.ts';

const program = new Command();

// ASCII banner 
const banner = 
`${theme.greenCustom('    _    ____ _____ ____      _    ___  ____  ____  ')}
${theme.greenCustom('   / \\  / ___|_   _|  _ \\    / \\  / _ \\|  _ \\/ ___| ')}
${theme.greenCustom('  / _ \\ \\___ \\ | | | |_) |  / _ \\| | | | |_) \\___ \\ ')}
${theme.greenCustom(' / ___ \\ ___) || | |  _ <  / ___ \\ |_| |  __/ ___) |')}
${theme.greenCustom('/_/   \\_\\____/ |_| |_| \\_\\/_/   \\_\\___/|_|   |____/ ')}

${theme.yellowCustom('     ☁️ Your bridge between code and cloud ☁️')}
${theme.blueCustom('                AstraOps')} ${theme.gray('CLI v0.0.3')}
`;

program
    .name('astraops-cli')
    .version('astraops-cli v0.0.3', '-v, --version', 'Display version information')
    .helpOption('-h, --help', 'Display help for command')
    .addHelpText('beforeAll', banner)
    .addHelpText('after', `
${theme.bg.yellow('Required environment variables:')}
${theme.blueCustom('AWS_ACCESS_KEY_ID')}      ${theme.gray('AWS Access Key ID')}
${theme.blueCustom('AWS_SECRET_ACCESS_KEY')}  ${theme.gray('AWS Secret Access Key')}
${theme.blueCustom('AWS_REGION')}             ${theme.gray('AWS Region (e.g., us-west-2)')}
${theme.blueCustom('ASTRAOPS_API_URL')}       ${theme.gray('AstraOps API endpoint URL')}
${theme.blueCustom('ASTRAOPS_API_KEY')}       ${theme.gray('AstraOps API key')}

${theme.yellowCustom('Learn more:')} ${theme.blueCustom('https://github.com/AstraOpsOrg/AstraCLI')}
`)
    .configureHelp({
        helpWidth: 120,
        sortSubcommands: true,
    });
    program
    .command('setup')
    .description('Setup AWS IAM resources and register with AstraOps API')
    .option('--dry-run', 'Show what would be done without making changes')
    .option('--verbose', 'Enable verbose logging with detailed information')
    .addHelpText('before', `
${theme.greenCustom('🔧 SETUP COMMAND')}
${theme.gray('This command will:')}
${theme.greenCustom('  ✓')} ${theme.gray('Create AWS IAM Service Principal User')}
${theme.greenCustom('  ✓')} ${theme.gray('Create AWS IAM Managed Policy')}
${theme.greenCustom('  ✓')} ${theme.gray('Create AWS IAM Execution Role')}
${theme.greenCustom('  ✓')} ${theme.gray('Register with AstraOps API')}
${theme.greenCustom('  ✓')} ${theme.gray('Stream real-time setup logs')}

${theme.bg.yellow('Required environment variables:')}
${theme.blueCustom('AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION')}
${theme.blueCustom('ASTRAOPS_API_URL, ASTRAOPS_API_KEY')}
`)
    .action(async (options) => {
        console.log(banner);
        
        if (options.dryRun) {
            console.log(`${theme.blueCustom('\n🔍 DRY RUN MODE - No changes will be made\n')}`);
            console.log(`${theme.yellowCustom('Would execute the following steps:')}`);
            console.log(`${theme.greenCustom('  1. ✓ Validate environment variables')}`);
            console.log(`${theme.greenCustom('  2. ✓ Create AWS IAM Service Principal User')}`);
            console.log(`${theme.greenCustom('  3. ✓ Create AWS IAM Managed Policy')}`);
            console.log(`${theme.greenCustom('  4. ✓ Create AWS IAM Execution Role')}`);
            console.log(`${theme.greenCustom('  5. ✓ Register with AstraOps API')}`);
            console.log(`${theme.greenCustom('  6. ✓ Stream setup logs')}`);
            console.log(`${theme.gray('\nUse without --dry-run to execute these steps.')}`);
            return;
        }

        console.log(`${theme.greenCustom('🚀 Starting AstraOps setup...\n')}`);

        try {
            await main({ verbose: options.verbose, dryRun: options.dryRun });
            console.log(`${theme.greenCustom('\n🎉 Setup completed successfully!')}`);
        } catch (error) {
            console.error(`${theme.yellowCustom('\n❌ Setup failed:')}`, `${theme.yellowCustom(String(error))}`);
            process.exit(1);
        }
    });

program
    .command('validate')
    .description('Validate environment variables without running setup')
    .addHelpText('before', `
${theme.blueCustom('🔍 VALIDATE COMMAND')}
${theme.gray('This command will check:')}
${theme.blueCustom('  •')} ${theme.gray('AWS credentials configuration')}
${theme.blueCustom('  •')} ${theme.gray('AstraOps API configuration')}
${theme.blueCustom('  •')} ${theme.gray('Required environment variables')}
`)
    .action(async () => {
        console.log(`${theme.blueCustom('\n🔍 Validating configuration...\n')}`);
        
        try {
            const { validateAndGetConfig } = await import('./src/config.js');
            const config = validateAndGetConfig();
            
            console.log(`${theme.greenCustom('✅ Environment variables validated successfully!\n')}`);
            console.log(`${theme.blueCustom('📋 Configuration Summary:')}`);
            console.log(`${theme.gray('  AWS Region:')}`, `${theme.greenCustom(config.aws.region)}`);
            console.log(`${theme.gray('  AstraOps API:')}`, `${theme.greenCustom(config.astraops.apiUrl)}`);
            console.log(`${theme.gray('  AWS Access Key:')}`, `${theme.greenCustom(config.aws.accessKeyId.substring(0, 8) + '...')}`);
            console.log(`${theme.gray('\n🎉 Ready to run setup!')}`);
        } catch (error) {
            console.error(`${theme.yellowCustom('❌ Configuration validation failed:')}`);
            console.error(`${theme.yellowCustom(String(error))}`);
            console.log(`${theme.yellowCustom('\n💡 Make sure all required environment variables are set.')}`);
            process.exit(1);
        }
    });

// Show banner when no command is provided
if (process.argv.length === 2) {
    console.log(banner);
    console.log(`${theme.gray('Use')} ${theme.blueCustom('astraops-cli --help')} ${theme.gray('for detailed information.')}`);
    process.exit(0);
}

program.parse(); 