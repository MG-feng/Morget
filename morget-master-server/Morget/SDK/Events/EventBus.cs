using System;
using System.Collections.Generic;
using System.Linq;
using Godot;

namespace Morget.SDK.Events;

public interface IEvent { }

public class EventBus
{
    private class HandlerEntry
    {
        public Type EventType { get; set; }
        public WeakReference TargetRef { get; set; } 
        public Delegate Handler { get; set; }
    }

    private readonly List<HandlerEntry> _entries = new();
    private readonly object _lock = new();

    public void Subscribe<T>(Action<T> handler) where T : IEvent
    {
        object target = handler.Target;
        lock (_lock)
        {
            CleanupDeadHandlers();
            _entries.Add(new HandlerEntry
            {
                EventType = typeof(T),
                TargetRef = target != null ? new WeakReference(target) : null,
                Handler = handler
            });
        }
    }

    public void Unsubscribe<T>(Action<T> handler) where T : IEvent
    {
        lock (_lock)
        {
            _entries.RemoveAll(e => e.EventType == typeof(T) && e.Handler == handler);
        }
    }

    public void Publish<T>(T eventData) where T : IEvent
    {
        lock (_lock)
        {
            var dead = new List<HandlerEntry>();
            foreach (var entry in _entries.Where(e => e.EventType == typeof(T)).ToList())
            {
                if (entry.TargetRef != null && !entry.TargetRef.IsAlive)
                {
                    dead.Add(entry);
                    continue;
                }

                try
                {
                    if (entry.Handler is Action<T> action)
                        action(eventData);
                }
                catch (Exception ex)
                {
                    GD.PrintErr($"[EventBus] Handler error for {typeof(T).Name}: {ex.Message}");
                }
            }

            foreach (var d in dead)
                _entries.Remove(d);
        }
    }

    public void ClearAll()
    {
        lock (_lock) { _entries.Clear(); }
    }

    private void CleanupDeadHandlers()
    {
        _entries.RemoveAll(e => e.TargetRef != null && !e.TargetRef.IsAlive);
    }
}
