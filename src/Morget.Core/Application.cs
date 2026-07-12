using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Morget.Core.Events;
using Morget.Core.Settings;
using Morget.Core.Workspace;
using Serilog;

namespace Morget.Core;

public sealed class Application : IDisposable
{
    private static Application? _instance;
    private readonly CancellationTokenSource _cts = new();
    private bool _disposed;

    public static Application Instance => _instance ?? throw new InvalidOperationException("Application not initialized");

    public ILogger Logger { get; }
    public SettingsManager Settings { get; }
    public WorkspaceManager Workspace { get; }
    public EventBus Events { get; }

    public Application(string? appDataDir = null)
    {
        if (_instance != null)
            throw new InvalidOperationException("Application already initialized");

        _instance = this;

        var baseDir = appDataDir ?? GetDefaultAppDataDir();
        Directory.CreateDirectory(baseDir);

        var logDir = Path.Combine(baseDir, "Logs");
        Directory.CreateDirectory(logDir);
        var logFile = Path.Combine(logDir, $"morget-{DateTime.Now:yyyy-MM-dd}.log");

        Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console()
            .WriteTo.File(logFile, rollingInterval: RollingInterval.Day)
            .CreateLogger();

        Logger.Information("=== Morget v2.0 Starting ===");
        Logger.Information("Log file: {LogFile}", logFile);

        Events = new EventBus();

        var settingsPath = Path.Combine(baseDir, "settings.json");
        Settings = new SettingsManager(settingsPath);
        Logger.Information("Settings loaded from: {SettingsPath}", Settings.SettingsPath);

        var workspaceDir = Path.Combine(baseDir, "Workspaces");
        Workspace = new WorkspaceManager(workspaceDir);
        Logger.Information("Workspace directory: {WorkspaceDir}", workspaceDir);

        Logger.Information("Application initialized successfully");
    }

    private static string GetDefaultAppDataDir()
    {
        var baseDir = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        return Path.Combine(baseDir, "Morget");
    }

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        Logger.Information("Application running...");
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _cts.Token);

        try
        {
            while (!linked.Token.IsCancellationRequested)
            {
                await Task.Delay(100, linked.Token);
            }
        }
        catch (OperationCanceledException)
        {
            Logger.Information("Application shutdown requested");
        }
    }

    public void Shutdown()
    {
        Logger.Information("Shutting down...");
        _cts.Cancel();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        Logger.Information("Application disposing...");
        Workspace?.Dispose();
        Settings?.Dispose();
        Events?.Dispose();
        _cts?.Dispose();
        Logger.Information("=== Morget Shutdown Complete ===");
        Log.CloseAndFlush();
        _instance = null;
    }
}
