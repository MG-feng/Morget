using System;
using MoonSharp.Interpreter;
using Morget.Runtime;
using Serilog;

namespace Morget.Debugger;

/// <summary>
/// Lua 调试器 - 最小实现（MoonSharp 2.0 IDebugger 接口差异过大，暂用桩实现）
/// </summary>
public sealed class LuaDebugger : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<LuaDebugger>();
    private readonly LuaRuntime _runtime;
    private readonly BreakpointManager _breakpoints;
    private bool _attached;

    public LuaDebugger(LuaRuntime runtime)
    {
        _runtime = runtime;
        _breakpoints = new BreakpointManager();
    }

    public void Attach()
    {
        if (_attached) return;
        _attached = true;
        _logger.Debug("Debugger attached (stub - MoonSharp 2.0 IDebugger not fully compatible)");
    }

    public void Detach()
    {
        if (!_attached) return;
        _attached = false;
    }

    public void SetBreakpoint(int line, string? source = null) => _breakpoints.Toggle(line, source);
    public void ClearBreakpoints() => _breakpoints.ClearAll();

    public void Dispose() => Detach();
}
