using System.Collections.Generic;

namespace Morget.PluginAPI.Advanced;

public sealed class PluginContext : IPluginContext
{
    public string PluginId { get; }
    public string PluginPath { get; }
    public IReadOnlyDictionary<string, object> Metadata { get; }
    public IPluginHost Host { get; }

    public PluginContext(string id, string path, IReadOnlyDictionary<string, object> metadata, IPluginHost host)
    {
        PluginId = id;
        PluginPath = path;
        Metadata = metadata;
        Host = host;
    }
}

public interface IPluginContext
{
    string PluginId { get; }
    string PluginPath { get; }
    IReadOnlyDictionary<string, object> Metadata { get; }
    IPluginHost Host { get; }
}
