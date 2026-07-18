using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using System;

namespace Morget.ViewModels;

public partial class SetupWizardViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _selectedPreset = "Minimal";

    [ObservableProperty]
    private bool _isLoading;

    [RelayCommand]
    private void SelectPreset(string preset)
    {
        SelectedPreset = preset;
        // 这里可以添加预设选择的逻辑
    }

    [RelayCommand]
    private void CompleteSetup()
    {
        // 保存设置并关闭向导
        // 实际实现需要保存到 SettingsManager
        Console.WriteLine($"Setup completed with preset: {SelectedPreset}");
    }
}
