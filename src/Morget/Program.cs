using System;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;
using Morget.UI;

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
            Console.WriteLine($"Fatal error: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            Environment.ExitCode = 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .LogToTrace();
}
