using System;
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
