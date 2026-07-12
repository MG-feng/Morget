using System.Collections.ObjectModel;
using System.Linq;
using CommunityToolkit.Mvvm.ComponentModel;
using Morget.Core;
using Morget.PluginHost;

namespace Morget.UI.ViewModels;

public sealed partial class DashboardViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _workspaceName = "No workspace";

    [ObservableProperty]
    private int _pluginCount;

    [ObservableProperty]
    private int _enabledPluginCount;

    [ObservableProperty]
    private ObservableCollection<PluginInfoViewModel> _plugins = new();

    public DashboardViewModel()
    {
        Refresh();
    }

    private void Refresh()
    {
        try
        {
            var app = Application.Instance;
            WorkspaceName = app.Workspace.Current?.Name ?? "No workspace";

            if (app is null) return;

            PluginCount = 0;
            EnabledPluginCount = 0;
        }
        catch { }
    }
}

public sealed partial class PluginInfoViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _id = "";

    [ObservableProperty]
    private string _name = "";

    [ObservableProperty]
    private string _version = "";

    [ObservableProperty]
    private string _description = "";

    [ObservableProperty]
    private string _author = "";

    [ObservableProperty]
    private string _category = "";

    [ObservableProperty]
    private bool _isEnabled;

    [ObservableProperty]
    private string _statusColor = "#808080";
}
