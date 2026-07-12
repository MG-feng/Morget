using System;
using System.Threading.Tasks;
using MoonSharp.Interpreter;
using MoonSharp.Interpreter.Debugging;
using Morget.Runtime;
using Serilog;

namespace Morget.Debugger;

public sealed class LuaDebugger : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<LuaDebugger>();
    private readonly LuaRuntime _runtime;
    private readonly BreakpointManager _breakpoints;
    private bool _attached;

    public event EventHandler<DebuggerAction>? OnBreak;

    public LuaDebugger(LuaRuntime runtime)
    {
        _runtime = runtime;
        _breakpoints = new BreakpointManager();
    }

    public void Attach()
    {
        if (_attached) return;
        var script = _runtime.GetInternalScript();

        script.AttachDebugger(new MorgetDebugger(_breakpoints, this));
        _attached = true;
        _logger.Debug("Debugger attached");
    }

    public void Detach()
    {
        if (!_attached) return;
        _attached = false;
    }

    public void SetBreakpoint(int line, string? source = null) => _breakpoints.Toggle(line, source);
    public void ClearBreakpoints() => _breakpoints.ClearAll();

    public void StepOver() => OnBreak?.Invoke(this, DebuggerAction.StepOver);
    public void StepIn() => OnBreak?.Invoke(this, DebuggerAction.StepIn);
    public void Continue() => OnBreak?.Invoke(this, DebuggerAction.Run);

    public void Dispose() => Detach();

    private sealed class MorgetDebugger : MoonSharp.Interpreter.Debugging.IDebugger
    {
        private readonly BreakpointManager _bp;
        private readonly LuaDebugger _owner;

        public MorgetDebugger(BreakpointManager bp, LuaDebugger owner)
        {
            _bp = bp;
            _owner = owner;
        }

        public DebuggerAction GetAction(int sourceCode, int sourceLine, string? sourceName)
        {
            if (_bp.IsBreakpoint(sourceLine, sourceName))
            {
                _owner._logger.Information("Breakpoint hit at {File}:{Line}", sourceName, sourceLine);
                return DebuggerAction.StepOver;
            }
            return DebuggerAction.Run;
        }

        public void SignalExecutionEnded() { }
        public bool IsPauseRequested() => false;
        public void SignalWillExecute(int sourceCode, int sourceLine, string? sourceName) { }
    }
}

public enum DebuggerAction { Run, StepOver, StepIn, StepOut }
