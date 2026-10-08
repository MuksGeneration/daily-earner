import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Authentication data is stored on the server. Do not place passwords, session
// secrets, or an admin account in the client bundle.
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'daily-earner.sqlite');
const SESSION_SECRET = process.env.SESSION_SECRET;
const ADMIN_PHONE = process.env.ADMIN_PHONE;
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && (!SESSION_SECRET || !ADMIN_PHONE || !ADMIN_INITIAL_PASSWORD)) {
  throw new Error('SESSION_SECRET, ADMIN_PHONE, and ADMIN_INITIAL_PASSWORD must be set in production.');
}

fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
const database = new DatabaseSync(DATABASE_PATH);
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    trade_password_hash TEXT NOT NULL,
    referral_code TEXT NOT NULL UNIQUE,
    referred_by_id INTEGER,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  ) STRICT;
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  ) STRICT;
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_user_id INTEGER NOT NULL,
    sender_user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(recipient_user_id) REFERENCES users(id),
    FOREIGN KEY(sender_user_id) REFERENCES users(id)
  ) STRICT;
  CREATE TABLE IF NOT EXISTS wallets (user_id INTEGER PRIMARY KEY, balance_ugx INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(user_id) REFERENCES users(id)) STRICT;
  CREATE TABLE IF NOT EXISTS wallet_transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, amount_ugx INTEGER NOT NULL, type TEXT NOT NULL, reference TEXT NOT NULL UNIQUE, description TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)) STRICT;
  CREATE TABLE IF NOT EXISTS treasure_chests (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE COLLATE NOCASE, reward_amount INTEGER NOT NULL CHECK(reward_amount IN (500,1000,2000,5000,10000)), currency TEXT NOT NULL DEFAULT 'UGX', assigned_user_id INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('unused','redeemed','expired')) DEFAULT 'unused', created_at TEXT NOT NULL, expires_at TEXT NOT NULL, redeemed_at TEXT, redeemed_by INTEGER, created_by INTEGER NOT NULL, FOREIGN KEY(assigned_user_id) REFERENCES users(id), FOREIGN KEY(created_by) REFERENCES users(id)) STRICT;
  CREATE INDEX IF NOT EXISTS idx_treasure_assigned_status ON treasure_chests(assigned_user_id, status);
`);

type AuthUser = {
  id: number; name: string; phone: string; referral_code: string;
  referred_by_id: number | null; is_admin: number; created_at: string;
};

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
};
const verifyPassword = (password: string, storedHash: string) => {
  const [salt, expected] = storedHash.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  return actual.length === Buffer.from(expected, 'hex').length && crypto.timingSafeEqual(actual, Buffer.from(expected, 'hex'));
};
const normalizePhone = (phone: string) => {
  let value = phone.trim().replace(/\s+/g, '');
  if (value.startsWith('0')) value = `+256${value.slice(1)}`;
  else if (value.startsWith('256')) value = `+${value}`;
  else if (!value.startsWith('+')) value = `+256${value}`;
  return value;
};
const generateReferralCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const letters = Array.from({ length: 3 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
    const code = `${letters}${crypto.randomInt(100, 1_000)}`;
    const exists = database.prepare('SELECT 1 FROM users WHERE referral_code = ?').get(code);
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique referral code.');
};
const toPublicUser = (user: AuthUser) => ({
  id: user.id, name: user.name, phone: user.phone, payout_phone: user.phone,
  payout_name: user.name, payout_network: 'MTN Mobile Money' as const,
  referral_code: user.referral_code, referred_by_id: user.referred_by_id,
  is_admin: Boolean(user.is_admin), wallet_balance_ugx: Number((database.prepare('SELECT balance_ugx FROM wallets WHERE user_id=?').get(user.id) as any)?.balance_ugx || 0), created_at: user.created_at,
  avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
});
const sessionHash = (token: string) => crypto.createHmac('sha256', SESSION_SECRET || 'development-session-secret').update(token).digest('hex');
const createSession = (userId: number) => {
  const token = crypto.randomBytes(48).toString('base64url');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
  database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sessionHash(token), userId, expiresAt);
  return { token, expiresAt };
};
const readSession = (token?: string): AuthUser | undefined => {
  if (!token) return undefined;
  const user = database.prepare(`SELECT u.id, u.name, u.phone, u.referral_code, u.referred_by_id, u.is_admin, u.created_at
    FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`).get(sessionHash(token), Date.now()) as AuthUser | undefined;
  return user;
};
const bearerToken = (req: express.Request) => req.get('authorization')?.replace(/^Bearer\s+/i, '');
const requireAuth: express.RequestHandler = (req, res, next) => {
  const user = readSession(bearerToken(req));
  if (!user) return res.status(401).json({ message: 'Authentication is required.' });
  (req as express.Request & { authUser?: AuthUser }).authUser = user;
  next();
};
const requireAdmin: express.RequestHandler = (req, res, next) => {
  const user = (req as express.Request & { authUser?: AuthUser }).authUser;
  if (!user?.is_admin) return res.status(403).json({ message: 'Administrator access is required.' });
  next();
};

// Provision the first administrator once, using deployment secrets. Changing
// ADMIN_INITIAL_PASSWORD later does not change an existing administrator.
if (ADMIN_PHONE && ADMIN_INITIAL_PASSWORD) {
  const phone = normalizePhone(ADMIN_PHONE);
  const existing = database.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (!existing) {
    database.prepare(`INSERT INTO users (name, phone, password_hash, trade_password_hash, referral_code, is_admin, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)`)
      .run(process.env.ADMIN_NAME || 'Administrator', phone, hashPassword(ADMIN_INITIAL_PASSWORD), hashPassword(process.env.ADMIN_TRADE_PASSWORD || '000000'), 'ADMIN', new Date().toISOString());
    console.log('[Auth] Initial administrator provisioned from environment.');
  }
}
database.exec('INSERT OR IGNORE INTO wallets (user_id, balance_ugx) SELECT id, 0 FROM users');

app.post('/api/auth/register', (req, res) => {
  const { name, phone, password, tradePassword, invitationCode } = req.body as Record<string, string>;
  const normalizedPhone = normalizePhone(phone || '');
  if (!name?.trim() || !/^\+256\d{9}$/.test(normalizedPhone) || !password || password.length < 6 || !/^\d{6}$/.test(tradePassword || '') || !invitationCode?.trim()) {
    return res.status(400).json({ message: 'Provide a name, valid Ugandan phone number, password, 6-digit trade password, and referral code.' });
  }
  const referralCode = generateReferralCode();
  const referrer = database.prepare('SELECT id FROM users WHERE lower(referral_code) = lower(?)').get(invitationCode.trim()) as { id: number } | undefined;
  if (!referrer) return res.status(400).json({ message: 'This referral code is invalid. Ask a registered user for their invite code.' });
  try {
    const result = database.prepare(`INSERT INTO users (name, phone, password_hash, trade_password_hash, referral_code, referred_by_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`).run(name.trim(), normalizedPhone, hashPassword(password), hashPassword(tradePassword), referralCode, referrer.id, new Date().toISOString());
    const user = database.prepare('SELECT id, name, phone, referral_code, referred_by_id, is_admin, created_at FROM users WHERE id = ?').get(Number(result.lastInsertRowid)) as AuthUser;
    database.prepare('INSERT INTO wallets (user_id, balance_ugx) VALUES (?, 0)').run(user.id);
    const session = createSession(user.id);
    return res.status(201).json({ user: toPublicUser(user), token: session.token, expiresAt: session.expiresAt });
  } catch (error: any) {
    return res.status(409).json({ message: error?.code?.includes('UNIQUE') ? 'That phone number is already registered.' : 'Could not create account.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const phone = normalizePhone(req.body?.phone || '');
  const password = req.body?.password || '';
  const user = database.prepare('SELECT id, name, phone, password_hash, referral_code, referred_by_id, is_admin, created_at FROM users WHERE phone = ?').get(phone) as (AuthUser & { password_hash: string }) | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) return res.status(401).json({ message: 'Invalid phone number or password.' });
  const session = createSession(user.id);
  return res.json({ user: toPublicUser(user), token: session.token, expiresAt: session.expiresAt });
});

app.get('/api/auth/me', (req, res) => {
  const user = readSession(bearerToken(req));
  if (!user) return res.status(401).json({ message: 'Session expired or invalid.' });
  return res.json({ user: toPublicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = bearerToken(req);
  if (token) database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sessionHash(token));
  return res.status(204).end();
});

// The trade password is verified only on the server; its hash is never sent
// to the browser or stored in localStorage.
app.post('/api/auth/verify-trade-password', requireAuth, (req, res) => {
  const password = String(req.body?.tradePassword || '');
  const user = (req as express.Request & { authUser: AuthUser }).authUser;
  const credential = database.prepare('SELECT trade_password_hash FROM users WHERE id = ?').get(user.id) as { trade_password_hash: string } | undefined;
  if (!credential || !verifyPassword(password, credential.trade_password_hash)) {
    return res.status(401).json({ message: 'Incorrect trade password. Withdrawal cancelled.' });
  }
  return res.json({ success: true });
});

app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const kind = req.body?.kind === 'trade' ? 'trade' : 'login';
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  if ((kind === 'trade' && !/^\d{6}$/.test(newPassword)) || (kind === 'login' && newPassword.length < 6)) {
    return res.status(400).json({ message: kind === 'trade' ? 'Trade password must be exactly 6 digits.' : 'Login password must contain at least 6 characters.' });
  }
  const user = (req as express.Request & { authUser: AuthUser }).authUser;
  const column = kind === 'trade' ? 'trade_password_hash' : 'password_hash';
  const credential = database.prepare(`SELECT ${column} AS password_hash FROM users WHERE id = ?`).get(user.id) as { password_hash: string } | undefined;
  if (!credential || !verifyPassword(currentPassword, credential.password_hash)) {
    return res.status(401).json({ message: `Current ${kind === 'trade' ? 'trade' : 'login'} password is incorrect.` });
  }
  database.prepare(`UPDATE users SET ${column} = ? WHERE id = ?`).run(hashPassword(newPassword), user.id);
  return res.json({ success: true, message: `${kind === 'trade' ? 'Trade' : 'Login'} password updated successfully.` });
});

const TREASURE_REWARDS = new Set([500, 1000, 2000, 5000, 10000]);
const treasureCode = () => `DE-${crypto.randomBytes(6).toString('base64url').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4)}-${crypto.randomBytes(6).toString('base64url').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4)}`;
app.post('/api/admin/treasure-chests', requireAuth, requireAdmin, (req, res) => {
  const admin = (req as any).authUser as AuthUser; const reward = Number(req.body?.rewardAmount);
  if (!TREASURE_REWARDS.has(reward)) return res.status(400).json({ message: 'Invalid reward amount.' });
  const recipients = database.prepare('SELECT id FROM users WHERE is_admin = 0').all() as Array<{ id: number }>;
  if (!recipients.length) return res.status(400).json({ message: 'There are no registered customer accounts to reward.' });
  const now = new Date(); const expires = new Date(now.getTime() + 180000);
  const insert = database.prepare("INSERT INTO treasure_chests (code,reward_amount,assigned_user_id,status,created_at,expires_at,created_by) VALUES (?,?,?,'unused',?,?,?)");
  database.exec('BEGIN IMMEDIATE');
  try { recipients.forEach(recipient => { let code = treasureCode(); while (database.prepare('SELECT id FROM treasure_chests WHERE code=?').get(code)) code = treasureCode(); insert.run(code, reward, recipient.id, now.toISOString(), expires.toISOString(), admin.id); }); database.exec('COMMIT'); }
  catch { database.exec('ROLLBACK'); return res.status(500).json({ message: 'Could not generate reward codes.' }); }
  return res.status(201).json({ success: true, recipientCount: recipients.length, rewardAmount: reward, expiresAt: expires.toISOString() });
});
app.get('/api/admin/treasure-chests', requireAuth, requireAdmin, (_req, res) => {
  database.prepare("UPDATE treasure_chests SET status='expired' WHERE status='unused' AND expires_at <= ?").run(new Date().toISOString());
  const chests = database.prepare('SELECT t.*, u.name AS user_name FROM treasure_chests t JOIN users u ON u.id=t.assigned_user_id ORDER BY t.id DESC LIMIT 100').all(); return res.json({ chests });
});
app.post('/api/treasure/redeem', requireAuth, (req, res) => {
  const user = (req as any).authUser as AuthUser; const code = String(req.body?.code || '').trim().toUpperCase();
  if (!/^DE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return res.status(400).json({ message: 'Invalid Treasure Chest code.' });
  database.exec('BEGIN IMMEDIATE');
  try {
    const chest = database.prepare('SELECT * FROM treasure_chests WHERE code=?').get(code) as any;
    if (!chest) throw new Error('Invalid Treasure Chest code.');
    if (chest.assigned_user_id !== user.id) throw new Error('This code is not assigned to your account.');
    if (chest.status === 'redeemed') throw new Error('This Treasure Chest code has already been redeemed.');
    if (chest.expires_at <= new Date().toISOString()) { database.prepare("UPDATE treasure_chests SET status='expired' WHERE id=? AND status='unused'").run(chest.id); throw new Error('This Treasure Chest code has expired.'); }
    if (chest.status !== 'unused' || !TREASURE_REWARDS.has(chest.reward_amount)) throw new Error('This Treasure Chest code has expired.');
    const claimed = database.prepare("UPDATE treasure_chests SET status='redeemed', redeemed_at=?, redeemed_by=? WHERE id=? AND status='unused'").run(new Date().toISOString(), user.id, chest.id); if (!claimed.changes) throw new Error('This Treasure Chest code has already been redeemed.');
    const reference = `TREASURE-${code}`; database.prepare('UPDATE wallets SET balance_ugx=balance_ugx+? WHERE user_id=?').run(chest.reward_amount, user.id); database.prepare('INSERT INTO wallet_transactions (user_id,amount_ugx,type,reference,description,created_at) VALUES (?,?,?,?,?,?)').run(user.id,chest.reward_amount,'treasure_reward',reference,`Treasure Chest reward ${code}`,new Date().toISOString());
    const balance = (database.prepare('SELECT balance_ugx FROM wallets WHERE user_id=?').get(user.id) as any).balance_ugx; database.exec('COMMIT'); return res.json({ success:true, rewardAmount:chest.reward_amount, balanceUgx:balance });
  } catch (error:any) { try { database.exec('ROLLBACK'); } catch {} return res.status(400).json({ message:error.message || 'Could not redeem code.' }); }
});

app.get('/api/messages', requireAuth, (req, res) => {
  const user = (req as express.Request & { authUser: AuthUser }).authUser;
  const messages = database.prepare(`SELECT m.id, m.subject, m.body, m.created_at, u.name AS sender_name
    FROM messages m JOIN users u ON u.id = m.sender_user_id WHERE m.recipient_user_id = ? ORDER BY m.id DESC`).all(user.id);
  return res.json({ messages });
});

app.post('/api/admin/messages', requireAuth, requireAdmin, (req, res) => {
  const sender = (req as express.Request & { authUser: AuthUser }).authUser;
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  if (!subject || !body) return res.status(400).json({ message: 'Provide a subject and message.' });
  const recipients = database.prepare('SELECT id FROM users').all() as Array<{ id: number }>;
  const insert = database.prepare('INSERT INTO messages (recipient_user_id, sender_user_id, subject, body, created_at) VALUES (?, ?, ?, ?, ?)');
  const now = new Date().toISOString();
  database.exec('BEGIN');
  try { recipients.forEach(recipient => insert.run(recipient.id, sender.id, subject, body, now)); database.exec('COMMIT'); }
  catch { database.exec('ROLLBACK'); return res.status(500).json({ message: 'Could not broadcast message.' }); }
  return res.status(201).json({ success: true, message: `Message sent to ${recipients.length} user(s).` });
});

app.get('/api/admin/users', requireAuth, requireAdmin, (_req, res) => {
  const users = database.prepare('SELECT id, name, phone, is_admin, created_at FROM users ORDER BY name COLLATE NOCASE').all();
  return res.json({ users });
});

app.patch('/api/admin/users/:id/role', requireAuth, requireAdmin, (req, res) => {
  const actor = (req as express.Request & { authUser: AuthUser }).authUser;
  const userId = Number(req.params.id);
  const isAdmin = Boolean(req.body?.isAdmin);
  const target = database.prepare('SELECT id, is_admin FROM users WHERE id = ?').get(userId) as { id: number; is_admin: number } | undefined;
  if (!target) return res.status(404).json({ message: 'User not found.' });
  if (target.id === actor.id && !isAdmin) return res.status(400).json({ message: 'You cannot remove your own administrator access.' });
  if (!isAdmin && target.is_admin) {
    const admins = database.prepare('SELECT count(*) AS count FROM users WHERE is_admin = 1').get() as { count: number };
    if (admins.count <= 1) return res.status(400).json({ message: 'At least one administrator must remain.' });
  }
  database.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, userId);
  return res.json({ success: true, message: isAdmin ? 'Administrator access granted.' : 'Administrator access removed.' });
});

// Payment credentials are deployment secrets, never source-code defaults.
const MARZPAY_BASIC_AUTH = process.env.MARZPAY_BASIC_AUTH;
const MARZPAY_WEBHOOK_SECRET = process.env.MARZPAY_WEBHOOK_SECRET;
const MARZPAY_BASE_URL = 'https://wallet.wearemarz.com/api/v1';

if (isProduction && (!MARZPAY_BASIC_AUTH || !MARZPAY_WEBHOOK_SECRET)) {
  throw new Error('MARZPAY_BASIC_AUTH and MARZPAY_WEBHOOK_SECRET must be set in production.');
}

// In-memory status store for tracking real-time transaction updates
interface MarzPayTransactionState {
  uuid: string;
  reference: string;
  phone: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  provider_tx_id?: string;
  created_at: string;
  updated_at: string;
  raw_response?: any;
}

const transactionStore = new Map<string, MarzPayTransactionState>();

// Normalize Ugandan phone numbers (+256701..., 256701..., 0701... -> +256701...)
function normalizeUgandaPhone(phone: string): { formatted: string; national: string; network: 'MTN' | 'Airtel' | 'Other' } {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '+256' + cleaned.substring(1);
  } else if (cleaned.startsWith('256')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length === 9) {
    cleaned = '+256' + cleaned;
  }

  const national = cleaned.startsWith('+256') ? '0' + cleaned.substring(4) : cleaned;
  let network: 'MTN' | 'Airtel' | 'Other' = 'Other';

  if (/^(\+256|0)(77|78|76|39)/.test(cleaned)) {
    network = 'MTN';
  } else if (/^(\+256|0)(70|75|74)/.test(cleaned)) {
    network = 'Airtel';
  }

  return { formatted: cleaned, national, network };
}

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 1. Initiate MarzPay Top-Up Collection (USSD MoMo Push Prompt)
app.post('/api/marzpay/topup', requireAuth, async (req, res) => {
  try {
    if (!MARZPAY_BASIC_AUTH) return res.status(503).json({ success: false, message: 'Payment service is not configured.' });
    const { phone_number, amount, user_id, description, reference } = req.body;

    const amountUgx = Number(amount);
    if (!amountUgx || isNaN(amountUgx) || amountUgx < 500) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid amount. Minimum deposit is UGX 500.' 
      });
    }

    if (!phone_number) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required for Mobile Money prompt.' 
      });
    }

    const { formatted: normalizedPhone, network } = normalizeUgandaPhone(phone_number);
    const txRef = reference || `TOPUP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const txUuid = crypto.randomUUID();

    console.log(`[MarzPay] Initiating MoMo collect of UGX ${amountUgx} to ${normalizedPhone} (${network}) - Ref: ${txRef}`);

    // Call MarzPay Collect-Money API
    let marzPayResponse: Response;
    let marzPayData: any = null;

    try {
      marzPayResponse = await fetch(`${MARZPAY_BASE_URL}/collect-money`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${MARZPAY_BASIC_AUTH}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          phone_number: normalizedPhone,
          amount: Math.round(amountUgx),
          country: 'UG',
          reference: txUuid, // MarzPay expects reference parameter
          description: description || `Wallet Top Up - UGX ${amountUgx.toLocaleString()}`,
          callback_url: `${req.protocol}://${req.get('host')}/api/marzpay/webhook`
        })
      });

      const responseText = await marzPayResponse.text();
      try {
        marzPayData = JSON.parse(responseText);
      } catch {
        marzPayData = { text: responseText };
      }

      console.log(`[MarzPay Response Code ${marzPayResponse.status}]:`, marzPayData);
    } catch (fetchErr: any) {
      console.warn('[MarzPay Fetch Warning]:', fetchErr.message);
    }

    // Determine UUID from provider or fallback to generated UUID
    const finalUuid = marzPayData?.data?.transaction?.uuid || marzPayData?.data?.uuid || txUuid;
    const providerStatus = (marzPayData?.status === 'success' || marzPayData?.data?.status === 'success' || marzPayData?.data?.transaction?.status === 'completed')
      ? 'pending' // Active prompt sent, waiting for user PIN
      : 'pending';

    // Store in local transaction registry
    const newTx: MarzPayTransactionState = {
      uuid: finalUuid,
      reference: txRef,
      phone: normalizedPhone,
      amount: amountUgx,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_response: marzPayData
    };
    transactionStore.set(finalUuid, newTx);
    transactionStore.set(txRef, newTx);

    return res.json({
      success: true,
      transaction_uuid: finalUuid,
      reference: txRef,
      phone: normalizedPhone,
      network,
      amount: amountUgx,
      status: 'pending',
      message: `MoMo PIN prompt sent to ${normalizedPhone} (${network})! Please check your phone screen and enter your Mobile Money PIN to approve UGX ${amountUgx.toLocaleString()}.`,
      provider_response: marzPayData
    });
  } catch (error: any) {
    console.error('[MarzPay Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate MarzPay collection.'
    });
  }
});

// 2. Check MarzPay Collection Status
app.get('/api/marzpay/check-status', requireAuth, async (req, res) => {
  try {
    if (!MARZPAY_BASIC_AUTH) return res.status(503).json({ success: false, message: 'Payment service is not configured.' });
    const uuid = (req.query.uuid as string) || (req.query.reference as string);

    if (!uuid) {
      return res.status(400).json({ success: false, message: 'UUID or Reference is required.' });
    }

    const localTx = transactionStore.get(uuid);

    // Query MarzPay API for latest status
    let liveStatus: string | null = null;
    let liveData: any = null;

    try {
      const response = await fetch(`${MARZPAY_BASE_URL}/collect-money/${uuid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${MARZPAY_BASIC_AUTH}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        liveData = await response.json();
        const txObj = liveData?.data?.transaction || liveData?.data;
        if (txObj?.status === 'completed' || txObj?.status === 'successful' || txObj?.status === 'paid' || liveData?.status === 'success') {
          liveStatus = 'paid';
        } else if (txObj?.status === 'failed' || txObj?.status === 'rejected') {
          liveStatus = 'failed';
        }
      }
    } catch (err: any) {
      console.warn('[MarzPay Check Error]:', err.message);
    }

    const currentStatus = liveStatus || localTx?.status || 'pending';

    if (localTx && liveStatus) {
      localTx.status = liveStatus as any;
      localTx.updated_at = new Date().toISOString();
    }

    return res.json({
      success: true,
      uuid,
      status: currentStatus,
      amount: localTx?.amount,
      phone: localTx?.phone,
      reference: localTx?.reference,
      provider_data: liveData || localTx?.raw_response
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 3. MarzPay Webhook Handler
app.post('/api/marzpay/webhook', (req, res) => {
  try {
    const payload = req.body;
    console.log('[MarzPay Webhook Received]:', JSON.stringify(payload, null, 2));

    const uuid = payload?.data?.transaction?.uuid || payload?.data?.uuid || payload?.reference || payload?.uuid;
    const status = payload?.data?.transaction?.status || payload?.data?.status || payload?.status;

    if (uuid && transactionStore.has(uuid)) {
      const tx = transactionStore.get(uuid)!;
      if (status === 'completed' || status === 'successful' || status === 'paid') {
        tx.status = 'paid';
        tx.provider_tx_id = payload?.data?.transaction?.provider_transaction_id || payload?.provider_transaction_id;
      } else if (status === 'failed' || status === 'rejected') {
        tx.status = 'failed';
      }
      tx.updated_at = new Date().toISOString();
      tx.raw_response = payload;
    }

    return res.status(200).json({ status: 'ok', received: true });
  } catch (err: any) {
    console.error('[MarzPay Webhook Error]:', err);
    return res.status(200).json({ status: 'error', message: err.message });
  }
});

// ==========================================
// VITE MIDDLEWARE & SERVER STARTUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Live and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
