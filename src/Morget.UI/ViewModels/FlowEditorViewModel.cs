using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Morget.Flow;
using Morget.Flow.Nodes;

namespace Morget.UI.ViewModels;

public sealed partial class FlowEditorViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _flowName = "Untitled";

    [ObservableProperty]
    private ObservableCollection<NodeBase> _nodes = new();

    [ObservableProperty]
    private NodeBase? _selectedNode;

    public FlowEditorViewModel()
    {
        var graph = new NodeGraph();
        var start = new StartNode { X = 100, Y = 100 };
        var log = new LogNode { X = 300, Y = 100 };
        var end = new EndNode { X = 500, Y = 100 };

        graph.Nodes.Add(start);
        graph.Nodes.Add(log);
        graph.Nodes.Add(end);

        graph.Connect(start.Id, "flow", log.Id, "flow");
        graph.Connect(log.Id, "flow", end.Id, "flow");

        Nodes = new ObservableCollection<NodeBase>(graph.Nodes);
    }

    [RelayCommand]
    private void AddNode(string type)
    {
        NodeBase? node = type switch
        {
            "Log" => new LogNode(),
            "HTTP" => new HttpNode(),
            "File" => new FileNode(),
            _ => null
        };

        if (node != null)
        {
            node.X = 200 + Nodes.Count * 50;
            node.Y = 200 + Nodes.Count * 30;
            Nodes.Add(node);
        }
    }

    [RelayCommand]
    private async Task RunFlowAsync()
    {
        var graph = new NodeGraph { Name = FlowName };
        foreach (var n in Nodes) graph.Nodes.Add(n);
        var engine = new FlowEngine();
        await engine.ExecuteAsync(graph);
    }
}
