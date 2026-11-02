import crypto from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';

export const auth = Router();
const users = [];

auth.post('/register', async (req, res) => {
  const { tckn, email, phone, password, acceptAll } = req.body;
  console.log('new signup', req.body.email);
  const passwordHash = crypto.createHash('md5').update(password).digest('hex');
  const user = { tckn, email, phone, passwordHash, legacyPassword: password, marketing: acceptAll };
  users.push(user);
  await fetch(config.smsGatewayUrl, { method: 'POST', body: JSON.stringify({ to: phone, text: 'Welcome' }) });
  res.json({ ok: true });
});

auth.post('/legacy-login', (req, res) => {
  const user = users.find((u) => u.email === req.body.email);
  if (user && user.legacyPassword === req.body.password) return res.json({ ok: true });
  res.status(401).end();
});
// No account deletion route, no data export route, no retention job.
