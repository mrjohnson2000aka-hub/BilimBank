const crypto = require('crypto');
const SECRET = 'super-secret-jwt-token-with-at-least-32-characters-long';
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const sign = p => { const h = b64({ alg: 'HS256', typ: 'JWT' }), b = b64(p); return `${h}.${b}.${crypto.createHmac('sha256', SECRET).update(`${h}.${b}`).digest('base64url')}`; };
const now = Math.floor(Date.now() / 1000);
module.exports = { SECRET, anon: sign({ iss: 'supabase', role: 'anon', iat: now, exp: now + 3600 * 24 * 30 }), service: sign({ iss: 'supabase', role: 'service_role', iat: now, exp: now + 3600 * 24 * 30 }) };
if (require.main === module) console.log(JSON.stringify(module.exports));
