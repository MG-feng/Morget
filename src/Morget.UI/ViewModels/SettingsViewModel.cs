using System.Collections.Generic;
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
