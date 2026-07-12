#!/bin/bash
set -e
cd "$(dirname "$0")/.."
dotnet publish src/Morget/Morget.csproj -c Release -r win-x64 -p:PublishSingleFile=true --self-contained
dotnet publish src/Morget/Morget.csproj -c Release -r linux-x64 -p:PublishSingleFile=true --self-contained
dotnet publish src/Morget/Morget.csproj -c Release -r osx-x64 -p:PublishSingleFile=true --self-contained
echo "Publish complete."
