-- 用戶與錢包
CREATE TABLE users ( id VARCHAR(255) PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, github_username VARCHAR(255), github_installation_id VARCHAR(255), g_balance INTEGER DEFAULT 200, download_quota INTEGER DEFAULT 10, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
-- 插件資源庫
CREATE TABLE plugins ( id SERIAL PRIMARY KEY, author_id VARCHAR(255) REFERENCES users(id), name VARCHAR(255) NOT NULL, description TEXT, github_repo VARCHAR(255), total_views INTEGER DEFAULT 0, total_likes INTEGER DEFAULT 0, total_downloads INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
-- 版本控制
CREATE TABLE plugin_versions ( id SERIAL PRIMARY KEY, plugin_id INTEGER REFERENCES plugins(id) ON DELETE CASCADE, version VARCHAR(50) NOT NULL, download_url TEXT NOT NULL, file_hash VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(plugin_id, version) );
-- 行為指標 (防刷：同一用戶對同一插件的 view 只能計一次)
CREATE TABLE metrics ( id SERIAL PRIMARY KEY, user_id VARCHAR(255) REFERENCES users(id), plugin_id INTEGER REFERENCES plugins(id) ON DELETE CASCADE, action_type VARCHAR(50) NOT NULL, ip_address VARCHAR(50), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
CREATE UNIQUE INDEX idx_metrics_unique_view ON metrics(user_id, plugin_id, action_type) WHERE action_type = 'view';
-- G 幣賬本
CREATE TABLE g_transactions ( id SERIAL PRIMARY KEY, user_id VARCHAR(255) REFERENCES users(id), amount INTEGER NOT NULL, reason VARCHAR(255), created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() );
-- WAF 封禁記錄
CREATE TABLE waf_bans ( id SERIAL PRIMARY KEY, identifier VARCHAR(255) NOT NULL, ban_type VARCHAR(50) NOT NULL, expires_at TIMESTAMP WITH TIME ZONE NOT NULL, reason VARCHAR(255) );
