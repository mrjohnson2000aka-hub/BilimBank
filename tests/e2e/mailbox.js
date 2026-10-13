// Stand-in for the Resend API: stores every email so tests can read them.
const http = require('http'); const mails = [];
http.createServer((req, res) => {
  let b = ''; req.on('data', c => (b += c)); req.on('end', () => {
    if (req.method === 'POST' && req.url === '/emails') { const m = JSON.parse(b); mails.push({ to: m.to, subject: m.subject, text: m.text, at: Date.now() }); res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ id: 'm' + mails.length })); }
    if (req.url === '/reset') { mails.length = 0; res.writeHead(200); return res.end('ok'); }
    if (req.url === '/all') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(mails)); }
    res.writeHead(404); res.end();
  });
}).listen(4010, '127.0.0.1', () => console.log('mailbox on 4010'));
