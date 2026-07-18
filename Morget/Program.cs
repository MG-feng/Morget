using System;
using System.IO;
using System.Runtime.InteropServices;
using Avalonia;
using Avalonia.ReactiveUI;
using Serilog;
using Serilog.Events;

namespace Morget;

class Program
{
    // Windows: 分配控制台
    [DllImport("kernel32.dll")]
    private static extern bool AllocConsole();

    [DllImport("kernel32.dll")]
    private static extern bool FreeConsole();

    [DllImport("kernel32.dll")]
    private static extern IntPtr GetConsoleWindow();

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    private const int SW_HIDE = 0;
    private const int SW_SHOW = 5;

    [STAThread]
    public static int Main(string[] args)
    {
        // ============================================================
        // 1. 分配并显示控制台（始终可见，类似 Minecraft）
        // ============================================================
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            AllocConsole();
            var consoleHandle = GetConsoleWindow();
            if (consoleHandle != IntPtr.Zero)
            {
                ShowWindow(consoleHandle, SW_SHOW);
            }
        }

        // ============================================================
        // 2. 配置日志（输出到控制台 + 文件）
        // ============================================================
        var logPath = Path.Combine("Logs", "Morget_.log");
        try
        {
            Directory.CreateDirectory("Logs");
        }
        catch { }

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console(
                outputTemplate: "[{Timestamp:HH:mm:ss}] [{Level:u3}] {Message:lj}{NewLine}{Exception}")
            .WriteTo.File(logPath,
                outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss}] [{Level:u3}] {Message:lj}{NewLine}{Exception}",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 7)
            .CreateLogger();

        try
        {
            Log.Information("╔════════════════════════════════════════════════════════════╗");
            Log.Information("║                    Morget Platform                        ║");
            Log.Information("║         An Open Platform for Games, Developers            ║");
            Log.Information("║                  and Creators                            ║");
            Log.Information("╠════════════════════════════════════════════════════════════╣");
            Log.Information("║  Version: 2.0                                            ║");
            Log.Information("║  Runtime: .NET 10.0                                     ║");
            Log.Information($"║  OS:      {RuntimeInformation.OSDescription,-35}║");
            Log.Information($"║  Arch:    {RuntimeInformation.ProcessArchitecture,-35}║");
            Log.Information("╚════════════════════════════════════════════════════════════╝");
            Log.Information("");

            Log.Information("[Core] Initializing Morget Core...");

            // ============================================================
            // 3. 启动 Avalonia GUI
            // ============================================================
            Log.Information("[UI] Starting Avalonia UI...");
            return BuildAvaloniaApp()
                .StartWithClassicDesktopLifetime(args);
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "[Core] Fatal error during application startup");
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("╔════════════════════════════════════════════════════════════╗");
            Console.WriteLine("║                    FATAL ERROR                            ║");
            Console.WriteLine("╠════════════════════════════════════════════════════════════╣");
            Console.WriteLine($"║  {ex.Message,-50} ║");
            Console.WriteLine("╚════════════════════════════════════════════════════════════╝");
            Console.ResetColor();
            return 1;
        }
        finally
        {
            Log.CloseAndFlush();

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                Console.WriteLine("");
                Console.WriteLine("Press any key to exit...");
                Console.ReadKey();
                FreeConsole();
            }
        }
    }

    public static AppBuilder BuildAvaloniaApp()
        => AppBuilder.Configure<App>()
            .UsePlatformDetect()
            .WithInterFont()
            .LogToTrace()
            .UseReactiveUI();
}
