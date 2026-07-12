using System;
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
