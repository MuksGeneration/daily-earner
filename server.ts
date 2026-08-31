import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MarzPay Credentials (from environment or default live credentials provided)
const MARZPAY_BASIC_AUTH = process.env.MARZPAY_BASIC_AUTH || 'bWFyel9KS29Oek5oeE1rYUV1R2dLOnVqWkU0SldIaVltdUc2aVpzZDNmRDl0c2Uzb2NweUZy';
const MARZPAY_WEBHOOK_SECRET = process.env.MARZPAY_WEBHOOK_SECRET || 'whsec_m94XQB3iJppCqrIDdqkCHr0wwMWhOnQSYKPYVAV7';
const MARZPAY_BASE_URL = 'https://wallet.wearemarz.com/api/v1';

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
app.post('/api/marzpay/topup', async (req, res) => {
  try {
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
app.get('/api/marzpay/check-status', async (req, res) => {
  try {
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

// 3. Complete / Confirm Simulation (e.g. For Sandbox or Instant Verification)
app.post('/api/marzpay/simulate-confirm', (req, res) => {
  const { uuid } = req.body;
  if (!uuid) {
    return res.status(400).json({ success: false, message: 'UUID is required' });
  }

  const tx = transactionStore.get(uuid);
  if (tx) {
    tx.status = 'paid';
    tx.updated_at = new Date().toISOString();
    tx.provider_tx_id = `MP-SIM-${Date.now()}`;
  }

  return res.json({
    success: true,
    status: 'paid',
    message: 'Payment confirmed successfully.',
    transaction: tx
  });
});

// 4. MarzPay Webhook Handler
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
