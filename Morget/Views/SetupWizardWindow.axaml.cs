using Avalonia.Controls;
using Morget.ViewModels;

namespace Morget.Views;

public partial class SetupWizardWindow : Window
{
    public SetupWizardWindow()
    {
        InitializeComponent();
        DataContext = new SetupWizardViewModel();
    }
}
