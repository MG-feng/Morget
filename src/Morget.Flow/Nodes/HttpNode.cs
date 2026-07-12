using System.Net.Http;

namespace Morget.Flow.Nodes;

public sealed class HttpNode : NodeBase
{
    private static readonly HttpClient _client = new();

    public HttpNode()
    {
        Name = "HTTP Request";
        DefineInput("flow", "flow");
        DefineInput("url", "string", "https://api.github.com");
        DefineInput("method", "string", "GET");
        DefineOutput("flow", "flow");
        DefineOutput("status", "number");
        DefineOutput("body", "string");
    }

    public override async Task ExecuteAsync(FlowContext context)
    {
        var url = Inputs["url"].Value?.ToString() ?? "";
        var method = Inputs["method"].Value?.ToString() ?? "GET";

        try
        {
            using var request = new HttpRequestMessage(new HttpMethod(method), url);
            var response = await _client.SendAsync(request, context.CancellationToken);
            Outputs["status"].Value = (int)response.StatusCode;
            Outputs["body"].Value = await response.Content.ReadAsStringAsync(context.CancellationToken);
        }
        catch (Exception ex)
        {
            Outputs["status"].Value = 0;
            Outputs["body"].Value = ex.Message;
            context.Logger.Error($"HTTP error: {ex.Message}");
        }
    }
}
