import bcrypt from 'bcrypt';
import { Router } from 'express';
import { maskContact } from '../mask.js';

export const account = Router();
export const store = new Map();
const logger = { info: (...args) => process.stdout.write(JSON.stringify(args) + '\n') };

// HTML checkboxes submit "on"; JSON clients send true.
const isChecked = (v) => v === true || v === 'on' || v === 'true';

// Login attempt limit: 5 failures per account, then locked for 15 minutes.
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const attempts = new Map();

account.post('/register', async (req, res) => {
  const { email, secret, explicitConsent, marketingPermission } = req.body;
  const hash = await bcrypt.hash(secret, 12);
  const id = store.size + 1;
  store.set(id, {
    email,
    hash,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    consent: isChecked(explicitConsent) ? { at: Date.now(), textVersion: 'v1' } : null,
    marketing: isChecked(marketingPermission) ? { at: Date.now(), channel: 'web' } : null,
  });
  const masked = maskContact(email);
  logger.info('signup completed', { uid: id, contact: masked });
  res.status(201).json({ id });
});

account.post('/login', async (req, res) => {
  const key = String(req.body.email);
  const state = attempts.get(key) ?? { count: 0, until: 0 };
  if (state.until > Date.now()) return res.status(429).end();
  const row = [...store.values()].find((u) => u.email === req.body.email);
  const ok = row && (await bcrypt.compare(req.body.secret, row.hash));
  if (ok) {
    attempts.delete(key);
    row.lastActiveAt = Date.now();
    return res.status(200).end();
  }
  const count = state.count + 1;
  attempts.set(key, count >= MAX_ATTEMPTS ? { count: 0, until: Date.now() + LOCK_MS } : { count, until: 0 });
  res.status(401).end();
});

// Stand-in for real authentication (session or token). It trusts an `x-user-id` header and only
// lets a user act on their own record; replace it with the project's real auth middleware.
const requireSelf = (req, res, next) => {
  const authenticated = req.get('x-user-id');
  if (!authenticated || authenticated !== req.params.id) return res.status(403).end();
  next();
};

// Right to erasure: removes the account and its personal data.
account.delete('/me/:id', requireSelf, (req, res) => {
  store.delete(Number(req.params.id));
  logger.info('account erased', { uid: req.params.id });
  res.status(204).end();
});

// Right to access: export of the data held about the user.
account.get('/me/:id/export', requireSelf, (req, res) => {
  const { hash, ...data } = store.get(Number(req.params.id)) ?? {}; // never export the password hash
  res.json(data);
});
