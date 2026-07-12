using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Morget.Flow.Nodes;
using Serilog;

namespace Morget.Flow;

public sealed class FlowEngine
{
    private readonly ILogger _logger = Log.ForContext<FlowEngine>();

    public async Task ExecuteAsync(NodeGraph graph, CancellationToken ct = default)
    {
        var context = new FlowContext(new LoggerProxy(_logger), ct);
        var executed = new HashSet<string>();
        var queue = new Queue<NodeBase>();

        var start = graph.Nodes.OfType<StartNode>().FirstOrDefault();
        if (start == null)
        {
            _logger.Error("No StartNode found in graph");
            return;
        }

        queue.Enqueue(start);

        while (queue.Count > 0 && !ct.IsCancellationRequested)
        {
            var node = queue.Dequeue();
            if (!executed.Add(node.Id)) continue;

            try
            {
                await node.ExecuteAsync(context);
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Node execution failed: {Node}", node.Name);
                continue;
            }

            foreach (var conn in graph.Connections.Where(c => c.FromNodeId == node.Id))
            {
                var target = graph.Nodes.FirstOrDefault(n => n.Id == conn.ToNodeId);
                if (target == null) continue;

                if (node.Outputs.TryGetValue(conn.FromPort, out var outPort) &&
                    target.Inputs.TryGetValue(conn.ToPort, out var inPort))
                {
                    inPort.Value = outPort.Value;
                }

                if (CanExecute(target, executed))
                    queue.Enqueue(target);
            }
        }
    }

    private static bool CanExecute(NodeBase node, HashSet<string> executed)
    {
        return true;
    }

    private sealed class LoggerProxy : ILoggerProxy
    {
        private readonly ILogger _logger;
        public LoggerProxy(ILogger logger) => _logger = logger;
        public void Info(string message) => _logger.Information(message);
        public void Error(string message) => _logger.Error(message);
    }
}
