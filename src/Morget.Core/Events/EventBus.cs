using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Serilog;

namespace Morget.Core.Events;

public sealed class EventBus : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<EventBus>();
    private readonly ConcurrentDictionary<Type, List<Delegate>> _handlers = new();
    private readonly ConcurrentDictionary<Type, List<Delegate>> _asyncHandlers = new();
    private bool _disposed;

    public IDisposable Subscribe<T>(Action<T> handler) where T : IEvent
    {
        ArgumentNullException.ThrowIfNull(handler);
        if (_disposed) throw new ObjectDisposedException(nameof(EventBus));

        var type = typeof(T);
        var wrapped = (Action<IEvent>)(e => handler((T)e));

        _handlers.AddOrUpdate(type,
            _ => new List<Delegate> { wrapped },
            (_, list) => { lock (list) { list.Add(wrapped); } return list; });

        return new SubscriptionToken(() => Unsubscribe(type, wrapped));
    }

    public IDisposable SubscribeAsync<T>(Func<T, Task> handler) where T : IEvent
    {
        ArgumentNullException.ThrowIfNull(handler);
        if (_disposed) throw new ObjectDisposedException(nameof(EventBus));

        var type = typeof(T);
        var wrapped = (Func<IEvent, Task>)(e => handler((T)e));

        _asyncHandlers.AddOrUpdate(type,
            _ => new List<Delegate> { wrapped },
            (_, list) => { lock (list) { list.Add(wrapped); } return list; });

        return new SubscriptionToken(() => UnsubscribeAsync(type, wrapped));
    }

    public void Publish<T>(T eventData) where T : IEvent
    {
        if (_disposed) throw new ObjectDisposedException(nameof(EventBus));
        var type = typeof(T);

        if (_handlers.TryGetValue(type, out var handlers))
        {
            List<Delegate> snapshot;
            lock (handlers) { snapshot = handlers.ToList(); }
            foreach (var h in snapshot)
            {
                try { ((Action<IEvent>)h)(eventData); }
                catch (Exception ex) { _logger.Error(ex, "Sync handler error for {Event}", type.Name); }
            }
        }

        if (_asyncHandlers.TryGetValue(type, out var asyncHandlers))
        {
            List<Delegate> snapshot;
            lock (asyncHandlers) { snapshot = asyncHandlers.ToList(); }
            foreach (var h in snapshot)
            {
                var handler = (Func<IEvent, Task>)h;
                try 
                { 
                    handler(eventData).ContinueWith(t => 
                    {
                        if (t.IsFaulted) _logger.Error(t.Exception, "Async handler error for {Event}", type.Name);
                    }, TaskContinuationOptions.OnlyOnFaulted);
                }
                catch (Exception ex) { _logger.Error(ex, "Async handler dispatch error for {Event}", type.Name); }
            }
        }
    }

    private void Unsubscribe(Type type, Delegate handler)
    {
        if (_handlers.TryGetValue(type, out var list))
        {
            lock (list) { list.Remove(handler); }
        }
    }

    private void UnsubscribeAsync(Type type, Delegate handler)
    {
        if (_asyncHandlers.TryGetValue(type, out var list))
        {
            lock (list) { list.Remove(handler); }
        }
    }

    public void ClearAll()
    {
        _handlers.Clear();
        _asyncHandlers.Clear();
        _logger.Debug("All event handlers cleared");
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        ClearAll();
    }

    private sealed class SubscriptionToken : IDisposable
    {
        private readonly Action _unsubscribe;
        private bool _disposed;

        public SubscriptionToken(Action unsubscribe) => _unsubscribe = unsubscribe;

        public void Dispose()
        {
            if (_disposed) return;
            _disposed = true;
            _unsubscribe();
        }
    }
}
