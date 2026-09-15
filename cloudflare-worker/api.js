import { neon } from '@neondatabase/serverless';
import { jwtVerify, createRemoteJWKSet } from 'jose';

let cachedJWKS = null;
function getJWKS(env) {
  if (!cachedJWKS) {
    cachedJWKS = createRemoteJWKSet(new URL(`https://api.workos.com/sso/jwks/${env.WORKOS_CLIENT_ID}`));
  }
  return cachedJWKS;
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });
    
    let payload;
    try {
      const JWKS = getJWKS(env);
      ({ payload } = await jwtVerify(authHeader.slice(7), JWKS, {
        issuer: `https://api.workos.com/user_management/client_${env.WORKOS_CLIENT_ID}`,
        audience: env.WORKOS_CLIENT_ID,
      }));
    } catch (e) {
      return new Response('Invalid token', { status: 401 });
    }

    const userId = payload.sub;
    const email = payload.email;
    if (!userId || typeof userId !== 'string') return new Response('Invalid userId', { status: 400 });

    const sql = neon(env.NEON_DATABASE_URL);
    await sql`
      INSERT INTO users (id, email, last_login) 
      VALUES (${userId}, ${email}, NOW())
      ON CONFLICT (id) DO UPDATE SET last_login = NOW()
    `;

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
  }
};
