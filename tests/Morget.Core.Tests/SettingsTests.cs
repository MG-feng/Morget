using System.IO;
using Morget.Core.Settings;
using Xunit;

namespace Morget.Core.Tests;

public class SettingsTests
{
    [Fact]
    public void GetSet_Works()
    {
        var path = Path.GetTempFileName();
        var settings = new SettingsManager(path);
        settings.Set("key", "value");
        Assert.Equal("value", settings.Get<string>("key"));
        settings.Dispose();
        File.Delete(path);
    }

    [Fact]
    public void JsonElement_UnpacksCorrectly()
    {
        var path = Path.GetTempFileName();
        File.WriteAllText(path, "{\"num\": 42, \"flag\": true, \"text\": \"hello\"}");
        var settings = new SettingsManager(path);
        Assert.Equal(42, settings.Get<int>("num"));
        Assert.True(settings.Get<bool>("flag"));
        Assert.Equal("hello", settings.Get<string>("text"));
        settings.Dispose();
        File.Delete(path);
    }
}
