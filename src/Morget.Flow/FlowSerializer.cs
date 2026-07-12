using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using Morget.Flow.Nodes;

namespace Morget.Flow;

public static class FlowSerializer
{
    private static readonly JsonSerializerOptions _options = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static void SaveToFile(NodeGraph graph, string path)
    {
        var dto = new FlowDto
        {
            Id = graph.Id,
            Name = graph.Name,
            Nodes = graph.Nodes.Select(n => new NodeDto
            {
                Id = n.Id,
                Type = n.GetType().Name,
                Name = n.Name,
                X = n.X,
                Y = n.Y,
                Properties = n.Properties
            }).ToList(),
            Connections = graph.Connections.Select(c => new ConnectionDto
            {
                From = c.FromNodeId,
                FromPort = c.FromPort,
                To = c.ToNodeId,
                ToPort = c.ToPort
            }).ToList()
        };

        var json = JsonSerializer.Serialize(dto, _options);
        File.WriteAllText(path, json);
    }

    public static NodeGraph LoadFromFile(string path)
    {
        var json = File.ReadAllText(path);
        var dto = JsonSerializer.Deserialize<FlowDto>(json, _options) ?? new FlowDto();

        var graph = new NodeGraph { Id = dto.Id, Name = dto.Name };

        foreach (var n in dto.Nodes)
        {
            NodeBase? node = n.Type switch
            {
                "StartNode" => new StartNode(),
                "EndNode" => new EndNode(),
                "LogNode" => new LogNode(),
                "HttpNode" => new HttpNode(),
                "FileNode" => new FileNode(),
                _ => null
            };

            if (node != null)
            {
                node.Id = n.Id;
                node.Name = n.Name;
                node.X = n.X;
                node.Y = n.Y;
                node.Properties = n.Properties ?? new Dictionary<string, object?>();
                graph.Nodes.Add(node);
            }
        }

        foreach (var c in dto.Connections)
        {
            graph.Connect(c.From, c.FromPort, c.To, c.ToPort);
        }

        return graph;
    }

    private sealed class FlowDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public List<NodeDto> Nodes { get; set; } = new();
        public List<ConnectionDto> Connections { get; set; } = new();
    }

    private sealed class NodeDto
    {
        public string Id { get; set; } = "";
        public string Type { get; set; } = "";
        public string Name { get; set; } = "";
        public double X { get; set; }
        public double Y { get; set; }
        public Dictionary<string, object?> Properties { get; set; } = new();
    }

    private sealed class ConnectionDto
    {
        public string From { get; set; } = "";
        public string FromPort { get; set; } = "";
        public string To { get; set; } = "";
        public string ToPort { get; set; } = "";
    }
}
