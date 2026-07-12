using Avalonia.Controls;
using Avalonia.ReactiveUI;

namespace Morget.UI.Views;

public partial class DashboardView : ReactiveUserControl<ViewModels.DashboardViewModel>
{
    public DashboardView()
    {
        InitializeComponent();
    }
}
