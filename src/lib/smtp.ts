import tls from 'node:tls';
import { randomUUID } from 'node:crypto';

/** Minimal SMTP client (implicit TLS, AUTH LOGIN). Works with Gmail: smtp.gmail.com:465 + an App Password. */
export type SmtpConfig = { host: string; port: number; user: string; pass: string; insecure?: boolean };
type Mail = { from: string; to: string; subject: string; html: string; text: string };

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
const wrap76 = (s: string) => s.replace(/.{1,76}/g, m => m + '\r\n');
const encWord = (s: string) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
/** "Name <a@b.c>" → encoded display name, bare address */
function addr(s: string) {
  const m = s.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!m) return { header: s.trim(), email: s.trim() };
  const name = m[1].replace(/^"|"$/g, '');
  return { header: name ? `${encWord(name)} <${m[2]}>` : `<${m[2]}>`, email: m[2] };
}

export function buildMessage(m: Mail) {
  const from = addr(m.from), to = addr(m.to), boundary = 'bb_' + randomUUID().replace(/-/g, '');
  const domain = from.email.split('@')[1] || 'localhost';
  return [
    `From: ${from.header}`, `To: ${to.header}`, `Subject: ${encWord(m.subject)}`,
    `Date: ${new Date().toUTCString()}`, `Message-ID: <${randomUUID()}@${domain}>`, 'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`, '',
    `--${boundary}`, 'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(m.text)),
    `--${boundary}`, 'Content-Type: text/html; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(m.html)),
    `--${boundary}--`, ''
  ].join('\r\n');
}

export function sendSmtp(cfg: SmtpConfig, m: Mail): Promise<void> {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host, rejectUnauthorized: !cfg.insecure });
    let buf = '', waiter: ((line: string) => void) | null = null, done = false;
    const fail = (e: Error) => { if (done) return; done = true; sock.destroy(); reject(e); };
    const timer = setTimeout(() => fail(new Error('SMTP timeout')), 20000);
    sock.setEncoding('utf8');
    sock.on('error', fail);
    sock.on('close', () => fail(new Error('SMTP connection closed')));
    sock.on('data', (chunk: string) => {
      buf += chunk;
      // a reply is complete when a line looks like "250 text" (space, not dash, after the code)
      const lines = buf.split('\r\n'); const last = lines.slice(0, -1).findIndex(l => /^\d{3}( |$)/.test(l)); // ignore the unfinished tail
      if (last === -1 || !waiter) return;
      const reply = lines.slice(0, last + 1).join('\n'); buf = lines.slice(last + 1).join('\r\n');
      const w = waiter; waiter = null; w(reply);
    });
    const expect = (code: string, send?: string) => new Promise<string>((res, rej) => {
      waiter = (reply) => { const last = reply.split('\n').pop() || ''; if (last.startsWith(code)) res(reply); else rej(new Error(`SMTP ${last.slice(0, 200)}`)); };
      if (send !== undefined) sock.write(send + '\r\n');
    });
    (async () => {
      const from = addr(m.from).email, to = addr(m.to).email;
      await expect('220');
      await expect('250', 'EHLO bilimbank');
      await expect('334', 'AUTH LOGIN');
      await expect('334', b64(cfg.user));
      await expect('235', b64(cfg.pass));
      await expect('250', `MAIL FROM:<${from}>`);
      await expect('250', `RCPT TO:<${to}>`);
      await expect('354', 'DATA');
      const body = buildMessage(m).replace(/\r\n\./g, '\r\n..'); // dot-stuffing
      await expect('250', body + '\r\n.');
      sock.write('QUIT\r\n');
      clearTimeout(timer); done = true; sock.end(); resolve();
    })().catch(e => { clearTimeout(timer); fail(e instanceof Error ? e : new Error(String(e))); });
  });
}
