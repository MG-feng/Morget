using System;
using System.IO;
using System.Text.Json;
using Serilog;

namespace Morget;

public class SettingsManager
{
    private static SettingsManager? _instance;
    private static readonly object _lock = new();
    private readonly string _settingsPath;
    private SettingsData _data;

    public static SettingsManager Instance
    {
        get
        {
            if (_instance == null)
            {
                lock (_lock)
                {
                    _instance ??= new SettingsManager();
                }
            }
            return _instance;
        }
    }

    private SettingsManager()
    {
        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        var morgetDir = Path.Combine(appData, "Morget");
        Directory.CreateDirectory(morgetDir);
        _settingsPath = Path.Combine(morgetDir, "settings.json");
        _data = LoadSettings();
    }

    private SettingsData LoadSettings()
    {
        if (!File.Exists(_settingsPath))
        {
            return new SettingsData { IsFirstLaunch = true };
        }

        try
        {
            var json = File.ReadAllText(_settingsPath);
            var data = JsonSerializer.Deserialize<SettingsData>(json);
            if (data != null)
            {
                data.IsFirstLaunch = false;
                return data;
            }
        }
        catch (Exception ex)
        {
            Log.Warning(ex, "[Settings] Failed to load settings");
        }

        return new SettingsData { IsFirstLaunch = true };
    }

    public void SaveSettings()
    {
        try
        {
            var json = JsonSerializer.Serialize(_data, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            File.WriteAllText(_settingsPath, json);
            Log.Information("[Settings] Settings saved to {Path}", _settingsPath);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "[Settings] Failed to save settings");
        }
    }

    public bool IsFirstLaunch => _data.IsFirstLaunch;
    public string Preset
    {
        get => _data.Preset;
        set
        {
            _data.Preset = value;
            SaveSettings();
        }
    }
    public string Theme
    {
        get => _data.Theme;
        set
        {
            _data.Theme = value;
            SaveSettings();
        }
    }
}

public class SettingsData
{
    public string Preset { get; set; } = "Minimal";
    public string Theme { get; set; } = "Dark";
    public bool IsFirstLaunch { get; set; } = true;
    public DateTime FirstLaunchDate { get; set; } = DateTime.Now;
    public bool TelemetryEnabled { get; set; } = false;
}
