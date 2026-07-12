using System;
using System.Threading.Tasks;
using Morget.PluginAPI;
using Morget.PluginAPI.Advanced;

namespace Morget.PluginHost;

public sealed class MGPHost : IPluginHost, IDisposable
{
    private readonly IPlugin _plugin;
    private bool _disposed;

    public string PluginId => _plugin.Id;

    public MGPHost(IPlugin plugin)
    {
        _plugin = plugin ?? throw new ArgumentNullException(nameof(plugin));
    }

    public void Initialize(PluginContext context)
    {
        _plugin.Initialize(context);
    }

    public T? GetService<T>() where T : class => null;

    public void PublishEvent<T>(T eventData) where T : class
    {
    }

    public Task<bool> RequestPermissionAsync(string permission) => Task.FromResult(true);

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _plugin.Shutdown();
    }
}
