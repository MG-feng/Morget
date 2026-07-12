using System.Collections.Generic;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Shapes;
using Avalonia.Media;
using Avalonia.ReactiveUI;
using Morget.Flow.Nodes;

namespace Morget.UI.Controls;

public partial class NodeCanvas : ReactiveUserControl<NodeCanvas>
{
    public static readonly DirectProperty<NodeCanvas, IEnumerable<NodeBase>> NodesProperty =
        AvaloniaProperty.RegisterDirect<NodeCanvas, IEnumerable<NodeBase>>(
            nameof(Nodes),
            o => o.Nodes,
            (o, v) => o.Nodes = v);

    private IEnumerable<NodeBase> _nodes = new List<NodeBase>();

    public IEnumerable<NodeBase> Nodes
    {
        get => _nodes;
        set
        {
            SetAndRaise(NodesProperty, ref _nodes, value);
            RenderNodes();
        }
    }

    public NodeCanvas()
    {
        InitializeComponent();
    }

    private void RenderNodes()
    {
        CanvasHost.Children.Clear();
        foreach (var node in _nodes)
        {
            var border = new Border
            {
                Width = 140,
                Height = 80,
                Background = new SolidColorBrush(Color.Parse("#2d2d2d")),
                BorderBrush = new SolidColorBrush(Color.Parse("#3d3d3d")),
                BorderThickness = new Thickness(1),
                CornerRadius = new CornerRadius(6),
                [Canvas.LeftProperty] = node.X,
                [Canvas.TopProperty] = node.Y
            };

            var tb = new TextBlock
            {
                Text = node.Name,
                Foreground = Brushes.White,
                HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
                VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center
            };

            border.Child = tb;
            CanvasHost.Children.Add(border);
        }
    }
}
