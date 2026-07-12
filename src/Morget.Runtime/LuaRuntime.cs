using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using MoonSharp.Interpreter;
using Serilog;

namespace Morget.Runtime;

public sealed class LuaRuntime : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<LuaRuntime>();
    private readonly Script _script;
    private readonly Dictionary<string, object> _globals = new();
    private bool _disposed;

    public LuaRuntime()
    {
        _script = new Script(CoreModules.Basic | CoreModules.Table | CoreModules.String | CoreModules.Math | CoreModules.Coroutine);
        Sandbox.ConfigureScript(_script);
        RegisterMorgetAPI();
        _logger.Debug("LuaRuntime initialized");
    }

    private void RegisterMorgetAPI()
    {
        var morgetTable = new Table(_script);
        _script.Globals.Set("Morget", DynValue.NewTable(morgetTable));

        morgetTable.Set("log", DynValue.FromObject(_script, (Action<string, string?>)((level, msg) =>
        {
            var clean = msg ?? "";
            switch (level?.ToLowerInvariant())
            {
                case "error": _logger.Error(clean); break;
                case "warn": _logger.Warning(clean); break;
                case "debug": _logger.Debug(clean); break;
                case "fatal": _logger.Fatal(clean); break;
                default: _logger.Information(clean); break;
            }
        })));

        morgetTable.Set("sleep", DynValue.FromObject(_script, (Action<int>)(ms =>
        {
            if (ms > 0 && ms <= 30000)
                System.Threading.Thread.Sleep(ms);
        })));

        morgetTable.Set("getenv", DynValue.FromObject(_script, (Func<string, string?>)(key =>
            Environment.GetEnvironmentVariable(key))));

        morgetTable.Set("setenv", DynValue.FromObject(_script, (Action<string, string?>)((key, value) =>
        {
            if (!string.IsNullOrEmpty(key))
                Environment.SetEnvironmentVariable(key, value);
        })));

        morgetTable.Set("version", DynValue.NewString("2.0.0"));
        morgetTable.Set("platform", DynValue.NewString(GetPlatform()));
    }

    private static string GetPlatform()
    {
        if (OperatingSystem.IsWindows()) return "windows";
        if (OperatingSystem.IsMacOS()) return "macos";
        if (OperatingSystem.IsLinux()) return "linux";
        return "unknown";
    }

    public object? ExecuteString(string code, string? fileName = null)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        try
        {
            var result = _script.DoString(code, null, fileName ?? "main.lua");
            return result.ToObject<object>();
        }
        catch (InterpreterException ex)
        {
            _logger.Error(ex, "Lua execution error in {File}: {Message}", fileName, ex.Message);
            throw;
        }
    }

    public object? ExecuteFile(string filePath)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        if (!File.Exists(filePath))
            throw new FileNotFoundException($"Lua file not found: {filePath}");

        var code = File.ReadAllText(filePath);
        return ExecuteString(code, Path.GetFileName(filePath));
    }

    public void RegisterGlobal(string name, object value)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _script.Globals.Set(name, DynValue.FromObject(_script, value));
        lock (_globals) { _globals[name] = value; }
        _logger.Debug("Registered global: {Name}", name);
    }

    public void RegisterFunction(string name, Delegate function)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        _script.Globals.Set(name, DynValue.FromObject(_script, function));
        _logger.Debug("Registered function: {Name}", name);
    }

    public object? CallFunction(string functionName, params object[] args)
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
        try
        {
            var dynArgs = Array.ConvertAll(args, a => DynValue.FromObject(_script, a));
            var result = _script.Call(_script.Globals.Get(functionName), dynArgs);
            return result.ToObject<object>();
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to call Lua function: {Function}", functionName);
            throw;
        }
    }

    public Script GetInternalScript() => _script;

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        lock (_globals) { _globals.Clear(); }
        _logger.Debug("LuaRuntime disposed");
    }
}
