using Avalonia.Controls;
using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class MainWindow : ReactiveWindow<ViewModels.MainWindowViewModel>
{
    public MainWindow()
    {
        InitializeComponent();
    }
}
