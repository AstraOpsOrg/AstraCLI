# AstraCLI
[![DeepWiki](https://img.shields.io/badge/DeepWiki-AstraCLI-blue?logo=readthedocs&logoColor=white)](https://deepwiki.com/AstraOpsOrg/AstraCLI)

Command-line interface for deploying containerized applications to AWS EKS through the AstraOps platform.

## What It Does

AstraCLI is the entry point for developers to deploy applications. It handles:

- **AWS Authentication:** Creates IAM execution roles with least-privilege policies
- **Credential Management:** Generates temporary credentials via AWS STS
- **Backend Communication:** Submits deployment requests to AstraBack API
- **Real-time Feedback:** Streams deployment logs via SSE
- **Simulation Mode:** Test deployments without provisioning resources

Available as standalone binaries for Linux, Windows, and macOS, or via NPM.

## Installation

Via NPM:
```bash
npm install -g @astraops/astraops-cli
```

Or download binaries from [GitHub Releases](https://github.com/AstraOpsOrg/AstraCLI/releases).

## Configuration

Set environment variables:
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_ACCOUNT_ID="123456789012"
export AWS_REGION="us-west-2"
export ASTRAOPS_API_KEY="your-api-key"
export ASTRAOPS_API_URL="https://api.astraops.com"
```

Create `astraops.yaml`:
```yaml
applicationName: my-app
services:
  - name: frontend
    image: my-frontend:latest
    port: 80
  - name: backend
    image: my-backend:latest
    port: 5000
```

## Usage

Deploy:
```bash
astraops-cli deploy --monitoring
```

Destroy:
```bash
astraops-cli destroy
```

Simulate (no actual resources):
```bash
SIMULATE=true astraops-cli deploy
```

## Project Structure

```
src/
├── commands/
│   ├── deploy.ts          # Deploy orchestration
│   ├── deploy.simulate.ts # Simulation mode
│   └── destroy.ts         # Infrastructure teardown
├── services/
│   ├── backend.ts         # AstraBack API client
│   └── iam.ts             # AWS IAM management
└── policies/
    └── executionRolePolicy.ts # Least-privilege policies
```

## How It Works

1. CLI creates AWS IAM execution role with necessary permissions
2. Creates IAM user that assumes the execution role
3. Sends deployment request to AstraBack with temporary credentials
4. Streams real-time logs from backend via SSE
5. Displays deployment URLs and monitoring access

## Development

Clone and install:
```bash
git clone https://github.com/AstraOpsOrg/AstraCLI.git
cd AstraCLI
bun install
```

Run locally:
```bash
bun run index.ts deploy
```

Build binaries:
```bash
bun run build:all  # All platforms
bun run build:local  # Current platform
```

## Documentation

[DeepWiki Documentation](https://deepwiki.com/AstraOpsOrg/AstraCLI)

## License

Apache License 2.0 