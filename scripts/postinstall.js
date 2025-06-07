import { createWriteStream, chmodSync, existsSync, mkdirSync, unlink } from 'fs';
import { get } from 'https';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { version: packageVersion, repository } = require('../package.json');

const version = `v${packageVersion}`;
const repoUrl = repository.url.replace('git+', '').replace('.git', '');
const repo = new URL(repoUrl).pathname.substring(1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.env.SKIP_ASTRAOPS_CLI_POSTINSTALL) {
  console.log('Skipping AstraOps CLI postinstall (build pipeline detected).');
  process.exit(0);
}

function getAssetName() {
  const platform = os.platform();
  switch (platform) {
    case 'win32':
      return 'astraops-cli-windows.exe';
    case 'darwin':
      return 'astraops-cli-macos';
    case 'linux':
      return 'astraops-cli-linux';
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(dest);

        const request = get(url, response => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                if (response.headers.location) {
                    download(response.headers.location, dest).then(resolve).catch(reject);
                    request.destroy();
                } else {
                    reject(new Error('Redirect location not found.'));
                }
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: ${response.statusCode} ${response.statusMessage}`));
                return;
            }

            response.pipe(file);
        });

        file.on('finish', () => {
            file.close(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        request.on('error', err => {
            unlink(dest, () => reject(err));
        });

        file.on('error', err => {
            unlink(dest, () => reject(err));
        });
    });
}

async function main() {
  try {
    const assetName = getAssetName();
    const url = `https://github.com/${repo}/releases/download/${version}/${assetName}`;
    const binDir = join(__dirname, '..', 'bin');
    const dest = join(binDir, assetName);

    if (!existsSync(binDir)) {
      mkdirSync(binDir, { recursive: true });
    }

    console.log(`Downloading AstraOps CLI binary for your system...`);
    console.log(`Source: ${url}`);
    await download(url, dest);

    if (os.platform() !== 'win32') {
      chmodSync(dest, 0o755);
    }
    console.log('AstraOps CLI binary installed successfully!');
    console.log('You can now run "astraops-cli --help"');
  } catch (error) {
    console.error('Failed to install AstraOps CLI binary:', error);
    process.exit(1);
  }
}

main(); 