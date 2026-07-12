namespace Morget.Flow.Nodes;

public sealed class EndNode : NodeBase
{
    public EndNode()
    {
        Name = "End";
        DefineInput("flow", "flow");
        DefineInput("result", "any");
    }

    public override Task ExecuteAsync(FlowContext context)
    {
        context.Logger.Info("Flow ended with result: " + Inputs["result"].Value);
        return Task.CompletedTask;
    }
}
