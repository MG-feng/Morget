using System;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Morget.UI.ViewModels;

public partial class ConsoleViewModel : ViewModelBase
{
    [ObservableProperty]
    private ObservableCollection<string> _logEntries = new();

    [ObservableProperty]
    private string _statusText = "Initializing...";

    [ObservableProperty]
    private bool _isLoading = true;

    public ConsoleViewModel()
    {
        InitializeMorgetAsync();
    }

    private async void InitializeMorgetAsync()
    {
        try
        {
            AddLog("[Console] Starting Morget initialization...");
            
            // Simulate loading Morget components
            await System.Threading.Tasks.Task.Delay(500);
            AddLog("[Console] Loading core components...");
            
            await System.Threading.Tasks.Task.Delay(500);
            AddLog("[Console] Initializing PluginManager...");
            
            await System.Threading.Tasks.Task.Delay(500);
            AddLog("[Console] Loading plugin store...");
            
            await System.Threading.Tasks.Task.Delay(500);
            AddLog("[Console] Setting up flow engine...");
            
            await System.Threading.Tasks.Task.Delay(500);
            AddLog("[Console] Morget loaded successfully!");
            
            StatusText = "Ready";
            IsLoading = false;
        }
        catch (Exception ex)
        {
            AddLog($"[Error] {ex.Message}");
            StatusText = "Error";
            IsLoading = false;
        }
    }

    private void AddLog(string message)
    {
        var timestamp = DateTime.Now.ToString("HH:mm:ss");
        LogEntries.Add($"[{timestamp}] {message}");
    }

    [RelayCommand]
    private void ClearLog()
    {
        LogEntries.Clear();
        AddLog("[Console] Log cleared");
    }
}
