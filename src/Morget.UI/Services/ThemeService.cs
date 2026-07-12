using System;

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
