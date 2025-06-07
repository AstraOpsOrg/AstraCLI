#!/bin/bash

# AstraOps CLI local uninstallation script
echo "Uninstalling AstraOps CLI locally..."

# Determine the installation directory and target name based on the OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # This is for Windows (Git Bash/MinGW)
    INSTALL_DIR="$HOME/bin"
    TARGET_NAME="astraops-cli.exe"
else
    # This is for Linux/macOS
    INSTALL_DIR="/usr/local/bin"
    TARGET_NAME="astraops-cli"
fi

FILE_TO_DELETE="$INSTALL_DIR/$TARGET_NAME"

echo "Attempting to remove: $FILE_TO_DELETE"

if [[ -f "$FILE_TO_DELETE" ]]; then
    rm -f "$FILE_TO_DELETE"
    if [[ $? -eq 0 ]]; then
        echo "AstraOps CLI uninstalled successfully!"
    else
        echo "Failed to remove the file. You may need to run with sudo or check permissions."
        exit 1
    fi
else
    echo "AstraOps CLI not found at the expected location. Nothing to do."
fi 