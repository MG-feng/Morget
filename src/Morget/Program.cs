using System;
using System.Threading.Tasks;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;

namespace Morget;

class Program
{
    [STAThread]
    public static void Main(string[] args)
    {
        Console.WriteLine("╔═══════════════════════════════════════╗");
        Console.WriteLine("║  Morget v2.0 - Plugin Platform       ║");
        Console.WriteLine("║  Copyright (c) 2026 Moonlight Games  ║");
        Console.WriteLine("╚═══════════════════════════════════════╝");

        try
        {
            using var app = new Application();
            var pluginManager = new PluginManager();
            pluginManager.Initialize();

            Console.WriteLine($"\n✅ Application initialized");
            Console.WriteLine($"   Workspace: {app.Workspace.Current?.Name ?? "(none)"}");
            Console.WriteLine($"   Plugins: {pluginManager.Plugins.Count} installed");

            foreach (var plugin in pluginManager.Plugins.Values)
            {
                Console.WriteLine($"   - {plugin.Name} v{plugin.Version} [{plugin.Status}]");
            }

            BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n❌ Fatal error: {ex.Message}");
            Console.WriteLine(ex.StackTrace);
            Environment.ExitCode = 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace();
}
