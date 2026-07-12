using Serilog;

namespace Morget.Core.Logging;

public static class LogManager
{
    public static ILogger For<T>() => Log.ForContext<T>();
    public static ILogger For(string name) => Log.ForContext("SourceContext", name);
}
