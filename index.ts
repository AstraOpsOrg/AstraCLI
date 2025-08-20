#!/usr/bin/env bun
import { Command } from 'commander';
import theme from '@/src/utils/theme.ts';
import { registerDeployCommand } from '@/src/commands/deploy.ts';
import { registerDestroyCommand } from '@/src/commands/destroy.ts';

const program = new Command();

// ASCII banner
const banner =
`${theme.greenCustom('    _    ____ _____ ____      _    ___  ____  ____  ')}
${theme.greenCustom('   / \\  / ___|_   _|  _ \\    / \\  / _ \\|  _ \\/ ___| ')}
${theme.greenCustom('  / _ \\ \\___ \\ | | | |_) |  / _ \\| | | | |_) \\___ \\ ')}
${theme.greenCustom(' / ___ \\ ___) || | |  _ <  / ___ \\ |_| |  __/ ___) |')}
${theme.greenCustom('/_/   \\_\\____/ |_| |_| \\_\\/_/   \\_\\___/|_|   |____/ ')}

${theme.yellowCustom('     ☁️ Your bridge between code and cloud ☁️')}
${theme.blueCustom('                AstraOps')} ${theme.gray('CLI v1.1.1')}
`;

program
  .name('astraops-cli')
  .version('astraops-cli v1.1.1', '-v, --version', 'Display version information')
  .addHelpText('beforeAll', banner)
  .helpCommand(false)
  .addHelpText('after', `
${theme.bg.yellow('Required environment variables:')}
${theme.blueCustom('AWS_ACCESS_KEY_ID')}      ${theme.gray('AWS Access Key ID')}
${theme.blueCustom('AWS_SECRET_ACCESS_KEY')}  ${theme.gray('AWS Secret Access Key')}
${theme.blueCustom('AWS_REGION')}             ${theme.gray('AWS Region (e.g., us-west-2)')}
${theme.blueCustom('AWS_ACCOUNT_ID')}         ${theme.gray('AWS Account ID (12 digits)')}
${theme.blueCustom('ASTRAOPS_API_KEY')}       ${theme.gray('AstraOps API key')}

${theme.yellowCustom('Learn more:')} ${theme.blueCustom('https://github.com/AstraOpsOrg/AstraCLI')}
`);

// Register commands (modular)
registerDeployCommand(program);
registerDestroyCommand(program);

// Unknown command fallback
program.on('command:*', () => {
  console.log(banner);
  console.log(`${theme.gray('Use')} ${theme.blueCustom('astraops-cli --help')} ${theme.gray('for detailed information.')}`);
  process.exit(0);
});

// Show banner when no command is provided
if (process.argv.length === 2) {
  console.log(banner);
  console.log(`${theme.gray('Use')} ${theme.blueCustom('astraops-cli --help')} ${theme.gray('for detailed information.')}`);
  process.exit(0);
}

program.parse();