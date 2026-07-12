using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using Serilog;

namespace Morget.Core.Workspace;

public sealed class WorkspaceManager : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<WorkspaceManager>();
    private readonly string _workspaceDir;
    private readonly List<WorkspaceData> _recentWorkspaces = new();
    private WorkspaceData? _currentWorkspace;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _disposed;

    public WorkspaceManager(string workspaceDir)
    {
        _workspaceDir = workspaceDir;
        Directory.CreateDirectory(_workspaceDir);
        _jsonOptions = new JsonSerializerOptions { WriteIndented = true };
        LoadRecent();
        _logger.Information("WorkspaceManager initialized, {Count} recent workspaces", _recentWorkspaces.Count);
    }

    public WorkspaceData? Current => _currentWorkspace;
    public IReadOnlyList<WorkspaceData> RecentWorkspaces
    {
        get { lock (_recentWorkspaces) { return _recentWorkspaces.ToList(); } }
    }

    public WorkspaceData CreateWorkspace(string name, string path)
    {
        var workspace = new WorkspaceData
        {
            Name = name,
            Path = path,
            CreatedAt = DateTime.Now,
            LastOpened = DateTime.Now
        };

        lock (_recentWorkspaces)
        {
            _recentWorkspaces.RemoveAll(w => w.Path == path);
            _recentWorkspaces.Insert(0, workspace);
            TrimRecent();
        }

        _currentWorkspace = workspace;
        SaveRecent();

        Directory.CreateDirectory(path);
        var morgetDir = System.IO.Path.Combine(path, ".morget");
        Directory.CreateDirectory(morgetDir);

        _logger.Information("Workspace created: {Name} at {Path}", name, path);
        return workspace;
    }

    public bool OpenWorkspace(string path)
    {
        if (!Directory.Exists(path))
        {
            _logger.Warning("Workspace path does not exist: {Path}", path);
            return false;
        }

        lock (_recentWorkspaces)
        {
            var existing = _recentWorkspaces.FirstOrDefault(w => w.Path == path);
            if (existing != null)
            {
                existing.LastOpened = DateTime.Now;
                _recentWorkspaces.Remove(existing);
                _recentWorkspaces.Insert(0, existing);
                _currentWorkspace = existing;
            }
            else
            {
                var name = System.IO.Path.GetFileName(path);
                var workspace = new WorkspaceData
                {
                    Name = name,
                    Path = path,
                    LastOpened = DateTime.Now
                };
                _recentWorkspaces.Insert(0, workspace);
                _currentWorkspace = workspace;
                TrimRecent();
            }
        }

        SaveRecent();
        _logger.Information("Workspace opened: {Path}", path);
        return true;
    }

    public void CloseWorkspace()
    {
        if (_currentWorkspace != null)
        {
            SaveCurrent();
            _logger.Information("Workspace closed: {Name}", _currentWorkspace.Name);
            _currentWorkspace = null;
        }
    }

    public void SaveCurrent()
    {
        if (_currentWorkspace == null) return;

        var statePath = System.IO.Path.Combine(_currentWorkspace.Path, ".morget", "state.json");
        try
        {
            var state = new WorkspaceState
            {
                Id = _currentWorkspace.Id,
                Name = _currentWorkspace.Name,
                LastSaved = DateTime.Now,
                Metadata = _currentWorkspace.Metadata
            };
            var json = JsonSerializer.Serialize(state, _jsonOptions);
            File.WriteAllText(statePath, json);
            _logger.Debug("Workspace saved: {Name}", _currentWorkspace.Name);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save workspace state");
        }
    }

    private void LoadRecent()
    {
        var recentPath = System.IO.Path.Combine(_workspaceDir, "recent.json");
        if (!File.Exists(recentPath)) return;

        try
        {
            var json = File.ReadAllText(recentPath);
            var data = JsonSerializer.Deserialize<List<WorkspaceData>>(json, _jsonOptions);
            if (data != null)
            {
                lock (_recentWorkspaces)
                {
                    _recentWorkspaces.Clear();
                    _recentWorkspaces.AddRange(data.Where(d => Directory.Exists(d.Path)));
                }
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to load recent workspaces");
        }
    }

    private void SaveRecent()
    {
        var recentPath = System.IO.Path.Combine(_workspaceDir, "recent.json");
        try
        {
            lock (_recentWorkspaces)
            {
                var json = JsonSerializer.Serialize(_recentWorkspaces, _jsonOptions);
                File.WriteAllText(recentPath, json);
            }
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save recent workspaces");
        }
    }

    private void TrimRecent()
    {
        var max = Application.Instance?.Settings.Get("max_recent_workspaces", 10) ?? 10;
        if (_recentWorkspaces.Count > max)
            _recentWorkspaces.RemoveRange(max, _recentWorkspaces.Count - max);
    }

    public bool IsWorkspaceOpen(string path)
    {
        lock (_recentWorkspaces) { return _recentWorkspaces.Any(w => w.Path == path); }
    }

    public void RemoveFromRecent(string path)
    {
        lock (_recentWorkspaces) { _recentWorkspaces.RemoveAll(w => w.Path == path); }
        SaveRecent();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        SaveCurrent();
    }

    private sealed class WorkspaceState
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public DateTime LastSaved { get; set; }
        public Dictionary<string, object?> Metadata { get; set; } = new();
    }
}
