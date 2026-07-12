using System.IO;
using Morget.Runtime;
using Xunit;

namespace Morget.Runtime.Tests;

public class SandboxTests
{
    [Fact]
    public void IsPathAllowed_Works()
    {
        var path = Path.GetTempPath();
        Sandbox.AllowPath(path);
        Assert.True(Sandbox.IsPathAllowed(Path.Combine(path, "sub", "file.txt")));
        Assert.False(Sandbox.IsPathAllowed("C:\\Windows\\System32"));
    }

    [Fact]
    public void IsModuleAllowed_BasicModules()
    {
        Assert.True(Sandbox.IsModuleAllowed("table"));
        Assert.True(Sandbox.IsModuleAllowed("os.date"));
        Assert.False(Sandbox.IsModuleAllowed("os.execute"));
        Assert.False(Sandbox.IsModuleAllowed("io"));
    }
}
