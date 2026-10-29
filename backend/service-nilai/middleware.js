import jwt from 'jsonwebtoken';
import { config } from '../shared/config.js';

export function verifyGatewayAndToken(req, res, next) {
  // 1. Verifikasi Gateway Secret (Mencegah Bypass Langsung ke Port Service)
  const gatewaySecret = req.headers['x-gateway-secret'];
  if (!gatewaySecret || gatewaySecret !== config.gatewaySecret) {
    console.warn('[Service Nilai] Direct access attempt without valid X-Gateway-Secret blocked!');
    return res.status(403).json({
      error: 'Direct Access Forbidden: Akses langsung ke service internal diblokir. Wajib melalui API Gateway!'
    });
  }

  // 2. Verifikasi Ulang Tanda Tangan & Masa Berlaku JWT (Zero Trust: Defense-in-depth)
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token Bearer tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded; // tempelkan payload ke request
    return next();
  } catch (err) {
    return res.status(401).json({ error: `Unauthorized: Token verifikasi gagal di service (${err.message})` });
  }
}
