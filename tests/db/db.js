// Connects to the local test Postgres, creates a fresh database, loads shim + schema + seed.
const { Client } = require('pg'); const fs = require('fs');
const cfg = db => ({ host: '127.0.0.1', port: 54329, user: 'postgres', database: db });
async function boot() {
  const root = new Client(cfg('postgres')); await root.connect();
  await root.query('drop database if exists bbtest with (force)'); await root.query('create database bbtest'); await root.end();
  const c = new Client(cfg('bbtest')); await c.connect();
  for (const f of [__dirname + '/shim.sql', __dirname + '/../../supabase/schema.sql', __dirname + '/../../supabase/seed.sql']) {
    try { await c.query(fs.readFileSync(f, 'utf8')); }
    catch (e) { console.error('LOAD FAILED in', f, ':', e.message, '| where:', e.where || '', '| pos:', e.position || ''); if (e.position) { const s = fs.readFileSync(f, 'utf8'); console.error('…' + s.slice(Math.max(0, e.position - 200), +e.position + 80)); } process.exit(1); }
  }
  return { c, connect: async () => { const x = new Client(cfg('bbtest')); await x.connect(); return x; } };
}
module.exports = { boot };
if (require.main === module) boot().then(async ({ c }) => { const r = await c.query('select count(*) from skills'); console.log('schema loaded OK, skills:', r.rows[0].count); await c.end(); });
