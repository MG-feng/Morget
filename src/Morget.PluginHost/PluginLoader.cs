using System;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;
using Morget.PluginAPI;

namespace Morget.PluginHost;

public static class PluginLoader
{
    public static async Task<IPlugin?> LoadNativeAsync(string assemblyPath)
    {
        if (!File.Exists(assemblyPath)) return null;

        await Task.Yield();

        try
        {
            var asm = Assembly.LoadFrom(Path.GetFullPath(assemblyPath));
            foreach (var type in asm.GetTypes())
            {
                if (typeof(IPlugin).IsAssignableFrom(type) && !type.IsInterface && !type.IsAbstract)
                {
                    return (IPlugin?)Activator.CreateInstance(type);
                }
            }
        }
        catch (ReflectionTypeLoadException) { }
        return null;
    }
}
