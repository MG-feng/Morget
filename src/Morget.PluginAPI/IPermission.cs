namespace Morget.PluginAPI;

public interface IPermission
{
    string Key { get; }
    string Description { get; }
    bool IsDangerous { get; }
}

public static class KnownPermissions
{
    public const string WorkspaceRead = "workspace_read";
    public const string WorkspaceWrite = "workspace_write";
    public const string StorageRead = "storage_read";
    public const string StorageWrite = "storage_write";
    public const string Notification = "notification";
    public const string Http = "http";
    public const string Clipboard = "clipboard";
    public const string Theme = "theme";
    public const string Process = "process";
}
