#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Morget GitHub Actions fix - update test packages for .NET 10 compatibility
"""

import subprocess
import sys
from pathlib import Path

WORKFLOW_CONTENT = r"""name: Build and Release

on:
  push:
    branches: [main]
    tags: ['v*']
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

    - name: Build
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
          --output ./publish/win-x64

    - name: Upload artifact
      uses: actions/upload-artifact@v4
      with:
        name: Morget-Windows-x64
        path: ./publish/win-x64

  release:
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')

    steps:
    - name: Download artifact
      uses: actions/download-artifact@v4
      with:
        name: Morget-Windows-x64
        path: ./publish

    - name: Create Release
      uses: softprops/action-gh-release@v1
      with:
        files: ./publish/**
        generate_release_notes: true
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
"""

MORGET_CORE_TESTS = r"""<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageReference Include="xunit" Version="2.9.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\..\src\Morget.Core\Morget.Core.csproj" />
  </ItemGroup>
</Project>
"""

MORGET_RUNTIME_TESTS = r"""<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.12.0" />
    <PackageReference Include="xunit" Version="2.9.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\..\src\Morget.Runtime\Morget.Runtime.csproj" />
  </ItemGroup>
</Project>
"""


def run_cmd(cmd, cwd=None):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def main():
    if len(sys.argv) > 1:
        root = Path(sys.argv[1]).resolve()
    else:
        root = Path.cwd()

    print("Fixing GitHub Actions and test packages")
    print("Project root: " + str(root))
    print()

    # 1. Update workflow file
    workflow = root / ".github" / "workflows" / "build.yml"
    if workflow.exists():
        workflow.write_text(WORKFLOW_CONTENT, encoding="utf-8")
        print("  OK: Updated .github/workflows/build.yml")
    else:
        workflow.parent.mkdir(parents=True, exist_ok=True)
        workflow.write_text(WORKFLOW_CONTENT, encoding="utf-8")
        print("  OK: Created .github/workflows/build.yml")

    # 2. Update test project files
    core_tests = root / "tests" / "Morget.Core.Tests" / "Morget.Core.Tests.csproj"
    if core_tests.exists():
        core_tests.write_text(MORGET_CORE_TESTS, encoding="utf-8")
        print("  OK: Updated Morget.Core.Tests.csproj")

    runtime_tests = (
        root / "tests" / "Morget.Runtime.Tests" / "Morget.Runtime.Tests.csproj"
    )
    if runtime_tests.exists():
        runtime_tests.write_text(MORGET_RUNTIME_TESTS, encoding="utf-8")
        print("  OK: Updated Morget.Runtime.Tests.csproj")

    # 3. Commit and push
    print()
    print("Committing changes...")
    run_cmd("git add .", cwd=root)
    code, out, err = run_cmd(
        'git commit -m "fix: update test packages for .NET 10 compatibility"', cwd=root
    )
    if code == 0:
        print("  OK: Committed")
    else:
        print("  Info: " + (err or "nothing to commit"))

    print("Pushing to GitHub...")
    code, out, err = run_cmd("git push origin main", cwd=root)
    if code == 0:
        print("  OK: Pushed")
    else:
        print("  Error: " + err)

    # 4. Update tag
    print("Updating tag...")
    run_cmd("git tag -d v2.0.0", cwd=root)
    run_cmd("git tag v2.0.0", cwd=root)
    code, out, err = run_cmd("git push origin v2.0.0 --force", cwd=root)
    if code == 0:
        print("  OK: Tag updated")
    else:
        print("  Error: " + err)

    print()
    print("=" * 50)
    print("Done!")
    print()
    print("GitHub Actions will now rebuild with updated test packages.")
    print("Check: https://github.com/MG-feng/Morget/actions")


if __name__ == "__main__":
    main()
