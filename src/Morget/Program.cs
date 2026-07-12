using System;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;

namespace Morget;

class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        Console.WriteLine("=======================================");
        Console.WriteLine("  Morget v2.0 - Plugin Platform");
        Console.WriteLine("=======================================");

        try
        {
            Console.WriteLine("[1/4] Creating Application...");
            var app = new Morget.Core.Application();
            Console.WriteLine("[2/4] Application created successfully");

            Console.WriteLine("[3/4] Initializing PluginManager...");
            var pluginManager = new PluginManager();
            pluginManager.Initialize();
            Console.WriteLine("[4/4] PluginManager initialized");

            Console.WriteLine();
            Console.WriteLine($"Workspace: {app.Workspace.Current?.Name ?? "(none)"}");
            Console.WriteLine($"Plugins: {pluginManager.Plugins.Count} installed");

            foreach (var plugin in pluginManager.Plugins.Values)
            {
                Console.WriteLine($"  - {plugin.Name} v{plugin.Version} [{plugin.Status}]");
            }

            Console.WriteLine();
            Console.WriteLine("Starting Avalonia UI...");
            Console.WriteLine();

            BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"FATAL ERROR: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            Environment.ExitCode = 1;
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .LogToTrace();
}
