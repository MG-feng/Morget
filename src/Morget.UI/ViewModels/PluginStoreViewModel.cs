using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Morget.Store;

namespace Morget.UI.ViewModels;

public sealed partial class PluginStoreViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _searchQuery = "";

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private ObservableCollection<GitHubPluginInfo> _plugins = new();

    private readonly GitHubStore _store = new();

    public PluginStoreViewModel()
    {
        _ = LoadAsync();
    }

    [RelayCommand]
    private async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            var results = await _store.SearchPluginsAsync(SearchQuery);
            Plugins.Clear();
            foreach (var p in results)
                Plugins.Add(p);
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task InstallAsync(GitHubPluginInfo plugin)
    {
        await Task.Delay(500);
    }
}
