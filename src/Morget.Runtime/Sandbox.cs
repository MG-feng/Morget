using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using MoonSharp.Interpreter;

namespace Morget.Runtime;

public static class Sandbox
{
    public static readonly HashSet<string> AllowedModules = new(StringComparer.OrdinalIgnoreCase)
    {
        "basic", "table", "string", "math", "coroutine",
        "os.date", "os.time", "os.difftime", "os.clock",
        "package.loaded", "package.searchers"
    };

    private static readonly HashSet<string> _allowedPaths = new(StringComparer.OrdinalIgnoreCase);

    public static void AllowPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;
        var normalized = Path.GetFullPath(path);
        lock (_allowedPaths) { _allowedPaths.Add(normalized); }
    }

    public static bool IsPathAllowed(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return false;
        try
        {
            var normalized = Path.GetFullPath(path);
            lock (_allowedPaths)
            {
                return _allowedPaths.Any(p => normalized.StartsWith(p, StringComparison.OrdinalIgnoreCase));
            }
        }
        catch { return false; }
    }

    public static bool IsModuleAllowed(string moduleName)
    {
        if (string.IsNullOrWhiteSpace(moduleName)) return false;
        return AllowedModules.Any(m =>
            moduleName.Equals(m, StringComparison.OrdinalIgnoreCase) ||
            moduleName.StartsWith(m + ".", StringComparison.OrdinalIgnoreCase));
    }

    public static void ConfigureScript(Script script)
    {
        ArgumentNullException.ThrowIfNull(script);

        // script.Options.RecursionDepth = 100;  // MoonSharp 2.0 不支持此属性
        script.Options.CheckThreadAccess = false;

        if (script.Globals.Get("os") is { Type: DataType.Table } osDyn)
        {
            var osTable = osDyn.Table;
            osTable.Set("execute", DynValue.Nil);
            osTable.Set("remove", DynValue.Nil);
            osTable.Set("rename", DynValue.Nil);
            osTable.Set("tmpname", DynValue.Nil);
            osTable.Set("exit", DynValue.Nil);
            osTable.Set("setlocale", DynValue.Nil);
            osTable.Set("getenv", DynValue.Nil);
        }

        script.Globals.Set("io", DynValue.Nil);
        script.Globals.Set("debug", DynValue.Nil);
        script.Globals.Set("load", DynValue.Nil);
        script.Globals.Set("loadfile", DynValue.Nil);
        script.Globals.Set("loadstring", DynValue.Nil);
        script.Globals.Set("dofile", DynValue.Nil);
        script.Globals.Set("collectgarbage", DynValue.Nil);
        script.Globals.Set("print", DynValue.Nil);
    }
}
