#!/bin/bash
set -e
cd "$(dirname "$0")/.."
dotnet restore
dotnet build -c Release
echo "Build complete."
