using System;
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
