namespace Morget.Flow.Nodes;

public sealed class FileNode : NodeBase
{
    public FileNode()
    {
        Name = "File";
        DefineInput("flow", "flow");
        DefineInput("path", "string");
        DefineInput("content", "string");
        DefineInput("operation", "string", "read");
        DefineOutput("flow", "flow");
        DefineOutput("result", "string");
    }

    public override async Task ExecuteAsync(FlowContext context)
    {
        var path = Inputs["path"].Value?.ToString() ?? "";
        var op = Inputs["operation"].Value?.ToString()?.ToLowerInvariant() ?? "read";
        var content = Inputs["content"].Value?.ToString() ?? "";

        try
        {
            switch (op)
            {
                case "write":
                    await File.WriteAllTextAsync(path, content, context.CancellationToken);
                    Outputs["result"].Value = "written";
                    break;
                case "append":
                    await File.AppendAllTextAsync(path, content, context.CancellationToken);
                    Outputs["result"].Value = "appended";
                    break;
                default:
                    Outputs["result"].Value = await File.ReadAllTextAsync(path, context.CancellationToken);
                    break;
            }
        }
        catch (Exception ex)
        {
            Outputs["result"].Value = $"error: {ex.Message}";
            context.Logger.Error($"File error: {ex.Message}");
        }
    }
}
