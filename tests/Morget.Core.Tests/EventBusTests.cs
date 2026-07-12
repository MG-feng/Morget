using System.Threading.Tasks;
using Morget.Core.Events;
using Xunit;

namespace Morget.Core.Tests;

public class EventBusTests
{
    [Fact]
    public void SubscribeAndPublish_Works()
    {
        var bus = new EventBus();
        string? received = null;
        using var sub = bus.Subscribe<TestEvent>(e => received = e.Message);

        bus.Publish(new TestEvent("hello"));
        Assert.Equal("hello", received);
    }

    [Fact]
    public void Unsubscribe_StopsReceiving()
    {
        var bus = new EventBus();
        string? received = null;
        var sub = bus.Subscribe<TestEvent>(e => received = e.Message);
        sub.Dispose();

        bus.Publish(new TestEvent("hello"));
        Assert.Null(received);
    }

    [Fact]
    public async Task AsyncHandler_Works()
    {
        var bus = new EventBus();
        string? received = null;
        using var sub = bus.SubscribeAsync<TestEvent>(async e =>
        {
            await Task.Delay(10);
            received = e.Message;
        });

        bus.Publish(new TestEvent("async"));
        await Task.Delay(100);
        Assert.Equal("async", received);
    }

    private record TestEvent(string Message) : IEvent;
}
