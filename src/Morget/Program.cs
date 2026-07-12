using System;
using System.Windows.Forms;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;

namespace Morget;

class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        try
        {
            Console.WriteLine("[Morget v2.0] Starting...");

            var app = new Morget.Core.Application();
            Console.WriteLine("[Morget] Application initialized");

            var pluginManager = new PluginManager();
            pluginManager.Initialize();
            Console.WriteLine("[Morget] PluginManager initialized");

            BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Fatal error: {ex.Message}\n\n{ex.StackTrace}",
                "Morget Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Environment.ExitCode = 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .LogToTrace();
}
