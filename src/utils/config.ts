import theme from '@/src/utils/theme.ts';
import { parse } from 'yaml';

export function requiredEnv(name: string): string {
  const value = Bun.env[name];
  if (!value || value.trim() === '') {
    console.error(theme.red(`❌ Missing required environment variable: ${name}.`));
    process.exit(1);
  }
  return value;
}

export async function readAstraopsYaml(path = './astraops.yaml'): Promise<any> {
  const file = Bun.file(path);
  if (!(await file.exists())) {
    console.error(theme.red(`❌ Required file not found: ${path}`));
    console.error(theme.gray('The project must include an `astraops.yaml` at the root directory.'));
    process.exit(1);
  }
  const content = parse(await file.text());
  content.applicationName = content.applicationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  return content;
}

export async function wait(ms: number) {
  await Bun.sleep(ms);
}

