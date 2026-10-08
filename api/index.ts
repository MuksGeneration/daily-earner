import express from 'express';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

type AuthUser = {
  id: number;
  name: string;
  phone: string;
  password_hash: string;
  trade_password_hash: string;
  referral_code: string;
  referred_by_id: number | null;
  is_admin: boolean;
  created_at: string;
};

const app = express();
app.use(express.json({ verify: (req, _res, buffer) => { (req as express.Request & { rawBody?: Buffer }).rawBody = buffer; } }));
app.use(express.urlencoded({ extended: true }));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sessionSecret = process.env.SESSION_SECRET;

if (!supabaseUrl || !serviceRoleKey || !sessionSecret) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SESSION_SECRET must be configured.');
}

const database = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
};
const verifyPassword = (password: string, storedHash: string) => {
  const [salt, expected] = storedHash.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
};
const normalizePhone = (phone: string) => {
  let value = phone.trim().replace(/\s+/g, '');
  if (value.startsWith('0')) value = `+256${value.slice(1)}`;
  else if (value.startsWith('256')) value = `+${value}`;
  else if (!value.startsWith('+')) value = `+256${value}`;
  return value;
};
const sessionHash = (token: string) => crypto.createHmac('sha256', sessionSecret).update(token).digest('hex');
const bearerToken = (req: express.Request) => req.get('authorization')?.replace(/^Bearer\s+/i, '');
const marzpayAuth = process.env.MARZPAY_BASIC_AUTH;
const marzpayWebhookSecret = process.env.MARZPAY_WEBHOOK_SECRET;
const marzpayBaseUrl = 'https://wallet.wearemarz.com/api/v1';

const generateReferralCode = async () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const letters = Array.from({ length: 3 }, () => alphabet[crypto.randomInt(alphabet.length)]).join('');
    const code = `${letters}${crypto.randomInt(100, 1_000)}`;
    const { data, error } = await database.from('users').select('id').eq('referral_code', code).maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error('Could not generate a unique referral code.');
};

const ensureAdmin = async () => {
  const phone = process.env.ADMIN_PHONE ? normalizePhone(process.env.ADMIN_PHONE) : '';
  const password = process.env.ADMIN_INITIAL_PASSWORD;
  if (!phone || !password) return;
  const { data: existing, error: findError } = await database.from('users').select('id').eq('phone', phone).maybeSingle();
  if (findError) throw findError;
  if (existing) return;
  const { data: admin, error } = await database.from('users').insert({
    name: process.env.ADMIN_NAME || 'Administrator', phone,
    password_hash: hashPassword(password),
    trade_password_hash: hashPassword(process.env.ADMIN_TRADE_PASSWORD || '000000'),
    referral_code: 'ADMIN1', is_admin: true
  }).select().single();
  if (error) throw error;
  const { error: walletError } = await database.from('wallets').insert({ user_id: admin.id, balance_ugx: 0 });
  if (walletError) throw walletError;
};

const publicUser = async (user: AuthUser) => {
  const { data: wallet, error } = await database.from('wallets').select('balance_ugx').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  return {
    id: user.id, name: user.name, phone: user.phone, payout_phone: user.phone,
    payout_name: user.name, payout_network: 'MTN Mobile Money' as const,
    referral_code: user.referral_code, referred_by_id: user.referred_by_id,
    is_admin: user.is_admin, wallet_balance_ugx: Number(wallet?.balance_ugx || 0), created_at: user.created_at,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`
  };
};

const readSession = async (token?: string): Promise<AuthUser | undefined> => {
  if (!token) return undefined;
  const { data: session, error: sessionError } = await database.from('sessions').select('user_id').eq('token_hash', sessionHash(token)).gt('expires_at', Date.now()).maybeSingle();
  if (sessionError) throw sessionError;
  if (!session) return undefined;
  const { data: user, error: userError } = await database.from('users').select('*').eq('id', session.user_id).maybeSingle();
  if (userError) throw userError;
  return user as AuthUser | undefined;
};

const requireAuth: express.RequestHandler = async (req, res, next) => {
  try {
    const user = await readSession(bearerToken(req));
    if (!user) return res.status(401).json({ message: 'Authentication is required.' });
    (req as express.Request & { authUser?: AuthUser }).authUser = user;
    next();
  } catch (error) { next(error); }
};

const requireAdmin: express.RequestHandler = (req, res, next) => {
  const user = (req as express.Request & { authUser?: AuthUser }).authUser;
  if (!user?.is_admin) return res.status(403).json({ message: 'Administrator access is required.' });
  next();
};

app.get('/api/health', async (_req, res, next) => {
  try { await ensureAdmin(); res.json({ status: 'ok', time: new Date().toISOString() }); } catch (error) { next(error); }
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    await ensureAdmin();
    const { name, phone, password, tradePassword, invitationCode } = req.body as Record<string, string>;
    const normalizedPhone = normalizePhone(phone || '');
    if (!name?.trim() || !/^\+256\d{9}$/.test(normalizedPhone) || !password || password.length < 6 || !/^\d{6}$/.test(tradePassword || '') || !invitationCode?.trim()) {
      return res.status(400).json({ message: 'Provide a name, valid Ugandan phone number, password, 6-digit trade password, and referral code.' });
    }
    const { data: referrer, error: referrerError } = await database.from('users').select('id').ilike('referral_code', invitationCode.trim()).maybeSingle();
    if (referrerError) throw referrerError;
    if (!referrer) return res.status(400).json({ message: 'This referral code is invalid. Ask a registered user for their invite code.' });
    const referralCode = await generateReferralCode();
    const { data: user, error } = await database.from('users').insert({
      name: name.trim(), phone: normalizedPhone, password_hash: hashPassword(password),
      trade_password_hash: hashPassword(tradePassword), referral_code: referralCode, referred_by_id: referrer.id
    }).select('*').single();
    if (error) return res.status(409).json({ message: error.code === '23505' ? 'That phone number is already registered.' : 'Could not create account.' });
    const { error: walletError } = await database.from('wallets').insert({ user_id: user.id, balance_ugx: 0 });
    if (walletError) throw walletError;
    const token = crypto.randomBytes(48).toString('base64url');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
    const { error: sessionError } = await database.from('sessions').insert({ token_hash: sessionHash(token), user_id: user.id, expires_at: expiresAt });
    if (sessionError) throw sessionError;
    return res.status(201).json({ user: await publicUser(user as AuthUser), token, expiresAt });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    await ensureAdmin();
    const phone = normalizePhone(req.body?.phone || '');
    const { data: user, error } = await database.from('users').select('*').eq('phone', phone).maybeSingle();
    if (error) throw error;
    if (!user || !verifyPassword(req.body?.password || '', user.password_hash)) return res.status(401).json({ message: 'Invalid phone number or password.' });
    const token = crypto.randomBytes(48).toString('base64url');
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7;
    const { error: sessionError } = await database.from('sessions').insert({ token_hash: sessionHash(token), user_id: user.id, expires_at: expiresAt });
    if (sessionError) throw sessionError;
    return res.json({ user: await publicUser(user as AuthUser), token, expiresAt });
  } catch (error) { next(error); }
});

app.get('/api/auth/me', async (req, res, next) => {
  try {
    const user = await readSession(bearerToken(req));
    if (!user) return res.status(401).json({ message: 'Session expired or invalid.' });
    return res.json({ user: await publicUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (token) { const { error } = await database.from('sessions').delete().eq('token_hash', sessionHash(token)); if (error) throw error; }
    return res.status(204).end();
  } catch (error) { next(error); }
});

app.post('/api/auth/verify-trade-password', requireAuth, async (req, res, next) => {
  try {
    const user = (req as express.Request & { authUser: AuthUser }).authUser;
    if (!verifyPassword(String(req.body?.tradePassword || ''), user.trade_password_hash)) return res.status(401).json({ message: 'Incorrect trade password. Withdrawal cancelled.' });
    return res.json({ success: true });
  } catch (error) { next(error); }
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await database
      .from('users')
      .select('id, name, phone, is_admin, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ users: data || [] });
  } catch (error) { next(error); }
});

app.patch('/api/admin/users/:userId/role', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const admin = (req as express.Request & { authUser: AuthUser }).authUser;
    const userId = Number(req.params.userId);
    const { isAdmin } = req.body as { isAdmin?: unknown };
    if (!Number.isInteger(userId) || userId <= 0 || typeof isAdmin !== 'boolean') {
      return res.status(400).json({ message: 'Provide a valid user and administrator status.' });
    }
    if (userId === admin.id && !isAdmin) {
      return res.status(400).json({ message: 'You cannot remove your own administrator access.' });
    }
    const { data, error } = await database
      .from('users')
      .update({ is_admin: isAdmin })
      .eq('id', userId)
      .select('id, name, phone, is_admin, created_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ message: 'User not found.' });
    return res.json({ message: isAdmin ? 'Administrator access granted.' : 'Administrator access removed.', user: data });
  } catch (error) { next(error); }
});

app.post('/api/auth/change-password', requireAuth, async (req, res, next) => {
  try {
    const user = (req as express.Request & { authUser: AuthUser }).authUser;
    const kind = req.body?.kind === 'trade' ? 'trade' : 'login';
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if ((kind === 'trade' && !/^\d{6}$/.test(newPassword)) || (kind === 'login' && newPassword.length < 6)) {
      return res.status(400).json({ message: kind === 'trade' ? 'Trade password must be exactly 6 digits.' : 'Login password must contain at least 6 characters.' });
    }
    const column = kind === 'trade' ? 'trade_password_hash' : 'password_hash';
    const { data: credential, error } = await database.from('users').select(column).eq('id', user.id).single();
    if (error) throw error;
    if (!credential || !verifyPassword(currentPassword, (credential as Record<string, string>)[column])) {
      return res.status(401).json({ message: `Current ${kind === 'trade' ? 'trade' : 'login'} password is incorrect.` });
    }
    const { error: updateError } = await database.from('users').update({ [column]: hashPassword(newPassword) }).eq('id', user.id);
    if (updateError) throw updateError;
    return res.json({ success: true, message: `${kind === 'trade' ? 'Trade' : 'Login'} password updated successfully.` });
  } catch (error) { next(error); }
});

app.get('/api/messages', requireAuth, async (req, res, next) => {
  try {
    const user = (req as express.Request & { authUser: AuthUser }).authUser;
    const { data: messages, error } = await database.from('messages')
      .select('id, subject, body, created_at, sender_user_id').eq('recipient_user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    const senderIds = [...new Set((messages || []).map(message => message.sender_user_id))];
    const { data: senders, error: senderError } = senderIds.length ? await database.from('users').select('id, name').in('id', senderIds) : { data: [], error: null };
    if (senderError) throw senderError;
    const senderNames = new Map((senders || []).map(sender => [sender.id, sender.name]));
    return res.json({ messages: (messages || []).map(message => ({ ...message, sender_name: senderNames.get(message.sender_user_id) || 'Administrator' })) });
  } catch (error) { next(error); }
});

app.post('/api/admin/messages', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const sender = (req as express.Request & { authUser: AuthUser }).authUser;
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '').trim();
    if (!subject || !body) return res.status(400).json({ message: 'Provide a subject and message.' });
    const { data: recipients, error: recipientError } = await database.from('users').select('id');
    if (recipientError) throw recipientError;
    const now = new Date().toISOString();
    const messages = (recipients || []).map(recipient => ({ recipient_user_id: recipient.id, sender_user_id: sender.id, subject, body, created_at: now }));
    if (messages.length) {
      const { error } = await database.from('messages').insert(messages);
      if (error) throw error;
    }
    return res.status(201).json({ success: true, message: `Message sent to ${messages.length} user(s).` });
  } catch (error) { next(error); }
});

const treasureCode = () => `DE-${crypto.randomBytes(6).toString('base64url').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4)}-${crypto.randomBytes(6).toString('base64url').replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 4)}`;

app.post('/api/admin/treasure-chests', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const admin = (req as express.Request & { authUser: AuthUser }).authUser;
    const now = new Date(); const expiresAt = new Date(now.getTime() + 3 * 60 * 1000).toISOString();
    const maxReward = Math.min(Math.max(Number(req.body?.rewardAmount) || 20_000, 500), 20_000);
    const code = treasureCode();
    const { error } = await database.from('treasure_campaigns').insert({ code, max_reward_ugx: maxReward, created_at: now.toISOString(), expires_at: expiresAt, created_by: admin.id });
    if (error) throw error;
    return res.status(201).json({ success: true, code, rewardCap: maxReward, expiresAt, message: `Shared code ${code} is active for all users for three minutes.` });
  } catch (error) { next(error); }
});

app.get('/api/admin/treasure-chests', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { data: chests, error } = await database.from('treasure_campaigns').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    const campaignIds = (chests || []).map(chest => chest.id);
    const { data: redemptions, error: redemptionError } = campaignIds.length ? await database.from('treasure_redemptions').select('campaign_id').in('campaign_id', campaignIds) : { data: [], error: null };
    if (redemptionError) throw redemptionError;
    const counts = new Map<number, number>();
    (redemptions || []).forEach(redemption => counts.set(redemption.campaign_id, (counts.get(redemption.campaign_id) || 0) + 1));
    return res.json({ chests: (chests || []).map(chest => ({ ...chest, redemption_count: counts.get(chest.id) || 0, status: new Date(chest.expires_at) > new Date() ? 'active' : 'expired' })) });
  } catch (error) { next(error); }
});

app.post('/api/treasure/redeem', requireAuth, async (req, res, next) => {
  try {
    const user = (req as express.Request & { authUser: AuthUser }).authUser;
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!/^DE-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) return res.status(400).json({ message: 'Invalid Treasure Chest code.' });
    const { data, error } = await database.rpc('redeem_treasure_campaign', { p_code: code, p_user_id: user.id });
    if (error) return res.status(400).json({ message: error.message || 'Could not redeem code.' });
    const result = Array.isArray(data) ? data[0] : data;
    return res.json({ success: true, rewardAmount: Number(result.reward_amount), balanceUgx: Number(result.balance_ugx) });
  } catch (error) { next(error); }
});

const findMarzpayTransaction = async (identifier: string) => {
  const byId = await database.from('marzpay_transactions').select('*').eq('id', identifier).maybeSingle();
  if (byId.error && byId.error.code !== '22P02') throw byId.error;
  if (byId.data) return byId.data;
  const byProviderId = await database.from('marzpay_transactions').select('*').eq('marzpay_uuid', identifier).maybeSingle();
  if (byProviderId.error) throw byProviderId.error;
  if (byProviderId.data) return byProviderId.data;
  const byReference = await database.from('marzpay_transactions').select('*').eq('reference', identifier).maybeSingle();
  if (byReference.error) throw byReference.error;
  return byReference.data;
};

const providerIsPaid = (status: unknown) => ['completed', 'successful', 'success', 'paid'].includes(String(status || '').toLowerCase());
const providerIsFailed = (status: unknown) => ['failed', 'rejected', 'cancelled'].includes(String(status || '').toLowerCase());

app.post('/api/marzpay/topup', requireAuth, async (req, res, next) => {
  try {
    if (!marzpayAuth || !marzpayWebhookSecret) return res.status(503).json({ success: false, message: 'Payment service is not configured.' });
    const user = (req as express.Request & { authUser: AuthUser }).authUser;
    const amount = Number(req.body?.amount);
    const phone = normalizePhone(String(req.body?.phone_number || ''));
    if (!Number.isInteger(amount) || amount < 500 || amount > 10_000_000 || !/^\+256\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Provide a valid Ugandan phone number and an amount from UGX 500 to 10,000,000.' });
    }
    const id = crypto.randomUUID(); const reference = crypto.randomUUID();
    const { error: createError } = await database.from('marzpay_transactions').insert({ id, user_id: user.id, reference, phone, amount_ugx: amount });
    if (createError) throw createError;
    const callbackUrl = `https://${req.get('host')}/api/marzpay/webhook`;
    const providerResponse = await fetch(`${marzpayBaseUrl}/collect-money`, {
      method: 'POST', headers: { Authorization: `Basic ${marzpayAuth}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ amount, phone_number: phone, country: 'UG', reference, description: String(req.body?.description || 'Wallet top-up').slice(0, 200), callback_url: callbackUrl, metadata: [{ transaction_id: id }] })
    });
    const providerPayload = await providerResponse.json().catch(() => ({}));
    const providerTransaction = providerPayload?.transaction || providerPayload?.data?.transaction || providerPayload?.data || {};
    const providerUuid = providerTransaction.uuid;
    const { error: updateError } = await database.from('marzpay_transactions').update({ marzpay_uuid: providerUuid || null, provider_payload: providerPayload, status: providerIsFailed(providerTransaction.status) ? 'failed' : 'pending', updated_at: new Date().toISOString() }).eq('id', id);
    if (updateError) throw updateError;
    if (!providerResponse.ok) return res.status(502).json({ success: false, message: providerPayload?.message || 'Could not initiate the payment prompt.' });
    return res.json({ success: true, transaction_uuid: id, reference, phone, amount, status: 'pending', message: 'Mobile Money prompt sent. Enter your PIN to approve the payment.' });
  } catch (error) { next(error); }
});

app.get('/api/marzpay/check-status', requireAuth, async (req, res, next) => {
  try {
    if (!marzpayAuth) return res.status(503).json({ success: false, message: 'Payment service is not configured.' });
    const user = (req as express.Request & { authUser: AuthUser }).authUser;
    const identifier = String(req.query.uuid || '');
    const payment = await findMarzpayTransaction(identifier);
    if (!payment || payment.user_id !== user.id) return res.status(404).json({ success: false, message: 'Payment transaction not found.' });
    if (payment.marzpay_uuid && payment.status === 'pending') {
      const response = await fetch(`${marzpayBaseUrl}/collect-money/${payment.marzpay_uuid}`, { headers: { Authorization: `Basic ${marzpayAuth}`, Accept: 'application/json' } });
      const payload = await response.json().catch(() => ({})); const transaction = payload?.transaction || payload?.data?.transaction || payload?.data || {};
      if (providerIsPaid(transaction.status)) await database.rpc('credit_marzpay_transaction', { p_transaction_id: payment.id, p_provider_tx_id: transaction.provider_transaction_id || null, p_payload: payload });
      else if (providerIsFailed(transaction.status)) await database.from('marzpay_transactions').update({ status: 'failed', provider_payload: payload, updated_at: new Date().toISOString() }).eq('id', payment.id);
    }
    const current = await findMarzpayTransaction(payment.id);
    const balance = current?.status === 'paid' ? await database.from('wallets').select('balance_ugx').eq('user_id', user.id).single() : { data: null };
    return res.json({ success: true, status: current?.status || 'pending', amount: current?.amount_ugx, phone: current?.phone, reference: current?.reference, balanceUgx: balance.data?.balance_ugx });
  } catch (error) { next(error); }
});

app.post('/api/marzpay/webhook', async (req, res) => {
  try {
    const timestamp = req.get('x-marzpay-timestamp'); const signature = req.get('x-marzpay-signature');
    const rawBody = (req as express.Request & { rawBody?: Buffer }).rawBody || Buffer.from('');
    if (!marzpayWebhookSecret || !timestamp || !signature || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return res.status(401).json({ message: 'Invalid webhook signature.' });
    const expected = crypto.createHmac('sha256', marzpayWebhookSecret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex');
    const supplied = signature.match(/v1=([a-f0-9]+)/i)?.[1] || '';
    if (!supplied || supplied.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return res.status(401).json({ message: 'Invalid webhook signature.' });
    const transaction = req.body?.transaction || req.body?.data?.transaction || req.body?.data || {};
    const identifier = transaction.uuid || transaction.reference || req.body?.reference;
    const payment = identifier ? await findMarzpayTransaction(String(identifier)) : null;
    if (payment && providerIsPaid(transaction.status)) await database.rpc('credit_marzpay_transaction', { p_transaction_id: payment.id, p_provider_tx_id: transaction.provider_transaction_id || null, p_payload: req.body });
    else if (payment && providerIsFailed(transaction.status)) await database.from('marzpay_transactions').update({ status: 'failed', provider_payload: req.body, updated_at: new Date().toISOString() }).eq('id', payment.id);
    return res.status(200).json({ status: 'ok' });
  } catch { return res.status(200).json({ status: 'ok' }); }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Server configuration error.' });
});

export default app;
