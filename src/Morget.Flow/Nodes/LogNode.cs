namespace Morget.Flow.Nodes;

public sealed class LogNode : NodeBase
{
    public LogNode()
    {
        Name = "Log";
        DefineInput("flow", "flow");
        DefineInput("message", "string", "Hello Flow");
        DefineOutput("flow", "flow");
    }

    public override Task ExecuteAsync(FlowContext context)
    {
        var msg = Inputs["message"].Value?.ToString() ?? "";
        context.Logger.Info(msg);
        return Task.CompletedTask;
    }
}
