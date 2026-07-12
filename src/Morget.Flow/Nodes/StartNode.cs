namespace Morget.Flow.Nodes;

public sealed class StartNode : NodeBase
{
    public StartNode()
    {
        Name = "Start";
        DefineOutput("flow", "flow");
        DefineOutput("timestamp", "number");
    }

    public override Task ExecuteAsync(FlowContext context)
    {
        Outputs["timestamp"].Value = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        return Task.CompletedTask;
    }
}
