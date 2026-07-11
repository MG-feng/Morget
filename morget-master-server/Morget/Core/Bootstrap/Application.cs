using Godot;
using Morget.Core.Log;
using Morget.Core.Plugin;
using Morget.Core.Settings;
using Morget.Core.Workspace;
using Morget.SDK.Events;

namespace Morget.Core.Bootstrap;

public partial class Application : Node
{
    private static Application _instance;

    [Obsolete("Use constructor injection instead. This Service Locator will be removed in v2.")]
    public static Application Instance => _instance;

    private LogManager _log;
    private SettingsManager _settings;
    private WorkspaceManager _workspace;
    private PluginManager _pluginManager;
    private EventBus _eventBus;

    public LogManager Log => _log;
    public SettingsManager Settings => _settings;
    public WorkspaceManager Workspace => _workspace;
    public PluginManager PluginManager => _pluginManager;
    public EventBus Events => _eventBus;

    public override void _Ready()
    {
        _instance = this;
        _log = new LogManager();
        _log.Info("Morget Application Starting...");
        _eventBus = new EventBus();
        _settings = new SettingsManager();
        _settings.Load();
        _workspace = new WorkspaceManager();
        _workspace.Initialize();
        _pluginManager = new PluginManager();
        _pluginManager.Initialize();

        var mainWindow = new Morget.UI.Windows.MainWindow();
        mainWindow.SetAnchorsPreset(Control.LayoutPreset.FullRect);
        AddChild(mainWindow);
        _log.Info("Morget Application Started.");
    }

    public override void _Notification(int what)
    {
        if (what == NotificationWMCloseRequest)
        {
            _log.Info("Application shutting down...");
            _workspace.SaveCurrent();
            _settings.Save();
            GetTree().Quit();
        }
    }
}
