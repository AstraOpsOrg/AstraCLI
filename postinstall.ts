import { platform } from "os";
import { mkdirSync, createWriteStream, chmodSync } from "fs";
import { get } from "https";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const version = "v0.0.3"; 
const repo = "AstraOpsOrg/AstraCLI";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getAssetName(): string {
  const plt = platform();
  switch (plt) {
    case "win32":
      return "astraops-cli-windows.exe";
    case "darwin":
      return "astraops-cli-macos";
    case "linux":
      return "astraops-cli-linux";
    default:
      throw new Error(`Unsupported platform: ${plt}`);
  }
}

function main() {
  try {
    const assetName = getAssetName();
    const url = `https://github.com/${repo}/releases/download/${version}/${assetName}`;
    
    const binDir = join(__dirname, "bin");
    const destName = platform() === "win32" ? "astraops-cli.exe" : "astraops-cli";
    const dest = join(binDir, destName);

    mkdirSync(binDir, { recursive: true });

    console.log(`Downloading AstraOps CLI ${version} for your system...`);
    console.log(`Source: ${url}`);
    
    const file = createWriteStream(dest);
    
    get(url, (res) => {
      if (res.statusCode === 302) { 
        if (res.headers.location) {
          get(res.headers.location, (redirectRes) => {
            redirectRes.pipe(file);
          });
        }
      } else {
        res.pipe(file);
      }
    });

    file.on("finish", () => {
      file.close();
      if (platform() !== "win32") {
        chmodSync(dest, 0o755);
      }
      console.log("AstraOps CLI installed successfully!");
      console.log("You can now run 'astraops-cli --help'");
    });

    file.on('error', (err) => {
      console.error("Error writing file:", err);
      process.exit(1);
    });

  } catch (error) {
    console.error("Failed to install AstraOps CLI:", error);
    process.exit(1);
  }
}

main(); 