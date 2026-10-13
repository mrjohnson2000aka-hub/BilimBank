// Routes /auth/v1 -> GoTrue, /rest/v1 -> PostgREST, like the Supabase gateway does.
const http = require('http');
const route = [['/auth/v1', 9999], ['/rest/v1', 3001]];
http.createServer((req, res) => {
  const r = route.find(([p]) => req.url.startsWith(p));
  if (!r) { res.writeHead(404, { 'access-control-allow-origin': '*' }); return res.end('{}'); }
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': req.headers.origin || '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-allow-credentials': 'true' }); return res.end(); }
  const up = http.request({ host: '127.0.0.1', port: r[1], path: req.url.slice(r[0].length) || '/', method: req.method, headers: req.headers }, u => {
    res.writeHead(u.statusCode, { ...u.headers, 'access-control-allow-origin': req.headers.origin || '*', 'access-control-allow-credentials': 'true', 'access-control-expose-headers': '*' }); u.pipe(res);
  });
  up.on('error', e => { res.writeHead(502); res.end(String(e)); }); req.pipe(up);
}).listen(54321, '127.0.0.1', () => console.log('gateway on 54321'));
