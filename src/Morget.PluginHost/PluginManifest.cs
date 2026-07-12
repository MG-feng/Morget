using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Morget.PluginHost;

public sealed class PluginManifest
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("version")]
    public string Version { get; set; } = "0.0.0";

    [JsonPropertyName("author")]
    public string Author { get; set; } = "";

    [JsonPropertyName("entry")]
    public string Entry { get; set; } = "main.lua";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("license")]
    public string License { get; set; } = "";

    [JsonPropertyName("category")]
    public string Category { get; set; } = "Uncategorized";

    [JsonPropertyName("repository")]
    public string Repository { get; set; } = "";

    [JsonPropertyName("permissions")]
    public List<string> Permissions { get; set; } = new();

    [JsonPropertyName("is_official")]
    public bool IsOfficial { get; set; }

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = "";

    [JsonPropertyName("min_api_version")]
    public string MinApiVersion { get; set; } = "2.0.0";

    [JsonPropertyName("dependencies")]
    public List<string> Dependencies { get; set; } = new();
}
