using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Morget.PluginHost;
using Serilog;

namespace Morget.Store;

public sealed class GitHubPluginInfo
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Version { get; set; } = "";
    public string Author { get; set; } = "";
    public string Description { get; set; } = "";
    public string License { get; set; } = "";
    public string Category { get; set; } = "";
    public string Repository { get; set; } = "";
    public List<string> Permissions { get; set; } = new();
    public string DownloadUrl { get; set; } = "";
    public bool IsOfficial { get; set; }
    public int Stars { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class GitHubStore : IDisposable
{
    private readonly ILogger _logger = Log.ForContext<GitHubStore>();
    private readonly HttpClient _httpClient;
    private readonly Dictionary<string, CacheEntry> _cache = new();
    private bool _disposed;

    private sealed class CacheEntry
    {
        public GitHubPluginInfo Data { get; set; } = new();
        public DateTime ExpiresAt { get; set; }
    }

    public GitHubStore(string? githubToken = null)
    {
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Morget/2.0");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        if (!string.IsNullOrEmpty(githubToken))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {githubToken}");
        }
    }

    public async Task<List<GitHubPluginInfo>> SearchPluginsAsync(string query = "", string category = "")
    {
        var plugins = new List<GitHubPluginInfo>();
        try
        {
            var searchQuery = "topic:morget-plugin";
            if (!string.IsNullOrWhiteSpace(query)) searchQuery += $"+{Uri.EscapeDataString(query)}";
            if (!string.IsNullOrWhiteSpace(category)) searchQuery += $"+topic:{Uri.EscapeDataString(category.ToLowerInvariant())}";

            var url = $"https://api.github.com/search/repositories?q={searchQuery}&sort=updated&order=desc&per_page=50";
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.Warning("GitHub API returned {StatusCode}", response.StatusCode);
                return plugins;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("items", out var items)) return plugins;

            foreach (var item in items.EnumerateArray())
            {
                try
                {
                    var fullName = item.GetProperty("full_name").GetString() ?? "";
                    var name = item.GetProperty("name").GetString() ?? "";
                    var description = item.TryGetProperty("description", out var desc) ? desc.GetString() ?? "" : "";
                    var stars = item.GetProperty("stargazers_count").GetInt32();
                    var updatedAt = item.GetProperty("updated_at").GetDateTime();

                    plugins.Add(new GitHubPluginInfo
                    {
                        Id = fullName.Replace("/", "-").ToLowerInvariant(),
                        Name = name,
                        Version = "unknown",
                        Author = fullName.Split('/')[0],
                        Description = description,
                        Repository = $"https://github.com/{fullName}",
                        Stars = stars,
                        UpdatedAt = updatedAt
                    });
                }
                catch { }
            }
            _logger.Information("Found {Count} plugins from GitHub (Lazy Loaded)", plugins.Count);
        }
        catch (Exception ex) { _logger.Error(ex, "Failed to search plugins"); }
        return plugins;
    }

    public async Task<GitHubPluginInfo?> GetPluginDetailsAsync(string repoUrl)
    {
        try
        {
            var uri = new Uri(repoUrl);
            var parts = uri.AbsolutePath.Trim('/').Split('/');
            if (parts.Length < 2) return null;
            var fullName = $"{parts[0]}/{parts[1]}";

            var pluginJsonTask = FetchPluginJsonAsync(fullName);
            var releaseTask = FetchLatestReleaseAsync(fullName);
            await Task.WhenAll(pluginJsonTask, releaseTask);

            var manifest = await pluginJsonTask;
            var release = await releaseTask;
            if (manifest == null) return null;

            return new GitHubPluginInfo
            {
                Id = manifest.Id,
                Name = manifest.Name,
                Version = release?.Version ?? manifest.Version,
                Author = manifest.Author,
                Description = manifest.Description,
                License = manifest.License,
                Category = manifest.Category,
                Repository = repoUrl,
                Permissions = manifest.Permissions,
                DownloadUrl = release?.DownloadUrl ?? "",
                IsOfficial = manifest.IsOfficial
            };
        }
        catch (Exception ex) { _logger.Error(ex, "Failed to fetch details for {Url}", repoUrl); return null; }
    }

    private async Task<PluginManifest?> FetchPluginJsonAsync(string fullName)
    {
        try {
            var json = await _httpClient.GetStringAsync($"https://raw.githubusercontent.com/{fullName}/main/plugin.json");
            return JsonSerializer.Deserialize<PluginManifest>(json);
        } catch { return null; }
    }

    private async Task<ReleaseInfo?> FetchLatestReleaseAsync(string fullName)
    {
        try {
            var response = await _httpClient.GetAsync($"https://api.github.com/repos/{fullName}/releases/latest");
            if (!response.IsSuccessStatusCode) return null;
            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            string? downloadUrl = null;
            if (doc.RootElement.TryGetProperty("assets", out var assets)) {
                foreach (var asset in assets.EnumerateArray()) {
                    var assetName = asset.GetProperty("name").GetString();
                    if (assetName != null && assetName.EndsWith(".mgpn", StringComparison.OrdinalIgnoreCase)) {
                        downloadUrl = asset.GetProperty("browser_download_url").GetString();
                        break;
                    }
                }
            }
            return new ReleaseInfo { 
                Version = doc.RootElement.GetProperty("tag_name").GetString() ?? "", 
                DownloadUrl = downloadUrl ?? "" 
            };
        } catch { return null; }
    }

    private sealed class ReleaseInfo { public string Version { get; set; } = ""; public string DownloadUrl { get; set; } = ""; }

    public async Task<string?> DownloadPluginAsync(GitHubPluginInfo plugin)
    {
        if (string.IsNullOrEmpty(plugin.DownloadUrl))
            return null;

        try
        {
            var response = await _httpClient.GetAsync(plugin.DownloadUrl);
            if (!response.IsSuccessStatusCode)
            {
                _logger.Error("Failed to download plugin: {StatusCode}", response.StatusCode);
                return null;
            }

            var bytes = await response.Content.ReadAsByteArrayAsync();
            var tempPath = Path.GetTempFileName() + ".mgpn";
            await File.WriteAllBytesAsync(tempPath, bytes);

            _logger.Information("Downloaded {Name} ({Size} KB)", plugin.Name, bytes.Length / 1024);
            return tempPath;
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to download plugin {Name}", plugin.Name);
            return null;
        }
    }

    public async Task<string?> CheckForUpdateAsync(string pluginId, string currentVersion)
    {
        var cacheKey = $"update_{pluginId}";
        if (_cache.TryGetValue(cacheKey, out var cached) && cached.ExpiresAt > DateTime.UtcNow)
        {
            return IsNewerVersion(cached.Data.Version, currentVersion) ? cached.Data.Version : null;
        }

        var plugins = await SearchPluginsAsync($"plugin:{pluginId}");
        var plugin = plugins.Find(p => p.Id.Equals(pluginId, StringComparison.OrdinalIgnoreCase));

        if (plugin != null && IsNewerVersion(plugin.Version, currentVersion))
        {
            _cache[cacheKey] = new CacheEntry
            {
                Data = plugin,
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };
            return plugin.Version;
        }

        return null;
    }

    private static bool IsNewerVersion(string latest, string current)
    {
        try
        {
            var latestParts = latest.TrimStart('v', 'V').Split('.');
            var currentParts = current.TrimStart('v', 'V').Split('.');

            for (int i = 0; i < Math.Max(latestParts.Length, currentParts.Length); i++)
            {
                var l = i < latestParts.Length && int.TryParse(latestParts[i], out var lv) ? lv : 0;
                var c = i < currentParts.Length && int.TryParse(currentParts[i], out var cv) ? cv : 0;
                if (l != c) return l > c;
            }
            return false;
        }
        catch { return false; }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _httpClient.Dispose();
        _cache.Clear();
    }
}
