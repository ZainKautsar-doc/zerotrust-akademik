import express from 'express';
import cors from 'cors';
import { config } from '../shared/config.js';
import { supabase } from '../shared/supabase.js';
import * as authController from './authController.js';
import { policyEngineMiddleware } from './policyEngine.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID', 'X-Simulated-Hour']
}));
app.use(express.json());

// -------------------------------------------------------------
// 1. ENDPOINTS AUTENTIKASI & TOKEN (Gateway PE/PA)
// -------------------------------------------------------------
app.post('/auth/login', authController.login);
app.post('/auth/refresh', authController.refresh);
app.post('/auth/logout', authController.logout);
app.post('/auth/service', authController.serviceToken);

// Endpoint utilitas untuk mengambil device terdaftar (membantu demo di Frontend)
app.get('/api/devices/all', async (req, res) => {
  const { data: devices, error } = await supabase
    .from('devices')
    .select('device_id, device_name, is_active, users(username, full_name, role)');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(devices);
});

// Endpoint untuk audit logs (bisa dilihat oleh Admin di Frontend)
app.get('/api/audit-logs', async (req, res) => {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(logs);
});

// Endpoint daftar akun untuk mempermudah selector di Frontend
app.get('/api/users/seed-accounts', async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, full_name, role, nim_or_nip, devices(device_id, device_name)');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(users);
});

// -------------------------------------------------------------
// 2. POLICY ENFORCEMENT POINT (PEP) INTERCEPTOR
// -------------------------------------------------------------
app.use(policyEngineMiddleware);

// -------------------------------------------------------------
// 3. REVERSE PROXY KE MICROSERVICES DENGAN X-GATEWAY-SECRET
// -------------------------------------------------------------
// Gateway menyisipkan X-Gateway-Secret agar backend service mengetahui bahwa
// request ini telah lolos evaluasi PEP & Policy Engine.
async function forwardToService(targetUrl, req, res) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Gateway-Secret': config.gatewaySecret,
      'Authorization': req.headers['authorization'] || ''
    };

    const fetchOptions = {
      method: req.method,
      headers
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method) && Object.keys(req.body || {}).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get('content-type');
    
    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return res.status(response.status).send(responseData);
  } catch (err) {
    console.error(`[Gateway Proxy Error] Target: ${targetUrl}`, err.message);
    return res.status(502).json({
      error: `Gateway Error: Gagal menghubungi downstream service (${err.message})`
    });
  }
}

// Routing ke Service Nilai (Port 3001)
// - GET /nilai
// - PUT /nilai/:id
// - POST /kelas/:id/finalisasi
// - GET /kelas
app.use(['/nilai', '/kelas'], (req, res) => {
  const targetUrl = `http://127.0.0.1:${config.portNilai}${req.originalUrl}`;
  return forwardToService(targetUrl, req, res);
});

// Routing ke Service Transkrip (Port 3002)
// - GET /transkrip/:nim
// - POST /transkrip/sinkron
app.use('/transkrip', (req, res) => {
  const targetUrl = `http://127.0.0.1:${config.portTranskrip}${req.originalUrl}`;
  return forwardToService(targetUrl, req, res);
});

// Start Server Gateway
app.listen(config.portGateway, () => {
  console.log(`[API GATEWAY - PEP & PE/PA] Running on port ${config.portGateway}`);
  console.log(`  - Business Hours Enforced: ${config.accessHourStart} - ${config.accessHourEnd}`);
});
