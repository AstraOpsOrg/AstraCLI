# AstraOps CLI

🚀 **AstraOps CLI** - AWS EKS setup and configuration tool

## 📦 Installation

### Option 1: Download Binary (Recommended)

1. **Download the latest release** for your platform:
   - [Linux x64](./dist/astraops-cli-linux)
   - [macOS x64](./dist/astraops-cli-macos) 
   - [Windows x64](./dist/astraops-cli-windows.exe)

2. **Install globally:**

   **Linux/macOS:**
   ```bash
   # Make executable and install
   chmod +x astraops-cli-*
   sudo mv astraops-cli-* /usr/local/bin/astraops-cli
   ```

   **Windows:**
   ```powershell
   # Move to a directory in your PATH
   move astraops-cli-windows.exe C:\Windows\System32\astraops-cli.exe
   ```

3. **Verify installation:**
   ```bash
   astraops-cli --help
   ```

### Option 2: Auto-install Script (Linux/macOS)

```bash
# Clone and install
git clone <your-repo>
cd astraops-cli
bun run build:all
sudo ./install.sh
```

### Option 3: Install via NPM

```bash
npm install -g astraops-cli
```

## 🛠️ Usage

### Commands

```bash
# Setup AWS IAM resources and register with AstraOps
astraops-cli setup [options]

# Validate environment variables
astraops-cli validate

# Show help
astraops-cli --help
```

### Options

```bash
# Enable verbose logging
astraops-cli setup --verbose

# Dry run (show what would be done)
astraops-cli setup --dry-run
```

## ⚙️ Configuration

Create a `.env` file or set environment variables:

```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-west-2
ASTRAOPS_API_URL=https://api.astraops.com
ASTRAOPS_API_KEY=your_api_key
```

## 📋 Examples

```bash
# Complete setup with verbose logging
astraops-cli setup --verbose

# Check configuration without running
astraops-cli setup --dry-run

# Validate environment only
astraops-cli validate
```

## 🏗️ Development

### Prerequisites

- [Bun](https://bun.sh/) runtime

### Build from source

```bash
# Clone repository
git clone <your-repo>
cd astraops-cli

# Install dependencies
bun install

# Run in development
bun run dev setup --help

# Build binaries
bun run build:all
```

### Project Structure

```
src/
├── types.ts           # TypeScript interfaces
├── config.ts          # Environment configuration
├── aws-clients.ts     # AWS client setup
├── iam-service.ts     # IAM operations
├── astraops-service.ts # AstraOps API integration
├── logger.ts          # Log streaming
├── utils/
│   └── logger.ts      # Logging system
├── main.ts            # Main orchestration
└── index.ts           # Public exports
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[MIT License](LICENSE)