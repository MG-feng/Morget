using System;
using System.Collections.Generic;

namespace Morget.Core.Workspace;

public sealed class WorkspaceData
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Name { get; set; } = "";
    public string Path { get; set; } = "";
    public DateTime LastOpened { get; set; } = DateTime.Now;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public Dictionary<string, object?> Metadata { get; set; } = new();
}
