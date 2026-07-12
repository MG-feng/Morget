#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Morget fix: diagnostic Program.cs + simplified GitHub Actions artifact upload
"""

import subprocess
import sys
from pathlib import Path

WORKFLOW_CONTENT = r"""name: Build

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: '10.0.x'

    - name: Restore dependencies
      run: dotnet restore

    - name: Build Release
      run: dotnet build --no-restore --configuration Release

    - name: Test
      run: dotnet test --verbosity normal

    - name: Publish Windows x64
      run: |
        dotnet publish src/Morget/Morget.csproj `
          --configuration Release `
          --runtime win-x64 `
          --self-contained true `
          -p:PublishSingleFile=true `
          -p:IncludeNativeLibrariesForSelfExtract=true `
          --output ./publish

    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: Morget-Windows-x64
        path: ./publish/**
        retention-days: 30
"""

PROGRAM_CS = r"""using System;
using System.Windows.Forms;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;

namespace Morget;

class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        try
        {
            Console.WriteLine("[Morget v2.0] Starting...");

            var app = new Morget.Core.Application();
            Console.WriteLine("[Morget] Application initialized");

            var pluginManager = new PluginManager();
            pluginManager.Initialize();
            Console.WriteLine("[Morget] PluginManager initialized");

            BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Fatal error: {ex.Message}\n\n{ex.StackTrace}",
                "Morget Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Environment.ExitCode = 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .LogToTrace();
}
"""


def run_cmd(cmd, cwd=None):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def main():
    if len(sys.argv) > 1:
        root = Path(sys.argv[1]).resolve()
    else:
        root = Path.cwd()

    print("Fixing Morget: diagnostic output + artifact upload")
    print("Project root: " + str(root))
    print()

    # 1. Update workflow - no auto-release, just artifact upload
    workflow = root / ".github" / "workflows" / "build.yml"
    workflow.parent.mkdir(parents=True, exist_ok=True)
    workflow.write_text(WORKFLOW_CONTENT, encoding="utf-8")
    print("  OK: Updated .github/workflows/build.yml (artifact upload only)")

    # 2. Update Program.cs with diagnostic MessageBox
    program = root / "src" / "Morget" / "Program.cs"
    program.write_text(PROGRAM_CS, encoding="utf-8")
    print("  OK: Updated Program.cs with diagnostic MessageBox")

    # 3. Commit and push
    print()
    print("Committing...")
    run_cmd("git add .", cwd=root)
    code, out, err = run_cmd(
        'git commit -m "fix: add diagnostic output, simplify CI artifact upload"',
        cwd=root,
    )
    if code == 0:
        print("  OK: Committed")
    else:
        print("  Info: " + (err or "nothing to commit"))

    print("Pushing...")
    code, out, err = run_cmd("git push origin main", cwd=root)
    if code == 0:
        print("  OK: Pushed")
    else:
        print("  Error: " + err)

    print()
    print("=" * 50)
    print("Done!")
    print()
    print("Next steps:")
    print("  1. GitHub Actions will build and upload artifacts")
    print("  2. Download from: https://github.com/MG-feng/Morget/actions")
    print("  3. Artifact structure: Morget.exe + src/*.pdb")
    print()
    print("If .exe still crashes, the MessageBox will show the error.")


if __name__ == "__main__":
    main()
