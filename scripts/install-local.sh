#!/bin/bash

# AstraOps CLI local installation script for git bash/mingw64
echo "Installing AstraOps CLI locally..."

# Check if we're on Windows (MINGW/MSYS)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    BINARY_FILE="./dist/astraops-cli.exe"
    TARGET_NAME="astraops-cli.exe"
    INSTALL_DIR="$HOME/bin"
else
    BINARY_FILE="./dist/astraops-cli"
    TARGET_NAME="astraops-cli"
    INSTALL_DIR="/usr/local/bin"
fi

# Check if binary exists
if [[ ! -f "$BINARY_FILE" ]]; then
    echo "Binary not found at $BINARY_FILE"
    echo "Run 'bun run build' first"
    exit 1
fi

# Create install directory if it doesn't exist
if [[ ! -d "$INSTALL_DIR" ]]; then
    mkdir -p "$INSTALL_DIR"
    echo "Created directory: $INSTALL_DIR"
fi

# Make binary executable
chmod +x "$BINARY_FILE"

# Copy binary
cp "$BINARY_FILE" "$INSTALL_DIR/$TARGET_NAME"

# For Windows/MINGW64, add to PATH if not already there
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Check if ~/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/bin:"* ]]; then
        echo "Adding $HOME/bin to PATH..."
        echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
        export PATH="$HOME/bin:$PATH"
        echo "PATH updated! Restart your terminal or run: source ~/.bashrc"
    fi
    echo "astraops-cli installed at $INSTALL_DIR/$TARGET_NAME"
else
    # For Linux/macOS
    if sudo cp "$BINARY_FILE" "$INSTALL_DIR/$TARGET_NAME" 2>/dev/null; then
        echo "astraops-cli installed globally at $INSTALL_DIR/$TARGET_NAME"
    else
        echo "Failed to install globally. Try running with sudo or use manual installation."
        exit 1
    fi
fi

echo "You can now use: astraops-cli --help" 