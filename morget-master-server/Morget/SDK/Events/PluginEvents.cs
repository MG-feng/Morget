using System.Collections.Generic;

namespace Morget.SDK.Events;

public class PluginInstalledEvent : IEvent
{
    public string PluginId { get; }
    public string PluginName { get; }
    public PluginInstalledEvent(string id, string name) { PluginId = id; PluginName = name; }
}

public class PluginUninstalledEvent : IEvent
{
    public string PluginId { get; }
    public string PluginName { get; }
    public PluginUninstalledEvent(string id, string name) { PluginId = id; PluginName = name; }
}

public class PluginEnabledEvent : IEvent
{
    public string PluginId { get; }
    public string PluginName { get; }
    public PluginEnabledEvent(string id, string name) { PluginId = id; PluginName = name; }
}

public class PluginDisabledEvent : IEvent
{
    public string PluginId { get; }
    public string PluginName { get; }
    public PluginDisabledEvent(string id, string name) { PluginId = id; PluginName = name; }
}

public class PluginUpdatedEvent : IEvent
{
    public string PluginId { get; }
    public string PluginName { get; }
    public string NewVersion { get; }
    public PluginUpdatedEvent(string id, string name, string version)
    {
        PluginId = id; PluginName = name; NewVersion = version;
    }
}

public class PluginUpdateCheckEvent : IEvent
{
    public string PluginId { get; }
    public PluginUpdateCheckEvent(string id) => PluginId = id;
}

public class PluginUpdateAvailableEvent : IEvent
{
    public string PluginId { get; }
    public string NewVersion { get; }
    public PluginUpdateAvailableEvent(string id, string version) { PluginId = id; NewVersion = version; }
}

// 【新增】危险权限请求事件（供 UI 层订阅以显示确认对话框）
public class DangerousPermissionRequestEvent : IEvent
{
    public string PluginId { get; }
    public string PluginName { get; }
    public List<string> Permissions { get; }

    public DangerousPermissionRequestEvent(string id, string name, List<string> permissions)
    {
        PluginId = id;
        PluginName = name;
        Permissions = permissions;
    }
}
