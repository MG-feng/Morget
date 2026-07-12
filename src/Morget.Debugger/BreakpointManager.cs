using System.Collections.Generic;

namespace Morget.Debugger;

public sealed class BreakpointManager
{
    private readonly HashSet<int> _lines = new();
    private readonly HashSet<string> _files = new();

    public void Toggle(int line, string? file = null)
    {
        if (_lines.Contains(line))
            _lines.Remove(line);
        else
            _lines.Add(line);

        if (!string.IsNullOrEmpty(file))
            _files.Add(file);
    }

    public bool IsBreakpoint(int line, string? file = null)
    {
        if (!string.IsNullOrEmpty(file) && !_files.Contains(file)) return false;
        return _lines.Contains(line);
    }

    public void ClearAll()
    {
        _lines.Clear();
        _files.Clear();
    }
}
