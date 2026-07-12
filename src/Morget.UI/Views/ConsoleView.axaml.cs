using Avalonia.Controls;
using Avalonia.ReactiveUI;
using Morget.UI.ViewModels;

namespace Morget.UI.Views;

public partial class ConsoleView : ReactiveUserControl<ConsoleViewModel>
{
    public ConsoleView()
    {
        InitializeComponent();
    }
}
