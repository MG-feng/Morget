using System;
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
