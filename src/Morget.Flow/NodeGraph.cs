using System.Collections.Generic;
using Morget.Flow.Nodes;

namespace Morget.Flow;

public sealed class NodeGraph
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "Untitled";
    public List<NodeBase> Nodes { get; } = new();
    public List<Connection> Connections { get; } = new();

    public void Connect(string fromNodeId, string fromPort, string toNodeId, string toPort)
    {
        Connections.Add(new Connection(fromNodeId, fromPort, toNodeId, toPort));
    }
}

public sealed record Connection(string FromNodeId, string FromPort, string ToNodeId, string ToPort);
