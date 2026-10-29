import jwt from 'jsonwebtoken';
import { config } from '../shared/config.js';

export function verifyGatewayAndToken(req, res, next) {
  // 1. Verifikasi Gateway Secret
  const gatewaySecret = req.headers['x-gateway-secret'];
  if (!gatewaySecret || gatewaySecret !== config.gatewaySecret) {
    console.warn('[Service Transkrip] Direct access attempt without valid X-Gateway-Secret blocked!');
    return res.status(403).json({
      error: 'Direct Access Forbidden: Akses langsung ke service internal diblokir. Wajib melalui API Gateway!'
    });
  }

  // 2. Verifikasi JWT
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token Bearer tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: `Unauthorized: Token verifikasi gagal di service (${err.message})` });
  }
}
