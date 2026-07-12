using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Morget.Flow.Nodes;

public abstract class NodeBase
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Category { get; set; } = "General";
    public double X { get; set; }
    public double Y { get; set; }

    [JsonIgnore]
    public Dictionary<string, Port> Inputs { get; } = new();

    [JsonIgnore]
    public Dictionary<string, Port> Outputs { get; } = new();

    [JsonIgnore]
    public Dictionary<string, object?> Properties { get; set; } = new();

    public abstract Task ExecuteAsync(FlowContext context);

    protected Port DefineInput(string key, string type, object? defaultValue = null)
    {
        var port = new Port(key, type, defaultValue);
        Inputs[key] = port;
        return port;
    }

    protected Port DefineOutput(string key, string type)
    {
        var port = new Port(key, type, null);
        Outputs[key] = port;
        return port;
    }
}

public sealed class Port
{
    public string Key { get; }
    public string Type { get; }
    public object? Value { get; set; }
    public string? ConnectedNodeId { get; set; }
    public string? ConnectedPortKey { get; set; }

    public Port(string key, string type, object? value)
    {
        Key = key;
        Type = type;
        Value = value;
    }
}

public sealed class FlowContext
{
    public Dictionary<string, object?> Variables { get; } = new();
    public ILoggerProxy Logger { get; }
    public CancellationToken CancellationToken { get; }

    public FlowContext(ILoggerProxy logger, CancellationToken ct)
    {
        Logger = logger;
        CancellationToken = ct;
    }
}

public interface ILoggerProxy
{
    void Info(string message);
    void Error(string message);
}
