using System;
using System.Runtime.InteropServices;
using Avalonia;
using Morget.Core;
using Morget.PluginHost;
using Morget.UI;

namespace Morget;

class Program
{
    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AllocConsole();

    [STAThread]
    public static void Main(string[] args)
    {
        // 强制分配控制台窗口
        AllocConsole();
        
        Console.WriteLine("===========================================");
        Console.WriteLine("[Morget v2.0] Starting...");
        Console.WriteLine($"[Morget] Time: {DateTime.Now}");
        Console.WriteLine($"[Morget] OS Version: {Environment.OSVersion}");
        Console.WriteLine($"[Morget] .NET Version: {Environment.Version}");
        Console.WriteLine("===========================================");

        try
        {
            Console.WriteLine("[Morget] Initializing Application core...");
            var app = new Morget.Core.Application();
            Console.WriteLine("[Morget] Application initialized successfully");

            Console.WriteLine("[Morget] Initializing PluginManager...");
            var pluginManager = new PluginManager();
            pluginManager.Initialize();
            Console.WriteLine("[Morget] PluginManager initialized successfully");

            Console.WriteLine("[Morget] Starting Avalonia UI...");
            BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
            
            Console.WriteLine("[Morget] Application exited normally");
        }
        catch (Exception ex)
        {
            Console.WriteLine("===========================================");
            Console.WriteLine($"[FATAL ERROR] {ex.GetType().Name}: {ex.Message}");
            Console.WriteLine($"[Stack Trace] {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[Inner Exception] {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
                Console.WriteLine(ex.InnerException.StackTrace);
            }
            Console.WriteLine("===========================================");
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
            Environment.ExitCode = 1;
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<UI.App>()
            .UsePlatformDetect()
            .LogToTrace();
}
