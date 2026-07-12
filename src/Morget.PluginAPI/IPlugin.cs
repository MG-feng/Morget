namespace Morget.PluginAPI;

using Morget.PluginAPI.Advanced;

public interface IPlugin
{
    string Id { get; }
    string Name { get; }
    string Version { get; }
    string Author { get; }
    void Initialize(IPluginContext context);
    void Shutdown();
}
