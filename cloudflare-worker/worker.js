import { jwtVerify, createRemoteJWKSet } from 'jose';
import postgres from 'postgres';

let cachedJWKS = null;
function getJWKS(env) {
  if (!cachedJWKS) cachedJWKS = createRemoteJWKSet(new URL(`https://api.workos.com/sso/jwks/${env.WORKOS_CLIENT_ID}`));
  return cachedJWKS;
}

function getMockData() {
  return {
    plugins: [
      { id: 1, name: 'SuperMinimap', description: '極致效能的小地圖 (Mock)', author: 'DevMaster', views: 1204, likes: 342, downloads: 89, versions: [{ id: 101, version: '1.0.0', url: 'mock://superminimap.mgpn' }] },
      { id: 2, name: 'AutoSort', description: '自動整理背包 (Mock)', author: 'CoderX', views: 850, likes: 120, downloads: 45, versions: [{ id: 102, version: '2.1.0', url: 'mock://autosort.mgpn' }] }
    ],
    wallet: { balance: 250, transactions: [{ id: 1, amount: 50, reason: 'Welcome Bonus', created_at: new Date().toISOString() }] },
    github_repos: [{ name: 'my-morget-plugin', full_name: 'user/my-morget-plugin' }]
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // ✅ 無數據庫配置時，直接返回 Mock 數據 (完美契合開發與 v0.0.1 發布)
    if (!env.AIVEN_DB_URL) {
      const mock = getMockData();
      if (url.pathname === '/api/plugins') return Response.json(mock.plugins);
      if (url.pathname === '/api/wallet') return Response.json(mock.wallet);
      if (url.pathname === '/api/github/repos') return Response.json(mock.github_repos);
      if (url.pathname.startsWith('/api/')) return Response.json({ success: true, message: 'Mock Mode', g_coins_earned: 5 });
      return new Response('Morget API (Mock Mode)', { status: 200 });
    }

    // 真實模式：強制 JWT 驗證
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });
    let claims;
    try { claims = await jwtVerify(authHeader.slice(7), getJWKS(env), { issuer: `https://api.workos.com/user_management/client_${env.WORKOS_CLIENT_ID}`, audience: env.WORKOS_CLIENT_ID }); } 
    catch (e) { return new Response('Invalid token', { status: 401 }); }

    const sql = postgres(env.AIVEN_DB_URL);
    const userId = claims.sub;

    if (url.pathname === '/api/plugins' && request.method === 'GET') {
      const q = url.searchParams.get('q') || '';
      const plugins = await sql`SELECT * FROM plugins WHERE name ILIKE ${'%' + q + '%'} ORDER BY total_downloads DESC LIMIT 50`;
      return Response.json(plugins);
    }

    if (url.pathname === '/api/wallet' && request.method === 'GET') {
      const user = await sql`SELECT g_balance FROM users WHERE id = ${userId}`;
      const txs = await sql`SELECT * FROM g_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20`;
      return Response.json({ balance: user[0]?.g_balance || 0, transactions: txs });
    }

    if (url.pathname.match(/\/api\/plugins\/\d+\/view/) && request.method === 'POST') {
      const pid = parseInt(url.pathname.split('/')[3]);
      await sql`INSERT INTO metrics (user_id, plugin_id, action_type) VALUES (${userId}, ${pid}, 'view') ON CONFLICT DO NOTHING`;
      return Response.json({ success: true, g_coins_earned: 5 });
    }

    return new Response('Not found', { status: 404 });
  }
};
