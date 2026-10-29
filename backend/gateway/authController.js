import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../shared/supabase.js';
import { config } from '../shared/config.js';
import { logAudit } from './auditLogger.js';

export async function login(req, res) {
  const { username, password } = req.body;
  const deviceId = req.headers['x-device-id'];
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!username || !password) {
    await logAudit({
      subject: username || 'unknown',
      endpoint: '/auth/login',
      method: 'POST',
      deviceId: deviceId || 'NONE',
      decision: 'DENY',
      reason: 'Missing username or password',
      ipAddress: clientIp
    });
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  // 1. Cek User di Database
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (userErr || !user) {
    await logAudit({
      subject: username,
      endpoint: '/auth/login',
      method: 'POST',
      deviceId: deviceId || 'NONE',
      decision: 'DENY',
      reason: 'User not found in system',
      ipAddress: clientIp
    });
    return res.status(401).json({ error: 'Kredensial tidak valid' });
  }

  // 2. Verifikasi Password
  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    await logAudit({
      subject: username,
      role: user.role,
      endpoint: '/auth/login',
      method: 'POST',
      deviceId: deviceId || 'NONE',
      decision: 'DENY',
      reason: 'Invalid password',
      ipAddress: clientIp
    });
    return res.status(401).json({ error: 'Kredensial tidak valid' });
  }

  // 3. Verifikasi Konteks: Device ID Wajib Terdaftar (Zero Trust Context Check)
  if (!deviceId) {
    await logAudit({
      subject: username,
      role: user.role,
      endpoint: '/auth/login',
      method: 'POST',
      deviceId: 'NONE',
      decision: 'DENY',
      reason: 'Header X-Device-ID missing on login',
      ipAddress: clientIp
    });
    return res.status(403).json({ error: 'Header X-Device-ID diperlukan untuk mengakses sistem Zero Trust' });
  }

  const { data: device, error: devErr } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', user.id)
    .eq('device_id', deviceId)
    .eq('is_active', true)
    .single();

  if (devErr || !device) {
    await logAudit({
      subject: username,
      role: user.role,
      endpoint: '/auth/login',
      method: 'POST',
      deviceId,
      decision: 'DENY',
      reason: `Device ID ${deviceId} is not registered for user ${username}`,
      ipAddress: clientIp
    });
    return res.status(403).json({ error: `Perangkat (${deviceId}) tidak terdaftar untuk akun ini` });
  }

  // 4. Terbitkan Tokens
  // Access Token: berlaku 10 menit (expiresIn: '10m')
  const accessToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
      nim_or_nip: user.nim_or_nip,
      deviceId: deviceId
    },
    config.jwtSecret,
    { expiresIn: '10m' }
  );

  // Refresh Token: berlaku 1 hari (expiresIn: '1d'), disimpan di database untuk revocation
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      username: user.username,
      type: 'refresh'
    },
    config.jwtSecret,
    { expiresIn: '1d' }
  );

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: expiresAt,
    is_revoked: false
  });

  await logAudit({
    subject: username,
    role: user.role,
    endpoint: '/auth/login',
    method: 'POST',
    deviceId,
    decision: 'ALLOW',
    reason: 'Successful authentication and verified device context',
    ipAddress: clientIp
  });

  return res.json({
    message: 'Login berhasil',
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
      nim_or_nip: user.nim_or_nip,
      activeDevice: device.device_name
    }
  });
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token wajib disertakan' });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.jwtSecret);

    // Cek di database apakah token dicabut (Revocation Check)
    const { data: storedToken, error } = await supabase
      .from('refresh_tokens')
      .select('*, users(*)')
      .eq('token', refreshToken)
      .eq('is_revoked', false)
      .single();

    if (error || !storedToken) {
      await logAudit({
        subject: decoded.username || decoded.sub,
        endpoint: '/auth/refresh',
        method: 'POST',
        decision: 'DENY',
        reason: 'Refresh token revoked or invalid in database',
        ipAddress: clientIp
      });
      return res.status(401).json({ error: 'Refresh token sudah dicabut atau tidak valid' });
    }

    const user = storedToken.users;
    const newAccessToken = jwt.sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        nim_or_nip: user.nim_or_nip
      },
      config.jwtSecret,
      { expiresIn: '10m' }
    );

    await logAudit({
      subject: user.username,
      role: user.role,
      endpoint: '/auth/refresh',
      method: 'POST',
      decision: 'ALLOW',
      reason: 'Token refresh granted',
      ipAddress: clientIp
    });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.status(401).json({ error: 'Token refresh kadaluarsa atau tanda tangan tidak valid' });
  }
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token diperlukan untuk logout' });
  }

  // Cabut token di database
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ is_revoked: true, revoked_at: new Date().toISOString() })
    .eq('token', refreshToken);

  await logAudit({
    subject: 'logout_caller',
    endpoint: '/auth/logout',
    method: 'POST',
    decision: 'ALLOW',
    reason: 'Refresh token revoked successfully',
    ipAddress: clientIp
  });

  return res.json({ message: 'Logout berhasil, refresh token telah dicabut' });
}

export async function serviceToken(req, res) {
  const { clientId, clientSecret } = req.body;
  const clientIp = req.ip || req.connection.remoteAddress;

  if (clientId !== config.serviceClientId || clientSecret !== config.serviceClientSecret) {
    await logAudit({
      subject: clientId || 'unknown_service',
      endpoint: '/auth/service',
      method: 'POST',
      decision: 'DENY',
      reason: 'Invalid service client credentials',
      ipAddress: clientIp
    });
    return res.status(401).json({ error: 'Kredensial Service tidak valid' });
  }

  // Token service: masa berlaku 5 menit (expiresIn: '5m') dengan role: 'service'
  const serviceToken = jwt.sign(
    {
      sub: clientId,
      role: 'service',
      serviceName: 'Service Nilai'
    },
    config.jwtSecret,
    { expiresIn: '5m' }
  );

  await logAudit({
    subject: clientId,
    role: 'service',
    endpoint: '/auth/service',
    method: 'POST',
    decision: 'ALLOW',
    reason: 'Service token issued (5m validity)',
    ipAddress: clientIp
  });

  return res.json({
    message: 'Token service berhasil diterbitkan',
    token: serviceToken,
    expiresIn: '5m',
    role: 'service'
  });
}
