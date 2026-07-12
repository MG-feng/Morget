using Morget.Core.Events;

namespace Morget.PluginHost;

public sealed record PluginInstalledEvent(string Id, string Name) : IEvent;
public sealed record PluginUninstalledEvent(string Id, string Name) : IEvent;
public sealed record PluginLoadedEvent(string Id, string Name) : IEvent;
public sealed record PluginUnloadedEvent(string Id, string Name) : IEvent;
public sealed record PluginEnabledEvent(string Id, string Name) : IEvent;
public sealed record PluginDisabledEvent(string Id, string Name) : IEvent;
public sealed record PluginErrorEvent(string Id, string Name, string Error) : IEvent;
public sealed record PluginUpdateAvailableEvent(string Id, string Name, string NewVersion) : IEvent;
