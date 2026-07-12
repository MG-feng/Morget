#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Morget v2.0 项目一键生成器
- 生成完整目录结构
- 写入所有 .cs / .csproj / .axaml / .json / .sh / .ps1 文件
- 应用 Qwen 审核补丁（EventBus UI 线程修复 + GitHubStore 懒加载修复）
- 自动 git init && git add . && git commit
"""
import os
import subprocess
import sys
from pathlib import Path

# ============================================================
# 文件内容字典：路径 -> 内容
# ============================================================
FILES = {
    # -- 根级 --
    "Morget.sln": r'''Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Core", "src\Morget.Core\Morget.Core.csproj", "{A1B2C3D4-E5F6-7890-AB12-CD34EF567890}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Runtime", "src\Morget.Runtime\Morget.Runtime.csproj", "{B2C3D4E5-F6A7-8901-BC23-DE45F6789012}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.PluginAPI", "src\Morget.PluginAPI\Morget.PluginAPI.csproj", "{C3D4E5F6-A7B8-9012-CD34-EF5678901234}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.PluginHost", "src\Morget.PluginHost\Morget.PluginHost.csproj", "{D4E5F6A7-B8C9-0123-DE45-F67890123456}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Store", "src\Morget.Store\Morget.Store.csproj", "{E5F6A7B8-C9D0-1234-EF56-789012345678}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.UI", "src\Morget.UI\Morget.UI.csproj", "{F6A7B8C9-D0E1-2345-F678-901234567890}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Flow", "src\Morget.Flow\Morget.Flow.csproj", "{A7B8C9D0-E1F2-3456-7890-123456789012}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Debugger", "src\Morget.Debugger\Morget.Debugger.csproj", "{B8C9D0E1-F2A3-4567-8901-234567890123}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget", "src\Morget\Morget.csproj", "{C9D0E1F2-A3B4-5678-9012-345678901234}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Core.Tests", "tests\Morget.Core.Tests\Morget.Core.Tests.csproj", "{D0E1F2A3-B4C5-6789-0123-456789012345}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Morget.Runtime.Tests", "tests\Morget.Runtime.Tests\Morget.Runtime.Tests.csproj", "{E1F2A3B4-C5D6-7890-1234-567890123456}"
EndProject
Global
    GlobalSection(SolutionConfigurationPlatforms) = preSolution
        Debug|Any CPU = Debug|Any CPU
        Release|Any CPU = Release|Any CPU
    EndGlobalSection
    GlobalSection(ProjectConfigurationPlatforms) = postSolution
        {A1B2C3D4-E5F6-7890-AB12-CD34EF567890}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {A1B2C3D4-E5F6-7890-AB12-CD34EF567890}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {A1B2C3D4-E5F6-7890-AB12-CD34EF567890}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {A1B2C3D4-E5F6-7890-AB12-CD34EF567890}.Release|Any CPU.Build.0 = Release|Any CPU
        {B2C3D4E5-F6A7-8901-BC23-DE45F6789012}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {B2C3D4E5-F6A7-8901-BC23-DE45F6789012}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {B2C3D4E5-F6A7-8901-BC23-DE45F6789012}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {B2C3D4E5-F6A7-8901-BC23-DE45F6789012}.Release|Any CPU.Build.0 = Release|Any CPU
        {C3D4E5F6-A7B8-9012-CD34-EF5678901234}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {C3D4E5F6-A7B8-9012-CD34-EF5678901234}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {C3D4E5F6-A7B8-9012-CD34-EF5678901234}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {C3D4E5F6-A7B8-9012-CD34-EF5678901234}.Release|Any CPU.Build.0 = Release|Any CPU
        {D4E5F6A7-B8C9-0123-DE45-F67890123456}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {D4E5F6A7-B8C9-0123-DE45-F67890123456}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {D4E5F6A7-B8C9-0123-DE45-F67890123456}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {D4E5F6A7-B8C9-0123-DE45-F67890123456}.Release|Any CPU.Build.0 = Release|Any CPU
        {E5F6A7B8-C9D0-1234-EF56-789012345678}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {E5F6A7B8-C9D0-1234-EF56-789012345678}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {E5F6A7B8-C9D0-1234-EF56-789012345678}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {E5F6A7B8-C9D0-1234-EF56-789012345678}.Release|Any CPU.Build.0 = Release|Any CPU
        {F6A7B8C9-D0E1-2345-F678-901234567890}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {F6A7B8C9-D0E1-2345-F678-901234567890}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {F6A7B8C9-D0E1-2345-F678-901234567890}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {F6A7B8C9-D0E1-2345-F678-901234567890}.Release|Any CPU.Build.0 = Release|Any CPU
        {A7B8C9D0-E1F2-3456-7890-123456789012}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {A7B8C9D0-E1F2-3456-7890-123456789012}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {A7B8C9D0-E1F2-3456-7890-123456789012}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {A7B8C9D0-E1F2-3456-7890-123456789012}.Release|Any CPU.Build.0 = Release|Any CPU
        {B8C9D0E1-F2A3-4567-8901-234567890123}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {B8C9D0E1-F2A3-4567-8901-234567890123}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {B8C9D0E1-F2A3-4567-8901-234567890123}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {B8C9D0E1-F2A3-4567-8901-234567890123}.Release|Any CPU.Build.0 = Release|Any CPU
        {C9D0E1F2-A3B4-5678-9012-345678901234}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {C9D0E1F2-A3B4-5678-9012-345678901234}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {C9D0E1F2-A3B4-5678-9012-345678901234}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {C9D0E1F2-A3B4-5678-9012-345678901234}.Release|Any CPU.Build.0 = Release|Any CPU
        {D0E1F2A3-B4C5-6789-0123-456789012345}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {D0E1F2A3-B4C5-6789-0123-456789012345}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {D0E1F2A3-B4C5-6789-0123-456789012345}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {D0E1F2A3-B4C5-6789-0123-456789012345}.Release|Any CPU.Build.0 = Release|Any CPU
        {E1F2A3B4-C5D6-7890-1234-567890123456}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
        {E1F2A3B4-C5D6-7890-1234-567890123456}.Debug|Any CPU.Build.0 = Debug|Any CPU
        {E1F2A3B4-C5D6-7890-1234-567890123456}.Release|Any CPU.ActiveCfg = Release|Any CPU
        {E1F2A3B4-C5D6-7890-1234-567890123456}.Release|Any CPU.Build.0 = Release|Any CPU
    EndGlobalSection
EndGlobal
''',

    "Directory.Build.props": r'''<Project>
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>12.0</LangVersion>
    <Version>2.0.0</Version>
    <Authors>Moonlight Games</Authors>
    <Company>Moonlight Games</Company>
    <Product>Morget</Product>
    <PackageProjectUrl>https://morget.dev</PackageProjectUrl>
    <RepositoryUrl>https://github.com/MoonlightGames/morget</RepositoryUrl>
    <RepositoryType>git</RepositoryType>
    <AvaloniaVersion>11.0.10</AvaloniaVersion>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Extensions.Logging" Version="8.0.1" />
    <PackageReference Include="System.Text.Json" Version="8.0.5" />
    <PackageReference Include="Moonsharp" Version="2.0.0" />
    <PackageReference Include="Serilog" Version="4.2.0" />
    <PackageReference Include="Serilog.Sinks.File" Version="6.0.0" />
    <PackageReference Include="Serilog.Sinks.Console" Version="6.0.0" />
    <PackageReference Include="Avalonia" Version="$(AvaloniaVersion)" />
    <PackageReference Include="Avalonia.Desktop" Version="$(AvaloniaVersion)" />
    <PackageReference Include="Avalonia.Themes.Fluent" Version="$(AvaloniaVersion)" />
    <PackageReference Include="Avalonia.Controls.DataGrid" Version="$(AvaloniaVersion)" />
    <PackageReference Include="Avalonia.ReactiveUI" Version="$(AvaloniaVersion)" />
    <PackageReference Include="CommunityToolkit.Mvvm" Version="8.2.2" />
  </ItemGroup>
</Project>
''',

    # -- scripts --
    "scripts/build.sh": r'''#!/bin/bash
set -e
cd "$(dirname "$0")/.."
dotnet restore
dotnet build -c Release
echo "Build complete."
''',

    "scripts/build.ps1": r'''$ErrorActionPreference = "Stop"
Push-Location (Split-Path $PSScriptRoot -Parent)
dotnet restore
dotnet build -c Release
Write-Host "Build complete." -ForegroundColor Green
Pop-Location
''',

    "scripts/publish.sh": r'''#!/bin/bash
set -e
cd "$(dirname "$0")/.."
dotnet publish src/Morget/Morget.csproj -c Release -r win-x64 -p:PublishSingleFile=true --self-contained
dotnet publish src/Morget/Morget.csproj -c Release -r linux-x64 -p:PublishSingleFile=true --self-contained
dotnet publish src/Morget/Morget.csproj -c Release -r osx-x64 -p:PublishSingleFile=true --self-contained
echo "Publish complete."
''',

    # -- Morget.Core --
    "src/Morget.Core/Morget.Core.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.Core</RootNamespace>
    <AssemblyName>Morget.Core</AssemblyName>
  </PropertyGroup>
</Project>
''',

    "src/Morget.Core/Events/IEvent.cs": r'''namespace Morget.Core.Events;

public interface IEvent { }
''',

    "src/Morget.Core/Events/EventBus.cs": r'''using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Serilog;

namespace Morget.Core.Events;

public sealed class EventBus : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<EventBus>();
    private readonly ConcurrentDictionary<Type, List<Delegate>> _handlers = new();
    private readonly ConcurrentDictionary<Type, List<Delegate>> _asyncHandlers = new();
    private bool _disposed;

    public IDisposable Subscribe<T>(Action<T> handler) where T : IEvent
    {
        ArgumentNullException.ThrowIfNull(handler);
        if (_disposed) throw new ObjectDisposedException(nameof(EventBus));

        var type = typeof(T);
        var wrapped = (Action<IEvent>)(e => handler((T)e));

        _handlers.AddOrUpdate(type,
            _ => new List<Delegate> { wrapped },
            (_, list) => { lock (list) { list.Add(wrapped); } return list; });

        return new SubscriptionToken(() => Unsubscribe(type, wrapped));
    }

    public IDisposable SubscribeAsync<T>(Func<T, Task> handler) where T : IEvent
    {
        ArgumentNullException.ThrowIfNull(handler);
        if (_disposed) throw new ObjectDisposedException(nameof(EventBus));

        var type = typeof(T);
        var wrapped = (Func<IEvent, Task>)(e => handler((T)e));

        _asyncHandlers.AddOrUpdate(type,
            _ => new List<Delegate> { wrapped },
            (_, list) => { lock (list) { list.Add(wrapped); } return list; });

        return new SubscriptionToken(() => UnsubscribeAsync(type, wrapped));
    }

    public void Publish<T>(T eventData) where T : IEvent
    {
        if (_disposed) throw new ObjectDisposedException(nameof(EventBus));
        var type = typeof(T);

        if (_handlers.TryGetValue(type, out var handlers))
        {
            List<Delegate> snapshot;
            lock (handlers) { snapshot = handlers.ToList(); }
            foreach (var h in snapshot)
            {
                try { ((Action<IEvent>)h)(eventData); }
                catch (Exception ex) { _logger.Error(ex, "Sync handler error for {Event}", type.Name); }
            }
        }

        if (_asyncHandlers.TryGetValue(type, out var asyncHandlers))
        {
            List<Delegate> snapshot;
            lock (asyncHandlers) { snapshot = asyncHandlers.ToList(); }
            foreach (var h in snapshot)
            {
                var handler = (Func<IEvent, Task>)h;
                try 
                { 
                    handler(eventData).ContinueWith(t => 
                    {
                        if (t.IsFaulted) _logger.Error(t.Exception, "Async handler error for {Event}", type.Name);
                    }, TaskContinuationOptions.OnlyOnFaulted);
                }
                catch (Exception ex) { _logger.Error(ex, "Async handler dispatch error for {Event}", type.Name); }
            }
        }
    }

    private void Unsubscribe(Type type, Delegate handler)
    {
        if (_handlers.TryGetValue(type, out var list))
        {
            lock (list) { list.Remove(handler); }
        }
    }

    private void UnsubscribeAsync(Type type, Delegate handler)
    {
        if (_asyncHandlers.TryGetValue(type, out var list))
        {
            lock (list) { list.Remove(handler); }
        }
    }

    public void ClearAll()
    {
        _handlers.Clear();
        _asyncHandlers.Clear();
        _logger.Debug("All event handlers cleared");
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        ClearAll();
    }

    private sealed class SubscriptionToken : IDisposable
    {
        private readonly Action _unsubscribe;
        private bool _disposed;

        public SubscriptionToken(Action unsubscribe) => _unsubscribe = unsubscribe;

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _unsubscribe();
        }
    }
}
''',

    "src/Morget.Core/Log/LogManager.cs": r'''using Serilog;

namespace Morget.Core.Log;

public static class LogManager
{
    public static ILogger For<T>() => Log.ForContext<T>();
    public static ILogger For(string name) => Log.ForContext("SourceContext", name);
}
''',

    "src/Morget.Core/Settings/SettingsManager.cs": r'''using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Serilog;

namespace Morget.Core.Settings;

public sealed class SettingsManager : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<SettingsManager>();
    private readonly Dictionary<string, object?> _settings = new();
    private readonly JsonSerializerOptions _jsonOptions;
    private readonly FileSystemWatcher? _watcher;
    private bool _disposed;

    public string SettingsPath { get; }

    public SettingsManager(string settingsPath)
    {
        SettingsPath = settingsPath;
        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            AllowTrailingCommas = true,
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip
        };

        Load();

        var dir = Path.GetDirectoryName(Path.GetFullPath(SettingsPath));
        if (!string.IsNullOrEmpty(dir) && Directory.Exists(dir))
        {
            _watcher = new FileSystemWatcher(dir, Path.GetFileName(SettingsPath))
            {
                NotifyFilter = NotifyFilters.LastWrite,
                EnableRaisingEvents = true
            };
            _watcher.Changed += (_, _) => { try { Load(); } catch { /* swallow */ } };
        }
    }

    public void Load()
    {
        if (!File.Exists(SettingsPath))
        {
            _logger.Warning("Settings not found, using defaults: {Path}", SettingsPath);
            SetDefaults();
            Save();
            return;
        }

        try
        {
            var json = File.ReadAllText(SettingsPath);
            var data = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json, _jsonOptions);
            if (data != null)
            {
                lock (_settings)
                {
                    _settings.Clear();
                    foreach (var kv in data)
                        _settings[kv.Key] = UnpackJsonElement(kv.Value);
                }
            }
            _logger.Information("Settings loaded: {Count} entries", _settings.Count);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to load settings, using defaults");
            SetDefaults();
        }
    }

    public void Save()
    {
        try
        {
            var dir = Path.GetDirectoryName(Path.GetFullPath(SettingsPath));
            if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);

            string json;
            lock (_settings)
            {
                json = JsonSerializer.Serialize(_settings, _jsonOptions);
            }
            File.WriteAllText(SettingsPath, json);
            _logger.Debug("Settings saved to: {Path}", SettingsPath);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save settings");
        }
    }

    private void SetDefaults()
    {
        lock (_settings)
        {
            _settings.Clear();
            _settings["theme"] = "dark";
            _settings["language"] = "en-US";
            _settings["check_updates"] = true;
            _settings["auto_save_workspace"] = true;
            _settings["max_recent_workspaces"] = 10;
            _settings["plugin_auto_enable"] = false;
            _settings["log_level"] = "Information";
        }
    }

    public T Get<T>(string key, T defaultValue = default!)
    {
        lock (_settings)
        {
            if (_settings.TryGetValue(key, out var value))
            {
                if (value is null) return defaultValue;
                try
                {
                    if (value is T typed) return typed;
                    return (T)Convert.ChangeType(value, typeof(T))!;
                }
                catch { return defaultValue; }
            }
            return defaultValue;
        }
    }

    public void Set<T>(string key, T value)
    {
        lock (_settings)
        {
            if (value is null)
                _settings.Remove(key);
            else
                _settings[key] = value;
        }
        Save();
    }

    public bool HasKey(string key)
    {
        lock (_settings) { return _settings.ContainsKey(key); }
    }

    public void Remove(string key)
    {
        lock (_settings) { _settings.Remove(key); }
        Save();
    }

    public Dictionary<string, object?> GetAll()
    {
        lock (_settings) { return new Dictionary<string, object?>(_settings); }
    }

    private static object? UnpackJsonElement(JsonElement el)
    {
        return el.ValueKind switch
        {
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Number => el.TryGetInt64(out var l) ? l : el.GetDouble(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Null => null,
            JsonValueKind.Array => el.EnumerateArray().Select(e => UnpackJsonElement(e)).ToList(),
            JsonValueKind.Object => el.EnumerateObject().ToDictionary(p => p.Name, p => UnpackJsonElement(p.Value)),
            _ => el.ToString()
        };
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _watcher?.Dispose();
    }
}
''',

    "src/Morget.Core/Workspace/WorkspaceData.cs": r'''using System;
using System.Collections.Generic;

namespace Morget.Core.Workspace;

public sealed class WorkspaceData
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Path { get; set; } = "";
    public DateTime LastOpened { get; set; } = DateTime.Now;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public Dictionary<string, object?> Metadata { get; set; } = new();
}
''',

    "src/Morget.Core/Workspace/WorkspaceManager.cs": r'''using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Serilog;

namespace Morget.Core.Workspace;

public sealed class WorkspaceManager : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<WorkspaceManager>();
    private readonly string _workspaceDir;
    private readonly List<WorkspaceData> _recentWorkspaces = new();
    private WorkspaceData? _currentWorkspace;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _disposed;

    public WorkspaceManager(string workspaceDir)
    {
        _workspaceDir = workspaceDir;
        Directory.CreateDirectory(_workspaceDir);
        _jsonOptions = new JsonSerializerOptions { WriteIndented = true };
        LoadRecent();
        _logger.Information("WorkspaceManager initialized, {Count} recent workspaces", _recentWorkspaces.Count);
    }

    public WorkspaceData? Current => _currentWorkspace;
    public IReadOnlyList<WorkspaceData> RecentWorkspaces
    {
        get { lock (_recentWorkspaces) { return _recentWorkspaces.ToList(); } }
    }

    public WorkspaceData CreateWorkspace(string name, string path)
    {
        var workspace = new WorkspaceData
        {
            Name = name,
            Path = path,
            CreatedAt = DateTime.Now,
            LastOpened = DateTime.Now
        };

        lock (_recentWorkspaces)
        {
            _recentWorkspaces.RemoveAll(w => w.Path == path);
            _recentWorkspaces.Insert(0, workspace);
            TrimRecent();
        }

        _currentWorkspace = workspace;
        SaveRecent();

        Directory.CreateDirectory(path);
        var morgetDir = System.IO.Path.Combine(path, ".morget");
        Directory.CreateDirectory(morgetDir);

        _logger.Information("Workspace created: {Name} at {Path}", name, path);
        return workspace;
    }

    public bool OpenWorkspace(string path)
    {
        if (!Directory.Exists(path))
        {
            _logger.Warning("Workspace path does not exist: {Path}", path);
            return false;
        }

        lock (_recentWorkspaces)
        {
            var existing = _recentWorkspaces.FirstOrDefault(w => w.Path == path);
            if (existing != null)
            {
                existing.LastOpened = DateTime.Now;
                _recentWorkspaces.Remove(existing);
                _recentWorkspaces.Insert(0, existing);
                _currentWorkspace = existing;
            }
            else
            {
                var name = System.IO.Path.GetFileName(path);
                var workspace = new WorkspaceData
                {
                    Name = name,
                    Path = path,
                    LastOpened = DateTime.Now
                };
                _recentWorkspaces.Insert(0, workspace);
                _currentWorkspace = workspace;
                TrimRecent();
            }
        }

        SaveRecent();
        _logger.Information("Workspace opened: {Path}", path);
        return true;
    }

    public void CloseWorkspace()
    {
        if (_currentWorkspace != null)
        {
            SaveCurrent();
            _logger.Information("Workspace closed: {Name}", _currentWorkspace.Name);
            _currentWorkspace = null;
        }
    }

    public void SaveCurrent()
    {
        if (_currentWorkspace == null) return;

        var statePath = System.IO.Path.Combine(_currentWorkspace.Path, ".morget", "state.json");
        try
        {
            var state = new WorkspaceState
            {
                Id = _currentWorkspace.Id,
                Name = _currentWorkspace.Name,
                LastSaved = DateTime.Now,
                Metadata = _currentWorkspace.Metadata
            };
            var json = JsonSerializer.Serialize(state, _jsonOptions);
            File.WriteAllText(statePath, json);
            _logger.Debug("Workspace saved: {Name}", _currentWorkspace.Name);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save workspace state");
        }
    }

    private void LoadRecent()
    {
        var recentPath = System.IO.Path.Combine(_workspaceDir, "recent.json");
        if (!File.Exists(recentPath)) return;

        try
        {
            var json = File.ReadAllText(recentPath);
            var data = JsonSerializer.Deserialize<List<WorkspaceData>>(json, _jsonOptions);
            if (data != null)
            {
                lock (_recentWorkspaces)
                {
                    _recentWorkspaces.Clear();
                    _recentWorkspaces.AddRange(data.Where(d => Directory.Exists(d.Path)));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to load recent workspaces");
        }
    }

    private void SaveRecent()
    {
        var recentPath = System.IO.Path.Combine(_workspaceDir, "recent.json");
        try
        {
            lock (_recentWorkspaces)
            {
                var json = JsonSerializer.Serialize(_recentWorkspaces, _jsonOptions);
                File.WriteAllText(recentPath, json);
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save recent workspaces");
        }
    }

    private void TrimRecent()
    {
        var max = Application.Instance?.Settings.Get("max_recent_workspaces", 10) ?? 10;
        if (_recentWorkspaces.Count > max)
            _recentWorkspaces.RemoveRange(max, _recentWorkspaces.Count - max);
    }

    public bool IsWorkspaceOpen(string path)
    {
        lock (_recentWorkspaces) { return _recentWorkspaces.Any(w => w.Path == path); }
    }

    public void RemoveFromRecent(string path)
    {
        lock (_recentWorkspaces) { _recentWorkspaces.RemoveAll(w => w.Path == path); }
        SaveRecent();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        SaveCurrent();
    }

    private sealed class WorkspaceState
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public DateTime LastSaved { get; set; }
        public Dictionary<string, object?> Metadata { get; set; } = new();
    }
}
''',

    "src/Morget.Core/Application.cs": r'''using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Morget.Core.Events;
using Morget.Core.Settings;
using Morget.Core.Workspace;
using Serilog;

namespace Morget.Core;

public sealed class Application : IDisposable
{
    private static Application? _instance;
    private readonly CancellationTokenSource _cts = new();
    private bool _disposed;

    public static Application Instance => _instance ?? throw new InvalidOperationException("Application not initialized");

    public ILogger Logger { get; }
    public SettingsManager Settings { get; }
    public WorkspaceManager Workspace { get; }
    public EventBus Events { get; }

    public Application(string? appDataDir = null)
    {
        if (_instance != null)
            throw new InvalidOperationException("Application already initialized");

        _instance = this;

        var baseDir = appDataDir ?? GetDefaultAppDataDir();
        Directory.CreateDirectory(baseDir);

        var logDir = Path.Combine(baseDir, "Logs");
        Directory.CreateDirectory(logDir);
        var logFile = Path.Combine(logDir, $"morget-{DateTime.Now:yyyy-MM-dd}.log");

        Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console()
            .WriteTo.File(logFile, rollingInterval: RollingInterval.Day)
            .CreateLogger();

        Logger.Information("=== Morget v2.0 Starting ===");
        Logger.Information("Log file: {LogFile}", logFile);

        Events = new EventBus();

        var settingsPath = Path.Combine(baseDir, "settings.json");
        Settings = new SettingsManager(settingsPath);
        Logger.Information("Settings loaded from: {SettingsPath}", Settings.SettingsPath);

        var workspaceDir = Path.Combine(baseDir, "Workspaces");
        Workspace = new WorkspaceManager(workspaceDir);
        Logger.Information("Workspace directory: {WorkspaceDir}", workspaceDir);

        Logger.Information("Application initialized successfully");
    }

    private static string GetDefaultAppDataDir()
    {
        var baseDir = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        return Path.Combine(baseDir, "Morget");
    }

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        Logger.Information("Application running...");
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _cts.Token);

        try
        {
            while (!linked.Token.IsCancellationRequested)
            {
                await Task.Delay(100, linked.Token);
            }
        }
        catch (OperationCanceledException)
        {
            Logger.Information("Application shutdown requested");
        }
    }

    public void Shutdown()
    {
        Logger.Information("Shutting down...");
        _cts.Cancel();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        Logger.Information("Application disposing...");
        Workspace?.Dispose();
        Settings?.Dispose();
        Events?.Dispose();
        _cts?.Dispose();
        Logger.Information("=== Morget Shutdown Complete ===");
        Log.CloseAndFlush();
        _instance = null;
    }
}
''',

    # -- Morget.Runtime --
    "src/Morget.Runtime/Morget.Runtime.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.Runtime</RootNamespace>
    <AssemblyName>Morget.Runtime</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Core\Morget.Core.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.Runtime/Sandbox.cs": r'''using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using MoonSharp.Interpreter;

namespace Morget.Runtime;

public static class Sandbox
{
    public static readonly HashSet<string> AllowedModules = new(StringComparer.OrdinalIgnoreCase)
    {
        "basic", "table", "string", "math", "coroutine",
        "os.date", "os.time", "os.difftime", "os.clock",
        "package.loaded", "package.searchers"
    };

    private static readonly HashSet<string> _allowedPaths = new(StringComparer.OrdinalIgnoreCase);

    public static void AllowPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;
        var normalized = Path.GetFullPath(path);
        lock (_allowedPaths) { _allowedPaths.Add(normalized); }
    }

    public static bool IsPathAllowed(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        try
        {
            var normalized = Path.GetFullPath(path);
            lock (_allowedPaths)
            {
                return _allowedPaths.Any(p => normalized.StartsWith(p, StringComparison.OrdinalIgnoreCase));
            }
        }
        catch { return false; }
    }

    public static bool IsModuleAllowed(string moduleName)
    {
        if (string.IsNullOrWhiteSpace(moduleName)) return false;
        return AllowedModules.Any(m =>
            moduleName.Equals(m, StringComparison.OrdinalIgnoreCase) ||
            moduleName.StartsWith(m + ".", StringComparison.OrdinalIgnoreCase));
    }

    public static void ConfigureScript(Script script)
    {
        ArgumentNullException.ThrowIfNull(script);

        script.Options.RecursionDepth = 100;
        script.Options.CheckThreadAccess = false;

        if (script.Globals.Get("os") is { Type: DataType.Table } osDyn)
        {
            var osTable = osDyn.Table;
            osTable.Set("execute", DynValue.Nil);
            osTable.Set("remove", DynValue.Nil);
            osTable.Set("rename", DynValue.Nil);
            osTable.Set("tmpname", DynValue.Nil);
            osTable.Set("exit", DynValue.Nil);
            osTable.Set("setlocale", DynValue.Nil);
            osTable.Set("getenv", DynValue.Nil);
        }

        script.Globals.Set("io", DynValue.Nil);
        script.Globals.Set("debug", DynValue.Nil);
        script.Globals.Set("load", DynValue.Nil);
        script.Globals.Set("loadfile", DynValue.Nil);
        script.Globals.Set("loadstring", DynValue.Nil);
        script.Globals.Set("dofile", DynValue.Nil);
        script.Globals.Set("collectgarbage", DynValue.Nil);
        script.Globals.Set("print", DynValue.Nil);
    }
}
''',

    "src/Morget.Runtime/LuaRuntime.cs": r'''using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using MoonSharp.Interpreter;
using Serilog;

namespace Morget.Runtime;

public sealed class LuaRuntime : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<LuaRuntime>();
    private readonly Script _script;
    private readonly Dictionary<string, object> _globals = new();
    private bool _disposed;

    public LuaRuntime()
    {
        _script = new Script(CoreModules.Basic | CoreModules.Table | CoreModules.String | CoreModules.Math | CoreModules.Coroutine);
        Sandbox.ConfigureScript(_script);
        RegisterMorgetAPI();
        _logger.Debug("LuaRuntime initialized");
    }

    private void RegisterMorgetAPI()
    {
        var morgetTable = new Table(_script);
        _script.Globals.Set("Morget", DynValue.NewTable(morgetTable));

        morgetTable.Set("log", DynValue.FromObject(_script, (Action<string, string?>)((level, msg) =>
        {
            var clean = msg ?? "";
            switch (level?.ToLowerInvariant())
            {
                case "error": _logger.Error(clean); break;
                case "warn": _logger.Warning(clean); break;
                case "debug": _logger.Debug(clean); break;
                case "fatal": _logger.Fatal(clean); break;
                default: _logger.Information(clean); break;
            }
        })));

        morgetTable.Set("sleep", DynValue.FromObject(_script, (Action<int>)(ms =>
        {
            if (ms > 0 && ms <= 30000)
                System.Threading.Thread.Sleep(ms);
        })));

        morgetTable.Set("getenv", DynValue.FromObject(_script, (Func<string, string?>)(key =>
            Environment.GetEnvironmentVariable(key))));

        morgetTable.Set("setenv", DynValue.FromObject(_script, (Action<string, string?>)((key, value) =>
        {
            if (!string.IsNullOrEmpty(key))
                Environment.SetEnvironmentVariable(key, value);
        })));

        morgetTable.Set("version", DynValue.NewString("2.0.0"));
        morgetTable.Set("platform", DynValue.NewString(GetPlatform()));
    }

    private static string GetPlatform()
    {
        if (OperatingSystem.IsWindows()) return "windows";
        if (OperatingSystem.IsMacOS()) return "macos";
        if (OperatingSystem.IsLinux()) return "linux";
        return "unknown";
    }

    public object? ExecuteString(string code, string? fileName = null)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        try
        {
            var result = _script.DoString(code, null, fileName ?? "main.lua");
            return result.ToObject<object>();
        }
        catch (InterpreterException ex)
        {
            _logger.Error(ex, "Lua execution error in {File}: {Message}", fileName, ex.Message);
            throw;
        }
    }

    public object? ExecuteFile(string filePath)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"Lua file not found: {filePath}");

        var code = File.ReadAllText(filePath);
        return ExecuteString(code, Path.GetFileName(filePath));
    }

    public void RegisterGlobal(string name, object value)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _script.Globals.Set(name, DynValue.FromObject(_script, value));
        lock (_globals) { _globals[name] = value; }
        _logger.Debug("Registered global: {Name}", name);
    }

    public void RegisterFunction(string name, Delegate function)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _script.Globals.Set(name, DynValue.FromObject(_script, function));
        _logger.Debug("Registered function: {Name}", name);
    }

    public object? CallFunction(string functionName, params object[] args)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        try
        {
            var dynArgs = Array.ConvertAll(args, a => DynValue.FromObject(_script, a));
            var result = _script.Call(_script.Globals.Get(functionName), dynArgs);
            return result.ToObject<object>();
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to call Lua function: {Function}", functionName);
            throw;
        }
    }

    public Script GetInternalScript() => _script;

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        lock (_globals) { _globals.Clear(); }
        _logger.Debug("LuaRuntime disposed");
    }
}
''',

    # -- Morget.PluginAPI --
    "src/Morget.PluginAPI/Morget.PluginAPI.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.PluginAPI</RootNamespace>
    <AssemblyName>Morget.PluginAPI</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Core\Morget.Core.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.PluginAPI/IPlugin.cs": r'''namespace Morget.PluginAPI;

public interface IPlugin
{
    string Id { get; }
    string Name { get; }
    string Version { get; }
    string Author { get; }
    void Initialize(IPluginContext context);
    void Shutdown();
}
''',

    "src/Morget.PluginAPI/IPermission.cs": r'''namespace Morget.PluginAPI;

public interface IPermission
{
    string Key { get; }
    string Description { get; }
    bool IsDangerous { get; }
}

public static class KnownPermissions
{
    public const string WorkspaceRead = "workspace_read";
    public const string WorkspaceWrite = "workspace_write";
    public const string StorageRead = "storage_read";
    public const string StorageWrite = "storage_write";
    public const string Notification = "notification";
    public const string Http = "http";
    public const string Clipboard = "clipboard";
    public const string Theme = "theme";
    public const string Process = "process";
}
''',

    "src/Morget.PluginAPI/Advanced/IPluginHost.cs": r'''using System.Threading.Tasks;

namespace Morget.PluginAPI.Advanced;

public interface IPluginHost
{
    string PluginId { get; }
    T? GetService<T>() where T : class;
    void PublishEvent<T>(T eventData) where T : class;
    Task<bool> RequestPermissionAsync(string permission);
}
''',

    "src/Morget.PluginAPI/Advanced/PluginContext.cs": r'''using System.Collections.Generic;

namespace Morget.PluginAPI.Advanced;

public sealed class PluginContext : IPluginContext
{
    public string PluginId { get; }
    public string PluginPath { get; }
    public IReadOnlyDictionary<string, object> Metadata { get; }
    public IPluginHost Host { get; }

    public PluginContext(string id, string path, IReadOnlyDictionary<string, object> metadata, IPluginHost host)
    {
        PluginId = id;
        PluginPath = path;
        Metadata = metadata;
        Host = host;
    }
}

public interface IPluginContext
{
    string PluginId { get; }
    string PluginPath { get; }
    IReadOnlyDictionary<string, object> Metadata { get; }
    IPluginHost Host { get; }
}
''',

    # -- Morget.PluginHost --
    "src/Morget.PluginHost/Morget.PluginHost.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.PluginHost</RootNamespace>
    <AssemblyName>Morget.PluginHost</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Core\Morget.Core.csproj" />
    <ProjectReference Include="..\Morget.Runtime\Morget.Runtime.csproj" />
    <ProjectReference Include="..\Morget.PluginAPI\Morget.PluginAPI.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.PluginHost/PluginManifest.cs": r'''using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Morget.PluginHost;

public sealed class PluginManifest
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("version")]
    public string Version { get; set; } = "0.0.0";

    [JsonPropertyName("author")]
    public string Author { get; set; } = "";

    [JsonPropertyName("entry")]
    public string Entry { get; set; } = "main.lua";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("license")]
    public string License { get; set; } = "";

    [JsonPropertyName("category")]
    public string Category { get; set; } = "Uncategorized";

    [JsonPropertyName("repository")]
    public string Repository { get; set; } = "";

    [JsonPropertyName("permissions")]
    public List<string> Permissions { get; set; } = new();

    [JsonPropertyName("is_official")]
    public bool IsOfficial { get; set; }

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "";

    [JsonPropertyName("min_api_version")]
    public string MinApiVersion { get; set; } = "2.0.0";

    [JsonPropertyName("dependencies")]
    public List<string> Dependencies { get; set; } = new();
}
''',

    "src/Morget.PluginHost/PluginEvents.cs": r'''using Morget.Core.Events;

namespace Morget.PluginHost;

public sealed record PluginInstalledEvent(string Id, string Name) : IEvent;
public sealed record PluginUninstalledEvent(string Id, string Name) : IEvent;
public sealed record PluginLoadedEvent(string Id, string Name) : IEvent;
public sealed record PluginUnloadedEvent(string Id, string Name) : IEvent;
public sealed record PluginEnabledEvent(string Id, string Name) : IEvent;
public sealed record PluginDisabledEvent(string Id, string Name) : IEvent;
public sealed record PluginErrorEvent(string Id, string Name, string Error) : IEvent;
public sealed record PluginUpdateAvailableEvent(string Id, string Name, string NewVersion) : IEvent;
''',

    "src/Morget.PluginHost/MGPNHost.cs": r'''using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Morget.Core;
using Morget.Core.Events;
using Morget.Runtime;
using Serilog;

namespace Morget.PluginHost;

public sealed class MGPNHost : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<MGPNHost>();
    private readonly LuaRuntime _lua;
    private PluginManifest? _manifest;
    private bool _loaded;
    private bool _enabled;
    private bool _disposed;

    public string PluginId => _manifest?.Id ?? "";
    public string Name => _manifest?.Name ?? "Unknown";
    public string Version => _manifest?.Version ?? "0.0.0";
    public bool IsLoaded => _loaded;
    public bool IsEnabled => _enabled;
    public PluginManifest? Manifest => _manifest;

    public MGPNHost()
    {
        _lua = new LuaRuntime();
        _lua.RegisterGlobal("plugin", this);
    }

    public async Task<bool> LoadAsync(string pluginPath)
    {
        if (_loaded) return true;
        if (_disposed) throw new ObjectDisposedException(nameof(MGPNHost));

        try
        {
            var manifestPath = Path.Combine(pluginPath, "plugin.json");
            if (!File.Exists(manifestPath))
            {
                _logger.Error("plugin.json not found in {Path}", pluginPath);
                return false;
            }

            var json = await File.ReadAllTextAsync(manifestPath);
            _manifest = JsonSerializer.Deserialize<PluginManifest>(json);

            if (_manifest == null || string.IsNullOrWhiteSpace(_manifest.Id))
            {
                _logger.Error("Failed to parse plugin.json in {Path}", pluginPath);
                return false;
            }

            if (!ValidatePermissions())
            {
                _logger.Warning("Plugin {Name} denied: insufficient permissions", _manifest.Name);
                return false;
            }

            Sandbox.AllowPath(pluginPath);
            var pluginDataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Morget", "PluginData", _manifest.Id);
            Directory.CreateDirectory(pluginDataDir);
            Sandbox.AllowPath(pluginDataDir);

            _lua.RegisterGlobal("PLUGIN_ID", _manifest.Id);
            _lua.RegisterGlobal("PLUGIN_NAME", _manifest.Name);
            _lua.RegisterGlobal("PLUGIN_VERSION", _manifest.Version);
            _lua.RegisterGlobal("PLUGIN_PATH", pluginPath);
            _lua.RegisterGlobal("PLUGIN_DATA_PATH", pluginDataDir);
            _lua.RegisterGlobal("PLUGIN_PERMISSIONS", _manifest.Permissions);

            var entryPath = Path.Combine(pluginPath, _manifest.Entry ?? "main.lua");
            if (!File.Exists(entryPath))
            {
                _logger.Error("Entry file not found: {Entry}", entryPath);
                return false;
            }

            _lua.ExecuteFile(entryPath);
            _lua.ExecuteString("if type(onLoad) == 'function' then onLoad() end", "onLoad_trigger");
            _loaded = true;

            _logger.Information("Loaded MGPN plugin: {Name} v{Version}", _manifest.Name, _manifest.Version);
            Application.Instance.Events.Publish(new PluginLoadedEvent(_manifest.Id, _manifest.Name));
            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to load plugin {Name}", _manifest?.Name ?? "unknown");
            return false;
        }
    }

    public async Task<bool> EnableAsync()
    {
        if (!_loaded || _enabled || _disposed) return false;

        try
        {
            _lua.ExecuteString("if type(onEnable) == 'function' then onEnable() end", "onEnable_trigger");
            _enabled = true;
            _logger.Information("Plugin enabled: {Name}", _manifest?.Name);
            if (_manifest != null)
                Application.Instance.Events.Publish(new PluginEnabledEvent(_manifest.Id, _manifest.Name));
            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to enable plugin {Name}", _manifest?.Name);
            return false;
        }
    }

    public async Task<bool> DisableAsync()
    {
        if (!_loaded || !_enabled || _disposed) return false;

        try
        {
            _lua.ExecuteString("if type(onDisable) == 'function' then onDisable() end", "onDisable_trigger");
            _enabled = false;
            _logger.Information("Plugin disabled: {Name}", _manifest?.Name);
            if (_manifest != null)
                Application.Instance.Events.Publish(new PluginDisabledEvent(_manifest.Id, _manifest.Name));
            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to disable plugin {Name}", _manifest?.Name);
            return false;
        }
    }

    public async Task<bool> UnloadAsync()
    {
        if (!_loaded || _disposed) return false;

        try
        {
            if (_enabled)
                await DisableAsync();

            _lua.ExecuteString("if type(onUnload) == 'function' then onUnload() end", "onUnload_trigger");
            _loaded = false;
            _logger.Information("Plugin unloaded: {Name}", _manifest?.Name);
            if (_manifest != null)
                Application.Instance.Events.Publish(new PluginUnloadedEvent(_manifest.Id, _manifest.Name));
            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to unload plugin {Name}", _manifest?.Name);
            return false;
        }
    }

    public object? CallFunction(string functionName, params object[] args)
    {
        if (!_loaded) throw new InvalidOperationException("Plugin not loaded");
        return _lua.CallFunction(functionName, args);
    }

    public string? GetPluginPath() => _manifest != null
        ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Morget", "Plugins", _manifest.Id)
        : null;

    private bool ValidatePermissions()
    {
        if (_manifest == null) return false;
        if (_manifest.Permissions == null) return true;

        var allowed = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "workspace_read", "workspace_write", "storage_read", "storage_write",
            "notification", "http", "clipboard", "theme"
        };

        foreach (var perm in _manifest.Permissions)
        {
            if (!allowed.Contains(perm))
            {
                _logger.Warning("Blocked permission: {Permission}", perm);
                return false;
            }
        }
        return true;
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        if (_loaded)
        {
            try { _lua.ExecuteString("if type(onUnload) == 'function' then onUnload() end", "dispose_trigger"); }
            catch { /* ignore */ }
        }
        _lua.Dispose();
    }
}
''',

    "src/Morget.PluginHost/MGPHost.cs": r'''using System;
using System.Threading.Tasks;
using Morget.PluginAPI;
using Morget.PluginAPI.Advanced;

namespace Morget.PluginHost;

public sealed class MGPHost : IPluginHost, IDisposable
{
    private readonly IPlugin _plugin;
    private bool _disposed;

    public string PluginId => _plugin.Id;

    public MGPHost(IPlugin plugin)
    {
        _plugin = plugin ?? throw new ArgumentNullException(nameof(plugin));
    }

    public void Initialize(PluginContext context)
    {
        _plugin.Initialize(context);
    }

    public T? GetService<T>() where T : class => null;

    public void PublishEvent<T>(T eventData) where T : class
    {
    }

    public Task<bool> RequestPermissionAsync(string permission) => Task.FromResult(true);

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _plugin.Shutdown();
    }
}
''',

    "src/Morget.PluginHost/PluginLoader.cs": r'''using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Morget.PluginAPI;

namespace Morget.PluginHost;

public static class PluginLoader
{
    public static async Task<IPlugin?> LoadNativeAsync(string assemblyPath)
    {
        if (!File.Exists(assemblyPath)) return null;

        await Task.Yield();

        try
        {
            var asm = Assembly.LoadFrom(Path.GetFullPath(assemblyPath));
            foreach (var type in asm.GetTypes())
            {
                if (typeof(IPlugin).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                {
                    return (IPlugin?)Activator.CreateInstance(type);
                }
            }
        }
        catch (ReflectionTypeLoadException) { }
        return null;
    }
}
''',

    "src/Morget.PluginHost/PluginManager.cs": r'''using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Threading.Tasks;
using Morget.Core;
using Morget.Core.Events;
using Serilog;

namespace Morget.PluginHost;

public enum PluginStatus
{
    NotInstalled,
    Installed,
    Loading,
    Loaded,
    Enabled,
    Disabled,
    Error
}

public sealed class PluginInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Author { get; set; } = "";
    public string Description { get; set; } = "";
    public string License { get; set; } = "";
    public string Category { get; set; } = "";
    public List<string> Permissions { get; set; } = new();
    public bool IsOfficial { get; set; }
    public string InstallPath { get; set; } = "";
    public PluginStatus Status { get; set; } = PluginStatus.NotInstalled;
    public DateTime InstalledAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? Repository { get; set; }
    public bool IsEnabled => Status == PluginStatus.Enabled;
}

public sealed class PluginManager : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<PluginManager>();
    private readonly string _pluginsDir;
    private readonly string _pluginDataDir;
    private readonly Dictionary<string, PluginInfo> _plugins = new();
    private readonly Dictionary<string, MGPNHost> _hosts = new();
    private readonly Lock _lock = new();
    private bool _disposed;

    public IReadOnlyDictionary<string, PluginInfo> Plugins
    {
        get { lock (_lock) { return _plugins.ToDictionary(kv => kv.Key, kv => kv.Value); } }
    }

    public event EventHandler<PluginEventArgs>? PluginChanged;

    public PluginManager()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        _pluginsDir = Path.Combine(appData, "Morget", "Plugins");
        _pluginDataDir = Path.Combine(appData, "Morget", "PluginData");
        Directory.CreateDirectory(_pluginsDir);
        Directory.CreateDirectory(_pluginDataDir);

        LoadInstalledPlugins();
        _logger.Information("PluginManager initialized: {Count} plugins", _plugins.Count);
    }

    public void Initialize()
    {
        lock (_lock)
        {
            foreach (var plugin in _plugins.Values.Where(p => p.Status == PluginStatus.Disabled))
            {
                _ = EnablePluginAsync(plugin.Id);
            }
        }
    }

    private void LoadInstalledPlugins()
    {
        if (!Directory.Exists(_pluginsDir)) return;

        foreach (var pluginDir in Directory.GetDirectories(_pluginsDir))
        {
            var manifestPath = Path.Combine(pluginDir, "plugin.json");
            if (!File.Exists(manifestPath)) continue;

            try
            {
                var json = File.ReadAllText(manifestPath);
                var manifest = System.Text.Json.JsonSerializer.Deserialize<PluginManifest>(json);
                if (manifest == null || string.IsNullOrWhiteSpace(manifest.Id)) continue;

                var statePath = Path.Combine(_pluginDataDir, manifest.Id, "state.json");
                var isEnabled = false;
                if (File.Exists(statePath))
                {
                    var stateJson = File.ReadAllText(statePath);
                    var state = System.Text.Json.JsonSerializer.Deserialize<PluginState>(stateJson);
                    isEnabled = state?.IsEnabled ?? false;
                }

                var info = new PluginInfo
                {
                    Id = manifest.Id,
                    Name = manifest.Name,
                    Version = manifest.Version,
                    Author = manifest.Author,
                    Description = manifest.Description,
                    License = manifest.License,
                    Category = manifest.Category,
                    Permissions = manifest.Permissions ?? new List<string>(),
                    IsOfficial = manifest.IsOfficial,
                    InstallPath = pluginDir,
                    Repository = manifest.Repository,
                    InstalledAt = Directory.GetCreationTime(pluginDir),
                    UpdatedAt = Directory.GetLastWriteTime(pluginDir)
                };

                info.Status = isEnabled ? PluginStatus.Disabled : PluginStatus.Installed;

                lock (_lock) { _plugins[manifest.Id] = info; }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Failed to load plugin from {Dir}", pluginDir);
            }
        }
    }

    public async Task<bool> InstallPluginAsync(string packagePath)
    {
        if (!File.Exists(packagePath))
        {
            _logger.Error("Package not found: {Path}", packagePath);
            return false;
        }

        try
        {
            using var archive = ZipFile.OpenRead(packagePath);
            var manifestEntry = archive.Entries.FirstOrDefault(e => e.Name == "plugin.json");
            if (manifestEntry == null)
            {
                _logger.Error("plugin.json not found in package");
                return false;
            }

            using var ms = new MemoryStream();
            await manifestEntry.Open().CopyToAsync(ms);
            var json = System.Text.Encoding.UTF8.GetString(ms.ToArray());
            var manifest = System.Text.Json.JsonSerializer.Deserialize<PluginManifest>(json);
            if (manifest == null || string.IsNullOrWhiteSpace(manifest.Id))
            {
                _logger.Error("Failed to parse plugin.json");
                return false;
            }

            var installPath = Path.Combine(_pluginsDir, manifest.Id);
            if (Directory.Exists(installPath))
            {
                await UninstallPluginAsync(manifest.Id);
            }

            Directory.CreateDirectory(installPath);

            if (!ExtractZipSafely(archive, installPath))
            {
                Directory.Delete(installPath, true);
                return false;
            }

            if (!File.Exists(Path.Combine(installPath, "plugin.json")))
            {
                _logger.Error("Corrupted package: plugin.json missing after extraction");
                Directory.Delete(installPath, true);
                return false;
            }

            var info = new PluginInfo
            {
                Id = manifest.Id,
                Name = manifest.Name,
                Version = manifest.Version,
                Author = manifest.Author,
                Description = manifest.Description,
                License = manifest.License,
                Category = manifest.Category,
                Permissions = manifest.Permissions ?? new List<string>(),
                IsOfficial = manifest.IsOfficial,
                InstallPath = installPath,
                Repository = manifest.Repository,
                Status = PluginStatus.Installed,
                InstalledAt = DateTime.Now
            };

            lock (_lock) { _plugins[manifest.Id] = info; }
            SavePluginState(info);

            _logger.Information("Plugin installed: {Name} v{Version}", manifest.Name, manifest.Version);
            Application.Instance.Events.Publish(new PluginInstalledEvent(manifest.Id, manifest.Name));
            PluginChanged?.Invoke(this, new PluginEventArgs(manifest.Id, "installed"));

            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to install plugin");
            return false;
        }
    }

    public async Task<bool> UninstallPluginAsync(string pluginId)
    {
        PluginInfo? info;
        lock (_lock)
        {
            if (!_plugins.TryGetValue(pluginId, out info))
                return false;
        }

        try
        {
            if (info.IsEnabled)
                await DisablePluginAsync(pluginId);

            if (_hosts.TryGetValue(pluginId, out var host))
            {
                host.Dispose();
                _hosts.Remove(pluginId);
            }

            if (Directory.Exists(info.InstallPath))
                Directory.Delete(info.InstallPath, true);

            var dataPath = Path.Combine(_pluginDataDir, pluginId);
            if (Directory.Exists(dataPath))
                Directory.Delete(dataPath, true);

            lock (_lock) { _plugins.Remove(pluginId); }

            _logger.Information("Plugin uninstalled: {Name}", info.Name);
            Application.Instance.Events.Publish(new PluginUninstalledEvent(pluginId, info.Name));
            PluginChanged?.Invoke(this, new PluginEventArgs(pluginId, "uninstalled"));

            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to uninstall plugin {Id}", pluginId);
            return false;
        }
    }

    public async Task<bool> EnablePluginAsync(string pluginId)
    {
        PluginInfo? info;
        lock (_lock)
        {
            if (!_plugins.TryGetValue(pluginId, out info))
                return false;
        }

        if (info.IsEnabled) return true;

        try
        {
            info.Status = PluginStatus.Loading;
            var host = new MGPNHost();
            if (!await host.LoadAsync(info.InstallPath))
            {
                host.Dispose();
                info.Status = PluginStatus.Error;
                return false;
            }

            if (!await host.EnableAsync())
            {
                host.Dispose();
                info.Status = PluginStatus.Error;
                return false;
            }

            _hosts[pluginId] = host;
            info.Status = PluginStatus.Enabled;
            SavePluginState(info);

            _logger.Information("Plugin enabled: {Name}", info.Name);
            Application.Instance.Events.Publish(new PluginEnabledEvent(pluginId, info.Name));
            PluginChanged?.Invoke(this, new PluginEventArgs(pluginId, "enabled"));

            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to enable plugin {Id}", pluginId);
            info.Status = PluginStatus.Error;
            return false;
        }
    }

    public async Task<bool> DisablePluginAsync(string pluginId)
    {
        PluginInfo? info;
        lock (_lock)
        {
            if (!_plugins.TryGetValue(pluginId, out info))
                return false;
        }

        if (!info.IsEnabled) return true;

        try
        {
            if (_hosts.TryGetValue(pluginId, out var host))
            {
                await host.DisableAsync();
                host.Dispose();
                _hosts.Remove(pluginId);
            }

            info.Status = PluginStatus.Disabled;
            SavePluginState(info);

            _logger.Information("Plugin disabled: {Name}", info.Name);
            Application.Instance.Events.Publish(new PluginDisabledEvent(pluginId, info.Name));
            PluginChanged?.Invoke(this, new PluginEventArgs(pluginId, "disabled"));

            return true;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to disable plugin {Id}", pluginId);
            return false;
        }
    }

    public MGPNHost? GetPluginHost(string pluginId)
    {
        _hosts.TryGetValue(pluginId, out var host);
        return host;
    }

    public PluginInfo? GetPlugin(string pluginId)
    {
        lock (_lock) { return _plugins.TryGetValue(pluginId, out var info) ? info : null; }
    }

    public List<PluginInfo> GetPluginsByCategory(string category)
    {
        lock (_lock) { return _plugins.Values.Where(p => p.Category == category).ToList(); }
    }

    private static bool ExtractZipSafely(ZipArchive archive, string extractPath)
    {
        var fullExtractPath = Path.GetFullPath(extractPath);
        if (!fullExtractPath.EndsWith(Path.DirectorySeparatorChar))
            fullExtractPath += Path.DirectorySeparatorChar;

        foreach (var entry in archive.Entries)
        {
            if (string.IsNullOrEmpty(entry.Name)) continue;

            var destPath = Path.GetFullPath(Path.Combine(extractPath, entry.FullName));

            if (!destPath.StartsWith(fullExtractPath, StringComparison.OrdinalIgnoreCase))
                return false;

            var destDir = Path.GetDirectoryName(destPath);
            if (!string.IsNullOrEmpty(destDir))
                Directory.CreateDirectory(destDir);

            entry.ExtractToFile(destPath, true);
        }
        return true;
    }

    private void SavePluginState(PluginInfo info)
    {
        var statePath = Path.Combine(_pluginDataDir, info.Id, "state.json");
        Directory.CreateDirectory(Path.GetDirectoryName(statePath)!);

        var state = new PluginState
        {
            IsEnabled = info.IsEnabled,
            UpdatedAt = DateTime.Now
        };

        var json = System.Text.Json.JsonSerializer.Serialize(state);
        File.WriteAllText(statePath, json);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        foreach (var host in _hosts.Values)
            host.Dispose();
        _hosts.Clear();
        _plugins.Clear();
    }

    private sealed class PluginState
    {
        public bool IsEnabled { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

public sealed class PluginEventArgs : EventArgs
{
    public string PluginId { get; }
    public string Action { get; }
    public PluginEventArgs(string id, string action)
    {
        PluginId = id;
        Action = action;
    }
}
''',

    # -- Morget.Store --
    "src/Morget.Store/Morget.Store.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.Store</RootNamespace>
    <AssemblyName>Morget.Store</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.PluginHost\Morget.PluginHost.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.Store/GitHubStore.cs": r'''using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Morget.PluginHost;
using Serilog;

namespace Morget.Store;

public sealed class GitHubPluginInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Author { get; set; } = "";
    public string Description { get; set; } = "";
    public string License { get; set; } = "";
    public string Category { get; set; } = "";
    public string Repository { get; set; } = "";
    public List<string> Permissions { get; set; } = new();
    public string DownloadUrl { get; set; } = "";
    public bool IsOfficial { get; set; }
    public int Stars { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class GitHubStore : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<GitHubStore>();
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, CacheEntry> _cache = new();
    private bool _disposed;

    private sealed class CacheEntry
    {
        public GitHubPluginInfo Data { get; set; } = new();
        public DateTime ExpiresAt { get; set; }
    }

    public GitHubStore(string? githubToken = null)
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Morget/2.0");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        if (!string.IsNullOrEmpty(githubToken))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {githubToken}");
        }
    }

    public async Task<List<GitHubPluginInfo>> SearchPluginsAsync(string query = "", string category = "")
    {
        var plugins = new List<GitHubPluginInfo>();
        try
        {
            var searchQuery = "topic:morget-plugin";
            if (!string.IsNullOrWhiteSpace(query)) searchQuery += $"+{Uri.EscapeDataString(query)}";
            if (!string.IsNullOrWhiteSpace(category)) searchQuery += $"+topic:{Uri.EscapeDataString(category.ToLowerInvariant())}";

            var url = $"https://api.github.com/search/repositories?q={searchQuery}&sort=updated&order=desc&per_page=50";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.Warning("GitHub API returned {StatusCode}", response.StatusCode);
                return plugins;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("items", out var items)) return plugins;

            foreach (var item in items.EnumerateArray())
            {
                try
                {
                    var fullName = item.GetProperty("full_name").GetString() ?? "";
                    var name = item.GetProperty("name").GetString() ?? "";
                    var description = item.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "";
                    var stars = item.GetProperty("stargazers_count").GetInt32();
                    var updatedAt = item.GetProperty("updated_at").GetDateTime();

                    plugins.Add(new GitHubPluginInfo
                    {
                        Id = fullName.Replace("/", "-").ToLowerInvariant(),
                        Name = name,
                        Version = "unknown",
                        Author = fullName.Split('/')[0],
                        Description = description,
                        Repository = $"https://github.com/{fullName}",
                        Stars = stars,
                        UpdatedAt = updatedAt
                    });
                }
                catch { }
            }
            _logger.Information("Found {Count} plugins from GitHub (Lazy Loaded)", plugins.Count);
        }
        catch (Exception ex) { _logger.Error(ex, "Failed to search plugins"); }
        return plugins;
    }

    public async Task<GitHubPluginInfo?> GetPluginDetailsAsync(string repoUrl)
    {
        try
        {
            var uri = new Uri(repoUrl);
            var parts = uri.AbsolutePath.Trim('/').Split('/');
            if (parts.Length < 2) return null;
            var fullName = $"{parts[0]}/{parts[1]}";

            var pluginJsonTask = FetchPluginJsonAsync(fullName);
            var releaseTask = FetchLatestReleaseAsync(fullName);
            await Task.WhenAll(pluginJsonTask, releaseTask);

            var manifest = await pluginJsonTask;
            var release = await releaseTask;
            if (manifest == null) return null;

            return new GitHubPluginInfo
            {
                Id = manifest.Id,
                Name = manifest.Name,
                Version = release?.Version ?? manifest.Version,
                Author = manifest.Author,
                Description = manifest.Description,
                License = manifest.License,
                Category = manifest.Category,
                Repository = repoUrl,
                Permissions = manifest.Permissions,
                DownloadUrl = release?.DownloadUrl ?? "",
                IsOfficial = manifest.IsOfficial
            };
        }
        catch (Exception ex) { _logger.Error(ex, "Failed to fetch details for {Url}", repoUrl); return null; }
    }

    private async Task<PluginManifest?> FetchPluginJsonAsync(string fullName)
    {
        try {
            var json = await _httpClient.GetStringAsync($"https://raw.githubusercontent.com/{fullName}/main/plugin.json");
            return JsonSerializer.Deserialize<PluginManifest>(json);
        } catch { return null; }
    }

    private async Task<ReleaseInfo?> FetchLatestReleaseAsync(string fullName)
    {
        try {
            var response = await _httpClient.GetAsync($"https://api.github.com/repos/{fullName}/releases/latest");
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            string? downloadUrl = null;
            if (doc.RootElement.TryGetProperty("assets", out var assets)) {
                foreach (var asset in assets.EnumerateArray()) {
                    var assetName = asset.GetProperty("name").GetString();
                    if (assetName != null && assetName.EndsWith(".mgpn", StringComparison.OrdinalIgnoreCase)) {
                        downloadUrl = asset.GetProperty("browser_download_url").GetString();
                        break;
                    }
                }
            }
            return new ReleaseInfo { 
                Version = doc.RootElement.GetProperty("tag_name").GetString() ?? "", 
                DownloadUrl = downloadUrl ?? "" 
            };
        } catch { return null; }
    }

    private sealed class ReleaseInfo { public string Version { get; set; } = ""; public string DownloadUrl { get; set; } = ""; }

    public async Task<string?> DownloadPluginAsync(GitHubPluginInfo plugin)
    {
        if (string.IsNullOrEmpty(plugin.DownloadUrl))
            return null;

        try
        {
            var response = await _httpClient.GetAsync(plugin.DownloadUrl);
            if (!response.IsSuccessStatusCode)
            {
                _logger.Error("Failed to download plugin: {StatusCode}", response.StatusCode);
                return null;
            }

            var bytes = await response.Content.ReadAsByteArrayAsync();
            var tempPath = Path.GetTempFileName() + ".mgpn";
            await File.WriteAllBytesAsync(tempPath, bytes);

            _logger.Information("Downloaded {Name} ({Size} KB)", plugin.Name, bytes.Length / 1024);
            return tempPath;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to download plugin {Name}", plugin.Name);
            return null;
        }
    }

    public async Task<string?> CheckForUpdateAsync(string pluginId, string currentVersion)
    {
        var cacheKey = $"update_{pluginId}";
        if (_cache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
        {
            return IsNewerVersion(cached.Data.Version, currentVersion) ? cached.Data.Version : null;
        }

        var plugins = await SearchPluginsAsync($"plugin:{pluginId}");
        var plugin = plugins.Find(p => p.Id.Equals(pluginId, StringComparison.OrdinalIgnoreCase));

        if (plugin != null && IsNewerVersion(plugin.Version, currentVersion))
        {
            _cache[cacheKey] = new CacheEntry
            {
                Data = plugin,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };
            return plugin.Version;
        }

        return null;
    }

    private static bool IsNewerVersion(string latest, string current)
    {
        try
        {
            var latestParts = latest.TrimStart('v', 'V').Split('.');
            var currentParts = current.TrimStart('v', 'V').Split('.');

            for (int i = 0; i < Math.Max(latestParts.Length, currentParts.Length); i++)
            {
                var l = i < latestParts.Length && int.TryParse(latestParts[i], out var lv) ? lv : 0;
                var c = i < currentParts.Length && int.TryParse(currentParts[i], out var cv) ? cv : 0;
                if (l != c) return l > c;
            }
            return false;
        }
        catch { return false; }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _httpClient.Dispose();
        _cache.Clear();
    }
}
''',

    # -- Morget.Flow --
    "src/Morget.Flow/Morget.Flow.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.Flow</RootNamespace>
    <AssemblyName>Morget.Flow</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Core\Morget.Core.csproj" />
    <ProjectReference Include="..\Morget.PluginAPI\Morget.PluginAPI.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.Flow/Nodes/NodeBase.cs": r'''using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Morget.Flow.Nodes;

public abstract class NodeBase
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Category { get; set; } = "General";
    public double X { get; set; }
    public double Y { get; set; }

    [JsonIgnore]
    public Dictionary<string, Port> Inputs { get; } = new();

    [JsonIgnore]
    public Dictionary<string, Port> Outputs { get; } = new();

    [JsonIgnore]
    public Dictionary<string, object?> Properties { get; set; } = new();

    public abstract Task ExecuteAsync(FlowContext context);

    protected Port DefineInput(string key, string type, object? defaultValue = null)
    {
        var port = new Port(key, type, defaultValue);
        Inputs[key] = port;
        return port;
    }

    protected Port DefineOutput(string key, string type)
    {
        var port = new Port(key, type, null);
        Outputs[key] = port;
        return port;
    }
}

public sealed class Port
{
    public string Key { get; }
    public string Type { get; }
    public object? Value { get; set; }
    public string? ConnectedNodeId { get; set; }
    public string? ConnectedPortKey { get; set; }

    public Port(string key, string type, object? value)
    {
        Key = key;
        Type = type;
        Value = value;
    }
}

public sealed class FlowContext
{
    public Dictionary<string, object?> Variables { get; } = new();
    public ILoggerProxy Logger { get; }
    public CancellationToken CancellationToken { get; }

    public FlowContext(ILoggerProxy logger, CancellationToken ct)
    {
        Logger = logger;
        CancellationToken = ct;
    }
}

public interface ILoggerProxy
{
    void Info(string message);
    void Error(string message);
}
''',

    "src/Morget.Flow/Nodes/StartNode.cs": r'''namespace Morget.Flow.Nodes;

public sealed class StartNode : NodeBase
{
    public StartNode()
    {
        Name = "Start";
        DefineOutput("flow", "flow");
        DefineOutput("timestamp", "number");
    }

    public override Task ExecuteAsync(FlowContext context)
    {
        Outputs["timestamp"].Value = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        return Task.CompletedTask;
    }
}
''',

    "src/Morget.Flow/Nodes/EndNode.cs": r'''namespace Morget.Flow.Nodes;

public sealed class EndNode : NodeBase
{
    public EndNode()
    {
        Name = "End";
        DefineInput("flow", "flow");
        DefineInput("result", "any");
    }

    public override Task ExecuteAsync(FlowContext context)
    {
        context.Logger.Info("Flow ended with result: " + Inputs["result"].Value);
        return Task.CompletedTask;
    }
}
''',

    "src/Morget.Flow/Nodes/LogNode.cs": r'''namespace Morget.Flow.Nodes;

public sealed class LogNode : NodeBase
{
    public LogNode()
    {
        Name = "Log";
        DefineInput("flow", "flow");
        DefineInput("message", "string", "Hello Flow");
        DefineOutput("flow", "flow");
    }

    public override Task ExecuteAsync(FlowContext context)
    {
        var msg = Inputs["message"].Value?.ToString() ?? "";
        context.Logger.Info(msg);
        return Task.CompletedTask;
    }
}
''',

    "src/Morget.Flow/Nodes/HttpNode.cs": r'''using System.Net.Http;

namespace Morget.Flow.Nodes;

public sealed class HttpNode : NodeBase
{
    private static readonly HttpClient _client = new();

    public HttpNode()
    {
        Name = "HTTP Request";
        DefineInput("flow", "flow");
        DefineInput("url", "string", "https://api.github.com");
        DefineInput("method", "string", "GET");
        DefineOutput("flow", "flow");
        DefineOutput("status", "number");
        DefineOutput("body", "string");
    }

    public override async Task ExecuteAsync(FlowContext context)
    {
        var url = Inputs["url"].Value?.ToString() ?? "";
        var method = Inputs["method"].Value?.ToString() ?? "GET";

        try
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), url);
            var response = await _client.SendAsync(request, context.CancellationToken);
            Outputs["status"].Value = (int)response.StatusCode;
            Outputs["body"].Value = await response.Content.ReadAsStringAsync(context.CancellationToken);
        }
        catch (Exception ex)
        {
            Outputs["status"].Value = 0;
            Outputs["body"].Value = ex.Message;
            context.Logger.Error($"HTTP error: {ex.Message}");
        }
    }
}
''',

    "src/Morget.Flow/Nodes/FileNode.cs": r'''namespace Morget.Flow.Nodes;

public sealed class FileNode : NodeBase
{
    public FileNode()
    {
        Name = "File";
        DefineInput("flow", "flow");
        DefineInput("path", "string");
        DefineInput("content", "string");
        DefineInput("operation", "string", "read");
        DefineOutput("flow", "flow");
        DefineOutput("result", "string");
    }

    public override async Task ExecuteAsync(FlowContext context)
    {
        var path = Inputs["path"].Value?.ToString() ?? "";
        var op = Inputs["operation"].Value?.ToString()?.ToLowerInvariant() ?? "read";
        var content = Inputs["content"].Value?.ToString() ?? "";

        try
        {
            switch (op)
            {
                case "write":
                    await File.WriteAllTextAsync(path, content, context.CancellationToken);
                    Outputs["result"].Value = "written";
                    break;
                case "append":
                    await File.AppendAllTextAsync(path, content, context.CancellationToken);
                    Outputs["result"].Value = "appended";
                    break;
                default:
                    Outputs["result"].Value = await File.ReadAllTextAsync(path, context.CancellationToken);
                    break;
            }
        }
        catch (Exception ex)
        {
            Outputs["result"].Value = $"error: {ex.Message}";
            context.Logger.Error($"File error: {ex.Message}");
        }
    }
}
''',

    "src/Morget.Flow/NodeGraph.cs": r'''using System.Collections.Generic;
using Morget.Flow.Nodes;

namespace Morget.Flow;

public sealed class NodeGraph
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "Untitled";
    public List<NodeBase> Nodes { get; } = new();
    public List<Connection> Connections { get; } = new();

    public void Connect(string fromNodeId, string fromPort, string toNodeId, string toPort)
    {
        Connections.Add(new Connection(fromNodeId, fromPort, toNodeId, toPort));
    }
}

public sealed record Connection(string FromNodeId, string FromPort, string ToNodeId, string ToPort);
''',

    "src/Morget.Flow/FlowEngine.cs": r'''using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Morget.Flow.Nodes;
using Serilog;

namespace Morget.Flow;

public sealed class FlowEngine
{
    private readonly ILogger _logger = Log.ForContext<FlowEngine>();

    public async Task ExecuteAsync(NodeGraph graph, CancellationToken ct = default)
    {
        var context = new FlowContext(new LoggerProxy(_logger), ct);
        var executed = new HashSet<string>();
        var queue = new Queue<NodeBase>();

        var start = graph.Nodes.OfType<StartNode>().FirstOrDefault();
        if (start == null)
        {
            _logger.Error("No StartNode found in graph");
            return;
        }

        queue.Enqueue(start);

        while (queue.Count > 0 && !ct.IsCancellationRequested)
        {
            var node = queue.Dequeue();
            if (!executed.Add(node.Id)) continue;

            try
            {
                await node.ExecuteAsync(context);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Node execution failed: {Node}", node.Name);
                continue;
            }

            foreach (var conn in graph.Connections.Where(c => c.FromNodeId == node.Id))
            {
                var target = graph.Nodes.FirstOrDefault(n => n.Id == conn.ToNodeId);
                if (target == null) continue;

                if (node.Outputs.TryGetValue(conn.FromPort, out var outPort) &&
                    target.Inputs.TryGetValue(conn.ToPort, out var inPort))
                {
                    inPort.Value = outPort.Value;
                }

                if (CanExecute(target, executed))
                    queue.Enqueue(target);
            }
        }
    }

    private static bool CanExecute(NodeBase node, HashSet<string> executed)
    {
        return true;
    }

    private sealed class LoggerProxy : ILoggerProxy
    {
        private readonly ILogger _logger;
        public LoggerProxy(ILogger logger) => _logger = logger;
        public void Info(string message) => _logger.Information(message);
        public void Error(string message) => _logger.Error(message);
    }
}
''',

    "src/Morget.Flow/FlowSerializer.cs": r'''using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Morget.Flow.Nodes;

namespace Morget.Flow;

public static class FlowSerializer
{
    private static readonly JsonSerializerOptions _options = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static void SaveToFile(NodeGraph graph, string path)
    {
        var dto = new FlowDto
        {
            Id = graph.Id,
            Name = graph.Name,
            Nodes = graph.Nodes.Select(n => new NodeDto
            {
                Id = n.Id,
                Type = n.GetType().Name,
                Name = n.Name,
                X = n.X,
                Y = n.Y,
                Properties = n.Properties
            }).ToList(),
            Connections = graph.Connections.Select(c => new ConnectionDto
            {
                From = c.FromNodeId,
                FromPort = c.FromPort,
                To = c.ToNodeId,
                ToPort = c.ToPort
            }).ToList()
        };

        var json = JsonSerializer.Serialize(dto, _options);
        File.WriteAllText(path, json);
    }

    public static NodeGraph LoadFromFile(string path)
    {
        var json = File.ReadAllText(path);
        var dto = JsonSerializer.Deserialize<FlowDto>(json, _options) ?? new FlowDto();

        var graph = new NodeGraph { Id = dto.Id, Name = dto.Name };

        foreach (var n in dto.Nodes)
        {
            NodeBase? node = n.Type switch
            {
                "StartNode" => new StartNode(),
                "EndNode" => new EndNode(),
                "LogNode" => new LogNode(),
                "HttpNode" => new HttpNode(),
                "FileNode" => new FileNode(),
                _ => null
            };

            if (node != null)
            {
                node.Id = n.Id;
                node.Name = n.Name;
                node.X = n.X;
                node.Y = n.Y;
                node.Properties = n.Properties ?? new Dictionary<string, object?>();
                graph.Nodes.Add(node);
            }
        }

        foreach (var c in dto.Connections)
        {
            graph.Connect(c.From, c.FromPort, c.To, c.ToPort);
        }

        return graph;
    }

    private sealed class FlowDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public List<NodeDto> Nodes { get; set; } = new();
        public List<ConnectionDto> Connections { get; set; } = new();
    }

    private sealed class NodeDto
    {
        public string Id { get; set; } = "";
        public string Type { get; set; } = "";
        public string Name { get; set; } = "";
        public double X { get; set; }
        public double Y { get; set; }
        public Dictionary<string, object?> Properties { get; set; } = new();
    }

    private sealed class ConnectionDto
    {
        public string From { get; set; } = "";
        public string FromPort { get; set; } = "";
        public string To { get; set; } = "";
        public string ToPort { get; set; } = "";
    }
}
''',

    # -- Morget.Debugger --
    "src/Morget.Debugger/Morget.Debugger.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <RootNamespace>Morget.Debugger</RootNamespace>
    <AssemblyName>Morget.Debugger</AssemblyName>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Runtime\Morget.Runtime.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.Debugger/BreakpointManager.cs": r'''using System.Collections.Generic;

namespace Morget.Debugger;

public sealed class BreakpointManager
{
    private readonly HashSet<int> _lines = new();
    private readonly HashSet<string> _files = new();

    public void Toggle(int line, string? file = null)
    {
        if (_lines.Contains(line))
            _lines.Remove(line);
        else
            _lines.Add(line);

        if (!string.IsNullOrEmpty(file))
            _files.Add(file);
    }

    public bool IsBreakpoint(int line, string? file = null)
    {
        if (!string.IsNullOrEmpty(file) && !_files.Contains(file)) return false;
        return _lines.Contains(line);
    }

    public void ClearAll()
    {
        _lines.Clear();
        _files.Clear();
    }
}
''',

    "src/Morget.Debugger/LuaDebugger.cs": r'''using System;
using System.Threading.Tasks;
using MoonSharp.Interpreter;
using MoonSharp.Interpreter.Debugging;
using Morget.Runtime;
using Serilog;

namespace Morget.Debugger;

public sealed class LuaDebugger : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<LuaDebugger>();
    private readonly LuaRuntime _runtime;
    private readonly BreakpointManager _breakpoints;
    private bool _attached;

    public event EventHandler<DebuggerAction>? OnBreak;

    public LuaDebugger(LuaRuntime runtime)
    {
        _runtime = runtime;
        _breakpoints = new BreakpointManager();
    }

    public void Attach()
    {
        if (_attached) return;
        var script = _runtime.GetInternalScript();

        script.AttachDebugger(new MorgetDebugger(_breakpoints, this));
        _attached = true;
        _logger.Debug("Debugger attached");
    }

    public void Detach()
    {
        if (!_attached) return;
        _attached = false;
    }

    public void SetBreakpoint(int line, string? source = null) => _breakpoints.Toggle(line, source);
    public void ClearBreakpoints() => _breakpoints.ClearAll();

    public void StepOver() => OnBreak?.Invoke(this, DebuggerAction.StepOver);
    public void StepIn() => OnBreak?.Invoke(this, DebuggerAction.StepIn);
    public void Continue() => OnBreak?.Invoke(this, DebuggerAction.Run);

    public void Dispose() => Detach();

    private sealed class MorgetDebugger : MoonSharp.Interpreter.Debugging.IDebugger
    {
        private readonly BreakpointManager _bp;
        private readonly LuaDebugger _owner;

        public MorgetDebugger(BreakpointManager bp, LuaDebugger owner)
        {
            _bp = bp;
            _owner = owner;
        }

        public DebuggerAction GetAction(int sourceCode, int sourceLine, string? sourceName)
        {
            if (_bp.IsBreakpoint(sourceLine, sourceName))
            {
                _owner._logger.Information("Breakpoint hit at {File}:{Line}", sourceName, sourceLine);
                return DebuggerAction.StepOver;
            }
            return DebuggerAction.Run;
        }

        public void SignalExecutionEnded() { }
        public bool IsPauseRequested() => false;
        public void SignalWillExecute(int sourceCode, int sourceLine, string? sourceName) { }
    }
}

public enum DebuggerAction { Run, StepOver, StepIn, StepOut }
''',

    # -- Morget.UI --
    "src/Morget.UI/Morget.UI.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <BuiltInComInteropSupport>true</BuiltInComInteropSupport>
    <ApplicationManifest>app.manifest</ApplicationManifest>
  </PropertyGroup>
  <ItemGroup>
    <AvaloniaResource Include="Assets\**" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Core\Morget.Core.csproj" />
    <ProjectReference Include="..\Morget.PluginHost\Morget.PluginHost.csproj" />
    <ProjectReference Include="..\Morget.Store\Morget.Store.csproj" />
    <ProjectReference Include="..\Morget.Flow\Morget.Flow.csproj" />
    <ProjectReference Include="..\Morget.Debugger\Morget.Debugger.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget.UI/app.manifest": r'''<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.0.0.0" name="Morget.UI"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <requestedExecutionLevel level="asInvoker" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
</assembly>
''',

    "src/Morget.UI/App.axaml": r'''<Application xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="Morget.UI.App"
             RequestedThemeVariant="Dark">
  <Application.Styles>
    <FluentTheme />
    <StyleInclude Source="/Themes/DarkTheme.axaml" />
    <StyleInclude Source="/Themes/LightTheme.axaml" />
  </Application.Styles>
</Application>
''',

    "src/Morget.UI/App.axaml.cs": r'''using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Morget.UI.ViewModels;
using Morget.UI.Views;

namespace Morget.UI;

public partial class App : Application
{
    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            desktop.MainWindow = new MainWindow
            {
                DataContext = new MainWindowViewModel()
            };
        }
        base.OnFrameworkInitializationCompleted();
    }
}
''',

    "src/Morget.UI/ViewModels/ViewModelBase.cs": r'''using CommunityToolkit.Mvvm.ComponentModel;

namespace Morget.UI.ViewModels;

public abstract class ViewModelBase : ObservableObject { }
''',

    "src/Morget.UI/ViewModels/MainWindowViewModel.cs": r'''using System;
using System.Collections.ObjectModel;
using System.Reactive;
using System.Reactive.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Morget.UI.Services;

namespace Morget.UI.ViewModels;

public sealed partial class MainWindowViewModel : ViewModelBase
{
    [ObservableProperty]
    private ViewModelBase _currentView;

    [ObservableProperty]
    private string _windowTitle = "Morget v2.0";

    [ObservableProperty]
    private bool _isDarkTheme = true;

    public ObservableCollection<NavItem> NavigationItems { get; } = new();

    public MainWindowViewModel()
    {
        var dashboard = new DashboardViewModel();
        var store = new PluginStoreViewModel();
        var flow = new FlowEditorViewModel();
        var settings = new SettingsViewModel();

        NavigationItems.Add(new NavItem("Dashboard", "Home", dashboard));
        NavigationItems.Add(new NavItem("Store", "Store", store));
        NavigationItems.Add(new NavItem("Flow", "Flow", flow));
        NavigationItems.Add(new NavItem("Settings", "Settings", settings));

        _currentView = dashboard;

        ThemeService.Current.ThemeChanged += t => IsDarkTheme = t == "Dark";
    }

    [RelayCommand]
    private void Navigate(NavItem item)
    {
        CurrentView = item.ViewModel;
        WindowTitle = $"Morget v2.0 - {item.Label}";
    }

    [RelayCommand]
    private void ToggleTheme()
    {
        ThemeService.Current.SetTheme(IsDarkTheme ? "Light" : "Dark");
    }
}

public sealed class NavItem
{
    public string Label { get; }
    public string Icon { get; }
    public ViewModelBase ViewModel { get; }

    public NavItem(string label, string icon, ViewModelBase vm)
    {
        Label = label;
        Icon = icon;
        ViewModel = vm;
    }
}
''',

    "src/Morget.UI/ViewModels/DashboardViewModel.cs": r'''using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using Morget.Core;
using Morget.PluginHost;

namespace Morget.UI.ViewModels;

public sealed partial class DashboardViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _workspaceName = "No workspace";

    [ObservableProperty]
    private int _pluginCount;

    [ObservableProperty]
    private int _enabledPluginCount;

    [ObservableProperty]
    private ObservableCollection<PluginInfoViewModel> _plugins = new();

    public DashboardViewModel()
    {
        Refresh();
    }

    private void Refresh()
    {
        try
        {
            var app = Application.Instance;
            WorkspaceName = app.Workspace.Current?.Name ?? "No workspace";

            if (app is null) return;

            PluginCount = 0;
            EnabledPluginCount = 0;
        }
        catch { }
    }
}

public sealed partial class PluginInfoViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _id = "";

    [ObservableProperty]
    private string _name = "";

    [ObservableProperty]
    private string _version = "";

    [ObservableProperty]
    private string _description = "";

    [ObservableProperty]
    private string _author = "";

    [ObservableProperty]
    private string _category = "";

    [ObservableProperty]
    private bool _isEnabled;

    [ObservableProperty]
    private string _statusColor = "#808080";
}
''',

    "src/Morget.UI/ViewModels/PluginStoreViewModel.cs": r'''using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Morget.Store;

namespace Morget.UI.ViewModels;

public sealed partial class PluginStoreViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _searchQuery = "";

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private ObservableCollection<GitHubPluginInfo> _plugins = new();

    private readonly GitHubStore _store = new();

    public PluginStoreViewModel()
    {
        _ = LoadAsync();
    }

    [RelayCommand]
    private async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            var results = await _store.SearchPluginsAsync(SearchQuery);
            Plugins.Clear();
            foreach (var p in results)
                Plugins.Add(p);
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task InstallAsync(GitHubPluginInfo plugin)
    {
        await Task.Delay(500);
    }
}
''',

    "src/Morget.UI/ViewModels/SettingsViewModel.cs": r'''using System.Collections.Generic;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Morget.Core;
using Morget.UI.Services;

namespace Morget.UI.ViewModels;

public sealed partial class SettingsViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _selectedTheme = "Dark";

    [ObservableProperty]
    private string _selectedLanguage = "en-US";

    [ObservableProperty]
    private bool _checkUpdates = true;

    [ObservableProperty]
    private bool _autoSaveWorkspace = true;

    public List<string> Themes { get; } = new() { "Dark", "Light" };
    public List<string> Languages { get; } = new() { "en-US", "zh-CN" };

    public SettingsViewModel()
    {
        try
        {
            var s = Application.Instance.Settings;
            SelectedTheme = s.Get("theme", "Dark");
            SelectedLanguage = s.Get("language", "en-US");
            CheckUpdates = s.Get("check_updates", true);
            AutoSaveWorkspace = s.Get("auto_save_workspace", true);
        }
        catch { }
    }

    partial void OnSelectedThemeChanged(string value) => ThemeService.Current.SetTheme(value);
    partial void OnSelectedLanguageChanged(string value) => LocalizationService.Current.SetLanguage(value);

    [RelayCommand]
    private void Save()
    {
        var s = Application.Instance.Settings;
        s.Set("theme", SelectedTheme);
        s.Set("language", SelectedLanguage);
        s.Set("check_updates", CheckUpdates);
        s.Set("auto_save_workspace", AutoSaveWorkspace);
    }
}
''',

    "src/Morget.UI/ViewModels/FlowEditorViewModel.cs": r'''using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Morget.Flow;
using Morget.Flow.Nodes;

namespace Morget.UI.ViewModels;

public sealed partial class FlowEditorViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _flowName = "Untitled";

    [ObservableProperty]
    private ObservableCollection<NodeBase> _nodes = new();

    [ObservableProperty]
    private NodeBase? _selectedNode;

    public FlowEditorViewModel()
    {
        var graph = new NodeGraph();
        var start = new StartNode { X = 100, Y = 100 };
        var log = new LogNode { X = 300, Y = 100 };
        var end = new EndNode { X = 500, Y = 100 };

        graph.Nodes.Add(start);
        graph.Nodes.Add(log);
        graph.Nodes.Add(end);

        graph.Connect(start.Id, "flow", log.Id, "flow");
        graph.Connect(log.Id, "flow", end.Id, "flow");

        Nodes = new ObservableCollection<NodeBase>(graph.Nodes);
    }

    [RelayCommand]
    private void AddNode(string type)
    {
        NodeBase? node = type switch
        {
            "Log" => new LogNode(),
            "HTTP" => new HttpNode(),
            "File" => new FileNode(),
            _ => null
        };

        if (node != null)
        {
            node.X = 200 + Nodes.Count * 50;
            node.Y = 200 + Nodes.Count * 30;
            Nodes.Add(node);
        }
    }

    [RelayCommand]
    private async Task RunFlowAsync()
    {
        var graph = new NodeGraph { Name = FlowName };
        foreach (var n in Nodes) graph.Nodes.Add(n);
        var engine = new FlowEngine();
        await engine.ExecuteAsync(graph);
    }
}
''',

    "src/Morget.UI/Views/MainWindow.axaml": r'''<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:vm="clr-namespace:Morget.UI.ViewModels"
        xmlns:views="clr-namespace:Morget.UI.Views"
        x:Class="Morget.UI.Views.MainWindow"
        x:DataType="vm:MainWindowViewModel"
        Title="{Binding WindowTitle}"
        Width="1200" Height="800"
        MinWidth="900" MinHeight="600">

  <Design.DataContext>
    <vm:MainWindowViewModel />
  </Design.DataContext>

  <Panel>
    <SplitView IsPaneOpen="True" DisplayMode="CompactInline" CompactPaneLength="48" OpenPaneLength="220">
      <SplitView.Pane>
        <Border Background="{DynamicResource SystemChromeMediumColor}">
          <Grid RowDefinitions="Auto,*,Auto">
            <TextBlock Grid.Row="0" Text="MORGET" FontWeight="Bold" Margin="16,12" FontSize="18" />
            <ListBox Grid.Row="1" ItemsSource="{Binding NavigationItems}" SelectedItem="{Binding NavigationItems[0]}" Margin="0,8">
              <ListBox.ItemTemplate>
                <DataTemplate>
                  <StackPanel Orientation="Horizontal" Spacing="12">
                    <TextBlock Text="{Binding Icon}" FontSize="20" />
                    <TextBlock Text="{Binding Label}" VerticalAlignment="Center" />
                  </StackPanel>
                </DataTemplate>
              </ListBox.ItemTemplate>
            </ListBox>
            <StackPanel Grid.Row="2" Margin="12">
              <Button Content="🌓 Theme" Command="{Binding ToggleThemeCommand}" HorizontalAlignment="Stretch" />
            </StackPanel>
          </Grid>
        </Border>
      </SplitView.Pane>

      <SplitView.Content>
        <TransitioningContentControl Content="{Binding CurrentView}">
          <TransitioningContentControl.DataTemplates>
            <DataTemplate DataType="vm:DashboardViewModel">
              <views:DashboardView />
            </DataTemplate>
            <DataTemplate DataType="vm:PluginStoreViewModel">
              <views:PluginStoreView />
            </DataTemplate>
            <DataTemplate DataType="vm:FlowEditorViewModel">
              <views:FlowEditorView />
            </DataTemplate>
            <DataTemplate DataType="vm:SettingsViewModel">
              <views:SettingsView />
            </DataTemplate>
          </TransitioningContentControl.DataTemplates>
        </TransitioningContentControl>
      </SplitView.Content>
    </SplitView>
  </Panel>
</Window>
''',

    "src/Morget.UI/Views/MainWindow.axaml.cs": r'''using Avalonia.Controls;
using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class MainWindow : ReactiveWindow<ViewModels.MainWindowViewModel>
{
    public MainWindow()
    {
        InitializeComponent();
    }
}
''',

    "src/Morget.UI/Views/DashboardView.axaml": r'''<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:vm="clr-namespace:Morget.UI.ViewModels"
             x:Class="Morget.UI.Views.DashboardView"
             x:DataType="vm:DashboardViewModel">

  <Grid Margin="24" RowDefinitions="Auto,Auto,*">
    <TextBlock Grid.Row="0" Text="Dashboard" FontSize="32" FontWeight="Light" Margin="0,0,0,24" />

    <Grid Grid.Row="1" ColumnDefinitions="*,*,*" Margin="0,0,0,24">
      <Border Grid.Column="0" Classes="card" Margin="0,0,12,0">
        <StackPanel Margin="16">
          <TextBlock Text="Workspace" Opacity="0.7" FontSize="12" />
          <TextBlock Text="{Binding WorkspaceName}" FontSize="20" FontWeight="Bold" TextTrimming="CharacterEllipsis" />
        </StackPanel>
      </Border>
      <Border Grid.Column="1" Classes="card" Margin="6,0,6,0">
        <StackPanel Margin="16">
          <TextBlock Text="Plugins Installed" Opacity="0.7" FontSize="12" />
          <TextBlock Text="{Binding PluginCount}" FontSize="20" FontWeight="Bold" />
        </StackPanel>
      </Border>
      <Border Grid.Column="2" Classes="card" Margin="12,0,0,0">
        <StackPanel Margin="16">
          <TextBlock Text="Active" Opacity="0.7" FontSize="12" />
          <TextBlock Text="{Binding EnabledPluginCount}" FontSize="20" FontWeight="Bold" Foreground="Green" />
        </StackPanel>
      </Border>
    </Grid>

    <Border Grid.Row="2" Classes="card">
      <Grid Margin="16" RowDefinitions="Auto,*">
        <TextBlock Text="Recent Plugins" FontWeight="Bold" Margin="0,0,0,12" />
        <ListBox Grid.Row="1" ItemsSource="{Binding Plugins}" />
      </Grid>
    </Border>
  </Grid>
</UserControl>
''',

    "src/Morget.UI/Views/DashboardView.axaml.cs": r'''using Avalonia.Controls;
using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class DashboardView : ReactiveUserControl<ViewModels.DashboardViewModel>
{
    public DashboardView()
    {
        InitializeComponent();
    }
}
''',

    "src/Morget.UI/Views/PluginStoreView.axaml": r'''<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:vm="clr-namespace:Morget.UI.ViewModels"
             xmlns:controls="clr-namespace:Morget.UI.Controls"
             x:Class="Morget.UI.Views.PluginStoreView"
             x:DataType="vm:PluginStoreViewModel">

  <Grid Margin="24" RowDefinitions="Auto,Auto,*">
    <TextBlock Grid.Row="0" Text="Plugin Store" FontSize="32" FontWeight="Light" Margin="0,0,0,16" />

    <Grid Grid.Row="1" ColumnDefinitions="*,Auto" Margin="0,0,0,16">
      <TextBox Grid.Column="0" Watermark="Search plugins..." Text="{Binding SearchQuery}" />
      <Button Grid.Column="1" Content="🔍 Search" Command="{Binding LoadCommand}" Margin="12,0,0,0" />
    </Grid>

    <ScrollViewer Grid.Row="2">
      <ItemsControl ItemsSource="{Binding Plugins}">
        <ItemsControl.ItemsPanel>
          <ItemsPanelTemplate>
            <WrapPanel />
          </ItemsPanelTemplate>
        </ItemsControl.ItemsPanel>
        <ItemsControl.ItemTemplate>
          <DataTemplate>
            <controls:PluginCard Margin="8" />
          </DataTemplate>
        </ItemsControl.ItemTemplate>
      </ItemsControl>
    </ScrollViewer>

    <Panel Grid.Row="2" IsVisible="{Binding IsLoading}" Background="#80000000">
      <ProgressBar Width="200" IsIndeterminate="True" VerticalAlignment="Center" />
    </Panel>
  </Grid>
</UserControl>
''',

    "src/Morget.UI/Views/PluginStoreView.axaml.cs": r'''using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class PluginStoreView : ReactiveUserControl<ViewModels.PluginStoreViewModel>
{
    public PluginStoreView()
    {
        InitializeComponent();
    }
}
''',

    "src/Morget.UI/Views/SettingsView.axaml": r'''<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:vm="clr-namespace:Morget.UI.ViewModels"
             x:Class="Morget.UI.Views.SettingsView"
             x:DataType="vm:SettingsViewModel">

  <Grid Margin="24" RowDefinitions="Auto,*">
    <TextBlock Grid.Row="0" Text="Settings" FontSize="32" FontWeight="Light" Margin="0,0,0,24" />

    <StackPanel Grid.Row="1" Spacing="16" MaxWidth="600" HorizontalAlignment="Left">
      <Grid ColumnDefinitions="200,*">
        <TextBlock Text="Theme" VerticalAlignment="Center" />
        <ComboBox Grid.Column="1" ItemsSource="{Binding Themes}" SelectedItem="{Binding SelectedTheme}" />
      </Grid>

      <Grid ColumnDefinitions="200,*">
        <TextBlock Text="Language" VerticalAlignment="Center" />
        <ComboBox Grid.Column="1" ItemsSource="{Binding Languages}" SelectedItem="{Binding SelectedLanguage}" />
      </Grid>

      <Grid ColumnDefinitions="200,*">
        <TextBlock Text="Check Updates" VerticalAlignment="Center" />
        <ToggleSwitch Grid.Column="1" IsChecked="{Binding CheckUpdates}" />
      </Grid>

      <Grid ColumnDefinitions="200,*">
        <TextBlock Text="Auto Save Workspace" VerticalAlignment="Center" />
        <ToggleSwitch Grid.Column="1" IsChecked="{Binding AutoSaveWorkspace}" />
      </Grid>

      <Button Content="💾 Save Settings" Command="{Binding SaveCommand}" HorizontalAlignment="Left" Margin="0,16,0,0" />
    </StackPanel>
  </Grid>
</UserControl>
''',

    "src/Morget.UI/Views/SettingsView.axaml.cs": r'''using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class SettingsView : ReactiveUserControl<ViewModels.SettingsViewModel>
{
    public SettingsView()
    {
        InitializeComponent();
    }
}
''',

    "src/Morget.UI/Views/FlowEditorView.axaml": r'''<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:vm="clr-namespace:Morget.UI.ViewModels"
             xmlns:controls="clr-namespace:Morget.UI.Controls"
             x:Class="Morget.UI.Views.FlowEditorView"
             x:DataType="vm:FlowEditorViewModel">

  <Grid Margin="24" RowDefinitions="Auto,Auto,*">
    <TextBlock Grid.Row="0" Text="Flow Editor" FontSize="32" FontWeight="Light" Margin="0,0,0,16" />
    <StackPanel Grid.Row="1" Orientation="Horizontal" Spacing="8" Margin="0,0,0,16">
      <Button Content="➕ Log" Command="{Binding AddNodeCommand}" CommandParameter="Log" />
      <Button Content="➕ HTTP" Command="{Binding AddNodeCommand}" CommandParameter="HTTP" />
      <Button Content="➕ File" Command="{Binding AddNodeCommand}" CommandParameter="File" />
      <Button Content="▶ Run" Command="{Binding RunFlowCommand}" Background="Green" Foreground="White" />
    </StackPanel>

    <Border Grid.Row="2" Classes="card" Background="#1a1a1a">
      <controls:NodeCanvas Nodes="{Binding Nodes}" />
    </Border>
  </Grid>
</UserControl>
''',

    "src/Morget.UI/Views/FlowEditorView.axaml.cs": r'''using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class FlowEditorView : ReactiveUserControl<ViewModels.FlowEditorViewModel>
{
    public FlowEditorView()
    {
        InitializeComponent();
    }
}
''',

    "src/Morget.UI/Controls/PluginCard.axaml": r'''<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="Morget.UI.Controls.PluginCard"
             Width="280" Height="160">

  <Design.Width>280</Design.Width>
  <Design.Height>160</Design.Height>

  <Border Classes="plugin-card" Background="{DynamicResource SystemChromeLowColor}">
    <Grid RowDefinitions="Auto,*,Auto" Margin="12">
      <Grid Grid.Row="0" ColumnDefinitions="Auto,*,Auto">
        <Ellipse Width="40" Height="40" Fill="{DynamicResource SystemAccentColor}" />
        <TextBlock Grid.Column="1" Text="{Binding Name}" FontWeight="Bold" FontSize="16" Margin="8,0" VerticalAlignment="Center" />
        <TextBlock Grid.Column="2" Text="{Binding Version}" Opacity="0.6" FontSize="11" VerticalAlignment="Center" />
      </Grid>

      <TextBlock Grid.Row="1" Text="{Binding Description}" TextWrapping="Wrap" Margin="0,8" Opacity="0.8" />

      <Grid Grid.Row="2" ColumnDefinitions="*,Auto">
        <TextBlock Text="{Binding Author}" FontSize="11" Opacity="0.5" VerticalAlignment="Center" />
        <Button Grid.Column="1" Content="⬇ Install" FontSize="11" Padding="8,4" />
      </Grid>
    </Grid>
  </Border>
</UserControl>
''',

    "src/Morget.UI/Controls/PluginCard.axaml.cs": r'''using Avalonia.Controls;
using Avalonia.ReactiveUI;

namespace Morget.UI.Controls;

public partial class PluginCard : ReactiveUserControl<object>
{
    public PluginCard()
    {
        InitializeComponent();
    }
}
''',

    "src/Morget.UI/Controls/NodeCanvas.axaml": r'''<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="Morget.UI.Controls.NodeCanvas">

  <Canvas x:Name="CanvasHost" Background="Transparent" />
</UserControl>
''',

    "src/Morget.UI/Controls/NodeCanvas.axaml.cs": r'''using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Shapes;
using Avalonia.Media;
using Avalonia.ReactiveUI;
using Morget.Flow.Nodes;

namespace Morget.UI.Controls;

public partial class NodeCanvas : ReactiveUserControl<NodeCanvas>
{
    public static readonly DirectProperty<NodeCanvas, IEnumerable<NodeBase>> NodesProperty =
        AvaloniaProperty.RegisterDirect<NodeCanvas, IEnumerable<NodeBase>>(
            nameof(Nodes),
            o => o.Nodes,
            (o, v) => o.Nodes = v);

    private IEnumerable<NodeBase> _nodes = new List<NodeBase>();

    public IEnumerable<NodeBase> Nodes
    {
        get => _nodes;
        set
        {
            SetAndRaise(NodesProperty, ref _nodes, value);
            RenderNodes();
        }
    }

    public NodeCanvas()
    {
        InitializeComponent();
    }

    private void RenderNodes()
    {
        CanvasHost.Children.Clear();
        foreach (var node in _nodes)
        {
            var border = new Border
            {
                Width = 140,
                Height = 80,
                Background = new SolidColorBrush(Color.Parse("#2d2d2d")),
                BorderBrush = new SolidColorBrush(Color.Parse("#3d3d3d")),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(6),
                [Canvas.LeftProperty] = node.X,
                [Canvas.TopProperty] = node.Y
            };

            var tb = new TextBlock
            {
                Text = node.Name,
                Foreground = Brushes.White,
                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
                VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center
            };

            border.Child = tb;
            CanvasHost.Children.Add(border);
        }
    }
}
''',

    "src/Morget.UI/Converters/StatusToColorConverter.cs": r'''using System;
using System.Globalization;
using Avalonia.Data.Converters;
using Avalonia.Media;

namespace Morget.UI.Converters;

public sealed class StatusToColorConverter : IValueConverter
{
    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        var color = value?.ToString() switch
        {
            "Enabled" => "#4caf50",
            "Disabled" => "#ff9800",
            "Error" => "#f44336",
            _ => "#9e9e9e"
        };
        return new SolidColorBrush(Color.Parse(color));
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
''',

    "src/Morget.UI/Services/ThemeService.cs": r'''using System;

namespace Morget.UI.Services;

public sealed class ThemeService
{
    public static ThemeService Current { get; } = new();

    public event Action<string>? ThemeChanged;

    public void SetTheme(string theme)
    {
        ThemeChanged?.Invoke(theme);
    }
}
''',

    "src/Morget.UI/Services/LocalizationService.cs": r'''using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

namespace Morget.UI.Services;

public sealed class LocalizationService
{
    public static LocalizationService Current { get; } = new();

    private Dictionary<string, string> _strings = new();
    public event Action? LanguageChanged;

    public void SetLanguage(string lang)
    {
        var path = $"Assets/i18n/{lang}.json";
        if (File.Exists(path))
        {
            var json = File.ReadAllText(path);
            _strings = JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new();
        }
        LanguageChanged?.Invoke();
    }

    public string this[string key] => _strings.TryGetValue(key, out var value) ? value : key;
}
''',

    "src/Morget.UI/Themes/DarkTheme.axaml": r'''<ResourceDictionary xmlns="https://github.com/avaloniaui"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
  <SolidColorBrush x:Key="SystemChromeLowColor">#2d2d2d</SolidColorBrush>
  <SolidColorBrush x:Key="SystemChromeMediumColor">#1e1e1e</SolidColorBrush>
  <Style Selector="Border.card">
    <Setter Property="Background" Value="{DynamicResource SystemChromeLowColor}" />
    <Setter Property="CornerRadius" Value="8" />
    <Setter Property="BoxShadow" Value="0 2 8 0 #40000000" />
  </Style>
  <Style Selector="Border.plugin-card">
    <Setter Property="Background" Value="{DynamicResource SystemChromeLowColor}" />
    <Setter Property="CornerRadius" Value="8" />
    <Setter Property="Margin" Value="8" />
  </Style>
</ResourceDictionary>
''',

    "src/Morget.UI/Themes/LightTheme.axaml": r'''<ResourceDictionary xmlns="https://github.com/avaloniaui"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
  <SolidColorBrush x:Key="SystemChromeLowColor">#f5f5f5</SolidColorBrush>
  <SolidColorBrush x:Key="SystemChromeMediumColor">#e0e0e0</SolidColorBrush>
  <Style Selector="Border.card">
    <Setter Property="Background" Value="#ffffff" />
    <Setter Property="CornerRadius" Value="8" />
    <Setter Property="BoxShadow" Value="0 2 8 0 #20000000" />
  </Style>
  <Style Selector="Border.plugin-card">
    <Setter Property="Background" Value="#ffffff" />
    <Setter Property="CornerRadius" Value="8" />
    <Setter Property="Margin" Value="8" />
  </Style>
</ResourceDictionary>
''',

    "src/Morget.UI/Assets/i18n/en-US.json": r'''{
  "Dashboard": "Dashboard",
  "Store": "Store",
  "Flow": "Flow",
  "Settings": "Settings",
  "Plugins": "Plugins",
  "Workspace": "Workspace"
}
''',

    "src/Morget.UI/Assets/i18n/zh-CN.json": r'''{
  "Dashboard": "仪表盘",
  "Store": "插件商店",
  "Flow": "工作流",
  "Settings": "设置",
  "Plugins": "插件",
  "Workspace": "工作区"
}
''',

    # -- Morget (Entry) --
    "src/Morget/Morget.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ApplicationIcon>Assets/icon.ico</ApplicationIcon>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\Morget.Core\Morget.Core.csproj" />
    <ProjectReference Include="..\Morget.UI\Morget.UI.csproj" />
    <ProjectReference Include="..\Morget.PluginHost\Morget.PluginHost.csproj" />
  </ItemGroup>
</Project>
''',

    "src/Morget/Assets/icon.ico": "",  # 空图标占位

    "src/Morget/Program.cs": r'''using System;
using System.Threading.Tasks;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;

namespace Morget;

class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        Console.WriteLine("╔═══════════════════════════════════════╗");
        Console.WriteLine("║  Morget v2.0 - Plugin Platform       ║");
        Console.WriteLine("║  Copyright (c) 2026 Moonlight Games  ║");
        Console.WriteLine("╚═══════════════════════════════════════╝");

        try
        {
            using var app = new Application();
            var pluginManager = new PluginManager();
            pluginManager.Initialize();

            Console.WriteLine($"\n✅ Application initialized");
            Console.WriteLine($"   Workspace: {app.Workspace.Current?.Name ?? "(none)"}");
            Console.WriteLine($"   Plugins: {pluginManager.Plugins.Count} installed");

            foreach (var plugin in pluginManager.Plugins.Values)
            {
                Console.WriteLine($"   - {plugin.Name} v{plugin.Version} [{plugin.Status}]");
            }

            BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n❌ Fatal error: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            Environment.ExitCode = 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();
}
''',

    # -- Tests --
    "tests/Morget.Core.Tests/Morget.Core.Tests.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.6.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.4" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\..\src\Morget.Core\Morget.Core.csproj" />
  </ItemGroup>
</Project>
''',

    "tests/Morget.Core.Tests/EventBusTests.cs": r'''using System.Threading.Tasks;
using Morget.Core.Events;
using Xunit;

namespace Morget.Core.Tests;

public class EventBusTests
{
    [Fact]
    public void SubscribeAndPublish_Works()
    {
        var bus = new EventBus();
        string? received = null;
        using var sub = bus.Subscribe<TestEvent>(e => received = e.Message);

        bus.Publish(new TestEvent("hello"));
        Assert.Equal("hello", received);
    }

    [Fact]
    public void Unsubscribe_StopsReceiving()
    {
        var bus = new EventBus();
        string? received = null;
        var sub = bus.Subscribe<TestEvent>(e => received = e.Message);
        sub.Dispose();

        bus.Publish(new TestEvent("hello"));
        Assert.Null(received);
    }

    [Fact]
    public async Task AsyncHandler_Works()
    {
        var bus = new EventBus();
        string? received = null;
        using var sub = bus.SubscribeAsync<TestEvent>(async e =>
        {
            await Task.Delay(10);
            received = e.Message;
        });

        bus.Publish(new TestEvent("async"));
        await Task.Delay(100);
        Assert.Equal("async", received);
    }

    private record TestEvent(string Message) : IEvent;
}
''',

    "tests/Morget.Core.Tests/SettingsTests.cs": r'''using System.IO;
using Morget.Core.Settings;
using Xunit;

namespace Morget.Core.Tests;

public class SettingsTests
{
    [Fact]
    public void GetSet_Works()
    {
        var path = Path.GetTempFileName();
        var settings = new SettingsManager(path);
        settings.Set("key", "value");
        Assert.Equal("value", settings.Get<string>("key"));
        settings.Dispose();
        File.Delete(path);
    }

    [Fact]
    public void JsonElement_UnpacksCorrectly()
    {
        var path = Path.GetTempFileName();
        File.WriteAllText(path, "{\"num\": 42, \"flag\": true, \"text\": \"hello\"}");
        var settings = new SettingsManager(path);
        Assert.Equal(42, settings.Get<int>("num"));
        Assert.True(settings.Get<bool>("flag"));
        Assert.Equal("hello", settings.Get<string>("text"));
        settings.Dispose();
        File.Delete(path);
    }
}
''',

    "tests/Morget.Runtime.Tests/Morget.Runtime.Tests.csproj": r'''<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.8.0" />
    <PackageReference Include="xunit" Version="2.6.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.5.4" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\..\src\Morget.Runtime\Morget.Runtime.csproj" />
  </ItemGroup>
</Project>
''',

    "tests/Morget.Runtime.Tests/LuaRuntimeTests.cs": r'''using Morget.Runtime;
using Xunit;

namespace Morget.Runtime.Tests;

public class LuaRuntimeTests
{
    [Fact]
    public void ExecuteString_ReturnsResult()
    {
        using var rt = new LuaRuntime();
        var result = rt.ExecuteString("return 1 + 1");
        Assert.Equal(2.0, result);
    }

    [Fact]
    public void MorgetAPI_Registered()
    {
        using var rt = new LuaRuntime();
        var result = rt.ExecuteString("return Morget.version");
        Assert.Equal("2.0.0", result);
    }

    [Fact]
    public void Sandbox_BlocksDangerousFunctions()
    {
        using var rt = new LuaRuntime();
        var result = rt.ExecuteString("return io == nil");
        Assert.Equal(true, result);
    }
}
''',

    "tests/Morget.Runtime.Tests/SandboxTests.cs": r'''using System.IO;
using Morget.Runtime;
using Xunit;

namespace Morget.Runtime.Tests;

public class SandboxTests
{
    [Fact]
    public void IsPathAllowed_Works()
    {
        var path = Path.GetTempPath();
        Sandbox.AllowPath(path);
        Assert.True(Sandbox.IsPathAllowed(Path.Combine(path, "sub", "file.txt")));
        Assert.False(Sandbox.IsPathAllowed("C:\\Windows\\System32"));
    }

    [Fact]
    public void IsModuleAllowed_BasicModules()
    {
        Assert.True(Sandbox.IsModuleAllowed("table"));
        Assert.True(Sandbox.IsModuleAllowed("os.date"));
        Assert.False(Sandbox.IsModuleAllowed("os.execute"));
        Assert.False(Sandbox.IsModuleAllowed("io"));
    }
}
''',
}


def main():
    base = Path.cwd()
    total = len(FILES)
    current = 0

    for rel_path, content in FILES.items():
        current += 1
        file_path = base / rel_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(content, encoding="utf-8")
        print(f"[{current}/{total}] Created: {rel_path}")

    # Git 初始化
    print("\n🔧 Initializing Git repository...")
    try:
        subprocess.run(["git", "init"], check=True, capture_output=True)
        subprocess.run(["git", "add", "."], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", "feat: initial Morget v2.0 commit"], check=True, capture_output=True)
        print("✅ Git repository initialized and committed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git command failed: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("⚠️ Git not found in PATH. Please install Git.")
        sys.exit(1)

    print("\n🎉 All done! Project generated at:", base.resolve())


if __name__ == "__main__":
    main()