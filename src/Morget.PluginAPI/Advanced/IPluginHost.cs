using System.Threading.Tasks;

namespace Morget.PluginAPI.Advanced;

public interface IPluginHost
{
    string PluginId { get; }
    T? GetService<T>() where T : class;
    void PublishEvent<T>(T eventData) where T : class;
    Task<bool> RequestPermissionAsync(string permission);
}
