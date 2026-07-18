using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Markup.Xaml;
using Serilog;

namespace Morget;

public partial class App : Application
{
    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            // 检查是否是首次启动
            var settingsPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
                "Morget", "settings.json");

            var isFirstLaunch = !File.Exists(settingsPath);

            if (isFirstLaunch)
            {
                Log.Information("[UI] First launch detected - showing Setup Wizard");
                desktop.MainWindow = new Views.SetupWizardWindow();
            }
            else
            {
                Log.Information("[UI] Normal startup - showing Main Window");
                desktop.MainWindow = new Views.MainWindow();
            }
        }

        base.OnFrameworkInitializationCompleted();
    }
}
