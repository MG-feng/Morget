using CommunityToolkit.Mvvm.ComponentModel;

namespace Morget.ViewModels;

public partial class MainWindowViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _windowTitle = "Morget Platform";

    [ObservableProperty]
    private string _statusText = "准备就绪";
}
