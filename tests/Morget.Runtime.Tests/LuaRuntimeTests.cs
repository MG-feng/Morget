using Morget.Runtime;
using Xunit;

namespace Morget.Runtime.Tests;

public class LuaRuntimeTests
{
    [Fact]
    public void ExecuteString_ReturnsResult()
    {
        using var rt = new LuaRuntime();
        var result = rt.ExecuteString("return 1 + 1");
        Assert.Equal(2.0, result);
    }

    [Fact]
    public void MorgetAPI_Registered()
    {
        using var rt = new LuaRuntime();
        var result = rt.ExecuteString("return Morget.version");
        Assert.Equal("2.0.0", result);
    }

    [Fact]
    public void Sandbox_BlocksDangerousFunctions()
    {
        using var rt = new LuaRuntime();
        var result = rt.ExecuteString("return io == nil");
        Assert.Equal(true, result);
    }
}
