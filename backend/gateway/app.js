import express from 'express';
import cors from 'cors';
import { config } from '../shared/config.js';
import { supabase } from '../shared/supabase.js';
import * as authController from './authController.js';
import { policyEngineMiddleware } from './policyEngine.js';
import { nilaiRouter } from '../service-nilai/router.js';
import { transkripRouter } from '../service-transkrip/router.js';

export const app = express();

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// 1. PUBLIC AUTH & HELPER ENDPOINTS
// -------------------------------------------------------------
app.post('/auth/login', authController.login);
app.post('/auth/refresh', authController.refresh);
app.post('/auth/logout', authController.logout);
app.post('/auth/service', authController.serviceToken);

app.get('/api/devices/all', async (req, res) => {
  const { data: devices, error } = await supabase
    .from('devices')
    .select('*, users(full_name, username, role)')
    .order('registered_at', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  return res.json(devices);
});

app.get('/api/audit-logs', async (req, res) => {
  const { data: logs, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  return res.json(logs);
});

app.get('/api/users/seed-accounts', async (req, res) => {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, full_name, role, nim_or_nip, devices(device_id, device_name)');
  if (error) return res.status(500).json({ error: error.message });
  return res.json(users);
});

// -------------------------------------------------------------
// 2. POLICY ENFORCEMENT POINT (PEP) & POLICY DECISION POINT (PDP)
// -------------------------------------------------------------
app.use(policyEngineMiddleware);

// -------------------------------------------------------------
// 3. ZERO TRUST INTERNAL ROUTING DENGAN DEFENSE-IN-DEPTH
// -------------------------------------------------------------
// Suntikkan header X-Gateway-Secret pada request yang lolos evaluasi PEP
app.use((req, res, next) => {
  req.headers['x-gateway-secret'] = config.gatewaySecret;
  next();
});

// Forward ke Router Nilai & Transkrip
app.use(nilaiRouter);
app.use(transkripRouter);

export default app;
