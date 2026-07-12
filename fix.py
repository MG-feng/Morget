#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Morget v2.0 .NET 8 -> .NET 10 升级脚本 + Git 修复
用法: python upgrade_to_net10.py [项目根目录路径]
"""

import subprocess
import sys
from pathlib import Path


def replace_in_file(file_path: Path, old: str, new: str) -> bool:
    """在文件中替换文本"""
    if not file_path.exists():
        return False
    content = file_path.read_text(encoding="utf-8")
    if old in content:
        content = content.replace(old, new)
        file_path.write_text(content, encoding="utf-8")
        return True
    return False


def run_cmd(cmd, cwd=None):
    """运行命令"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return result.returncode, result.stdout, result.stderr


def main():
    if len(sys.argv) > 1:
        root = Path(sys.argv[1]).resolve()
    else:
        root = Path.cwd()

    print("🔧 Upgrading Morget from .NET 8 to .NET 10")
    print(f"   Project root: {root}")
    print()

    fixed = []

    # 1. 更新 Directory.Build.props
    dbp = root / "Directory.Build.props"
    if replace_in_file(
        dbp,
        "<TargetFramework>net8.0</TargetFramework>",
        "<TargetFramework>net10.0</TargetFramework>",
    ):
        print(f"  ✓ Updated {dbp.relative_to(root)}: net8.0 -> net10.0")
        fixed.append(str(dbp.relative_to(root)))

    # 2. 更新所有 .csproj 文件中的 TargetFramework
    for csproj in root.rglob("*.csproj"):
        if replace_in_file(
            csproj,
            "<TargetFramework>net8.0</TargetFramework>",
            "<TargetFramework>net10.0</TargetFramework>",
        ):
            print(f"  ✓ Updated {csproj.relative_to(root)}: net8.0 -> net10.0")
            fixed.append(str(csproj.relative_to(root)))

    # 3. 更新 LangVersion (可选，.NET 10 支持 C# 14)
    if replace_in_file(
        dbp, "<LangVersion>12.0</LangVersion>", "<LangVersion>14.0</LangVersion>"
    ):
        print(f"  ✓ Updated {dbp.relative_to(root)}: C# 12 -> C# 14")

    # 4. 更新 PackageReference 版本
    # 注意：这些包可能需要更新到 .NET 10 兼容版本
    # 先尝试构建，如果失败再更新包版本

    print()
    print("=" * 50)
    if fixed:
        print(f"🔧 Updated: {len(fixed)} files")
        for f in fixed:
            print(f"  ✓ {f}")
    else:
        print("✅ No files needed updating (already .NET 10?)")

    # 5. Git 修复 - 确保分支名正确
    print()
    print("🔧 Fixing Git branch...")

    # 检查当前分支
    code, out, err = run_cmd("git branch --show-current", cwd=root)
    current_branch = out.strip() if code == 0 else ""

    if current_branch == "master":
        # 重命名分支为 main
        run_cmd("git branch -m main", cwd=root)
        print("  ✓ Renamed branch: master -> main")
    elif current_branch == "main":
        print("  ✓ Branch already named 'main'")
    else:
        print(f"  ⚠ Current branch: '{current_branch}'")

    # 6. 添加 .gitignore 排除 bin/obj
    gitignore = root / ".gitignore"
    if not gitignore.exists():
        gitignore_content = """# Build outputs
bin/
obj/
publish/

# IDE
.vs/
.vscode/
*.user
*.suo

# NuGet
*.nupkg
packages/

# Logs
*.log
Logs/

# OS
.DS_Store
Thumbs.db
"""
        gitignore.write_text(gitignore_content, encoding="utf-8")
        print("  ✓ Created .gitignore")

    # 7. 清理并重新提交
    print()
    print("🔧 Cleaning repository...")
    run_cmd("git rm -r --cached .", cwd=root)
    run_cmd("git add .", cwd=root)

    code, out, err = run_cmd('git commit -m "feat: upgrade to .NET 10"', cwd=root)
    if code == 0:
        print("  ✓ Committed changes")
    else:
        print(f"  ℹ {err.strip() or 'Nothing new to commit'}")

    print()
    print("🎉 Upgrade complete!")
    print()
    print("Next steps:")
    print("  1. Ensure .NET 10 SDK is installed:")
    print("     dotnet --version")
    print("  2. Clean and rebuild:")
    print("     dotnet clean")
    print("     dotnet restore")
    print("     dotnet build")
    print("  3. Push to GitHub:")
    print("     git push -u origin main")
    print("  4. Create release tag:")
    print("     git tag v2.0.0")
    print("     git push origin v2.0.0")
    print()
    print("Note: If package version conflicts occur, update PackageReference")
    print("versions in Directory.Build.props to .NET 10 compatible versions.")


if __name__ == "__main__":
    main()
