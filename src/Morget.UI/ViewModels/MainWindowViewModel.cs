using System;
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
        var console = new ConsoleViewModel();

        NavigationItems.Add(new NavItem("Console", "🖥️", console));
        NavigationItems.Add(new NavItem("Dashboard", "🏠", dashboard));
        NavigationItems.Add(new NavItem("Store", "📦", store));
        NavigationItems.Add(new NavItem("Flow", "🔀", flow));
        NavigationItems.Add(new NavItem("Settings", "⚙️", settings));

        _currentView = console;

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
