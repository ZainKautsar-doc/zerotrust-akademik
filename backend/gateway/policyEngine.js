import jwt from 'jsonwebtoken';
import { supabase } from '../shared/supabase.js';
import { config } from '../shared/config.js';
import { logAudit } from './auditLogger.js';

export async function policyEngineMiddleware(req, res, next) {
  const path = req.path;
  const method = req.method;
  const clientIp = req.ip || req.connection.remoteAddress;

  // 1. Bypass untuk rute /auth/* (ditangani langsung oleh authController)
  if (path.startsWith('/auth/')) {
    return next();
  }

  // 2. Ekstrak Header Authorization dan X-Device-ID
  const authHeader = req.headers['authorization'];
  const deviceId = req.headers['x-device-id'];
  const simulatedHour = req.headers['x-simulated-hour']; // Untuk demo jam akses dari UI

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logAudit({
      subject: 'anonymous',
      endpoint: path,
      method,
      deviceId: deviceId || 'NONE',
      decision: 'DENY',
      reason: 'Missing or malformed Authorization header (Bearer token required)',
      ipAddress: clientIp
    });
    return res.status(401).json({ error: 'Zero Trust Deny: Token otorisasi tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;

  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    await logAudit({
      subject: 'invalid_token',
      endpoint: path,
      method,
      deviceId: deviceId || 'NONE',
      decision: 'DENY',
      reason: `JWT Verification failed: ${err.message}`,
      ipAddress: clientIp
    });
    return res.status(401).json({ error: `Zero Trust Deny: Token tidak valid (${err.message})` });
  }

  const role = decoded.role;
  const sub = decoded.sub; // user_id atau client_id

  // -------------------------------------------------------------
  // PERIKSA ROLE: SERVICE KHUSUS
  // -------------------------------------------------------------
  if (role === 'service') {
    // Service-to-service call (Service Nilai memanggil /transkrip/sinkron)
    if (path === '/transkrip/sinkron' && method === 'POST') {
      await logAudit({
        subject: sub,
        role: 'service',
        endpoint: path,
        method,
        decision: 'ALLOW',
        reason: 'Service token valid for internal transcript synchronization',
        ipAddress: clientIp
      });
      req.user = decoded;
      return next();
    } else {
      await logAudit({
        subject: sub,
        role: 'service',
        endpoint: path,
        method,
        decision: 'DENY',
        reason: 'Service role is only authorized for /transkrip/sinkron',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Service token tidak memiliki izin ke endpoint ini' });
    }
  }

  // -------------------------------------------------------------
  // VERIFIKASI KONTEKS: DEVICE TERDAFTAR (UNTUK USER)
  // -------------------------------------------------------------
  if (!deviceId) {
    await logAudit({
      subject: decoded.username || sub,
      role,
      endpoint: path,
      method,
      deviceId: 'NONE',
      decision: 'DENY',
      reason: 'Missing X-Device-ID header on protected resource request',
      ipAddress: clientIp
    });
    return res.status(403).json({ error: 'Zero Trust Deny: Header X-Device-ID wajib disertakan' });
  }

  // Verifikasi apakah device ini benar-benar terdaftar untuk user yang bersangkutan
  const { data: registeredDevice, error: devErr } = await supabase
    .from('devices')
    .select('*')
    .eq('user_id', sub)
    .eq('device_id', deviceId)
    .eq('is_active', true)
    .single();

  if (devErr || !registeredDevice) {
    await logAudit({
      subject: decoded.username || sub,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'DENY',
      reason: `Context Verification Failed: Device ID ${deviceId} is not registered for user ${decoded.username || sub}`,
      ipAddress: clientIp
    });
    return res.status(403).json({
      error: `Zero Trust Deny: Device (${deviceId}) tidak terdaftar untuk akun Anda`
    });
  }

  // -------------------------------------------------------------
  // EVALUASI KEBIJAKAN AKSES (POLICY MATRIX - TABEL 3)
  // -------------------------------------------------------------

  // Endpoint: GET /nilai
  if (path === '/nilai' && method === 'GET') {
    if (role !== 'mahasiswa' && role !== 'dosen') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'GET /nilai requires Mahasiswa or Dosen role',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Role tidak diizinkan mengakses nilai' });
    }

    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: `Authorized GET /nilai for role ${role}`,
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint: PUT /nilai/:id
  const nilaiMatch = path.match(/^\/nilai\/([a-zA-Z0-9-]+)$/);
  if (nilaiMatch && method === 'PUT') {
    const gradeId = nilaiMatch[1];

    if (role !== 'dosen') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'PUT /nilai/:id only allowed for Dosen',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Hanya dosen yang dapat mengubah nilai' });
    }

    // 1. Verifikasi Jam Akses (07.00 - 21.00)
    const withinHours = config.isWithinAccessHours(simulatedHour);
    if (!withinHours) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Access Hour Policy Violation: Operation attempted outside allowed hours (${config.accessHourStart} - ${config.accessHourEnd})`,
        ipAddress: clientIp
      });
      return res.status(403).json({
        error: `Zero Trust Deny: Perubahan nilai hanya diizinkan pukul ${config.accessHourStart} - ${config.accessHourEnd}`
      });
    }

    // 2. Verifikasi Kepemilikan & Status Finalisasi
    const { data: gradeData, error: gradeErr } = await supabase
      .from('grades')
      .select('*, classes(*)')
      .eq('id', gradeId)
      .single();

    if (gradeErr || !gradeData) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Grade record ID ${gradeId} not found`,
        ipAddress: clientIp
      });
      return res.status(404).json({ error: 'Data nilai tidak ditemukan' });
    }

    // Dosen harus pengampu kelas tersebut
    if (gradeData.classes.dosen_id !== sub) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Ownership Violation: Dosen ${decoded.username} does not teach class ${gradeData.classes.nama_mk}`,
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Anda bukan dosen pengampu untuk kelas ini' });
    }

    // Kelas belum boleh difinalisasi
    if (gradeData.classes.is_finalized) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'Modification Denied: Grade is already finalized',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Nilai kelas ini sudah final dan tidak dapat diubah' });
    }

    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: 'Dosen authorized, within business hours, and class not finalized',
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint: POST /kelas/:id/finalisasi
  const finalMatch = path.match(/^\/kelas\/([a-zA-Z0-9-]+)\/finalisasi$/);
  if (finalMatch && method === 'POST') {
    const classId = finalMatch[1];

    if (role !== 'dosen') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'POST /kelas/:id/finalisasi only allowed for Dosen',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Hanya dosen yang dapat memfinalisasi nilai kelas' });
    }

    // 1. Verifikasi Jam Akses
    const withinHours = config.isWithinAccessHours(simulatedHour);
    if (!withinHours) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Access Hour Policy Violation: Finalization attempted outside ${config.accessHourStart} - ${config.accessHourEnd}`,
        ipAddress: clientIp
      });
      return res.status(403).json({
        error: `Zero Trust Deny: Finalisasi nilai hanya diizinkan pada jam operasional (${config.accessHourStart} - ${config.accessHourEnd})`
      });
    }

    // 2. Verifikasi Dosen Pengampu
    const { data: classData, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classErr || !classData) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }

    if (classData.dosen_id !== sub) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Ownership Violation: Dosen ${decoded.username} does not teach class ${classData.nama_mk}`,
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Anda bukan pengampu kelas ini' });
    }

    if (classData.is_finalized) {
      return res.status(400).json({ error: 'Kelas ini sudah difinalisasi sebelumnya' });
    }

    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: 'Dosen authorized and within access hours for class finalization',
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint: POST /kelas/:id/unfinalisasi
  const unfinalMatch = path.match(/^\/kelas\/([a-zA-Z0-9-]+)\/unfinalisasi$/);
  if (unfinalMatch && method === 'POST') {
    const classId = unfinalMatch[1];

    if (role !== 'dosen' && role !== 'admin') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'POST /kelas/:id/unfinalisasi only allowed for Dosen or Admin',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Hanya dosen pengampu atau admin yang dapat membuka kunci kelas' });
    }

    // 1. Verifikasi Jam Akses
    const withinHours = config.isWithinAccessHours(simulatedHour);
    if (!withinHours && role !== 'admin') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Access Hour Policy Violation: Unfinalization attempted outside ${config.accessHourStart} - ${config.accessHourEnd}`,
        ipAddress: clientIp
      });
      return res.status(403).json({
        error: `Zero Trust Deny: Pembukaan kunci nilai hanya diizinkan pada jam operasional (${config.accessHourStart} - ${config.accessHourEnd})`
      });
    }

    // 2. Verifikasi Pengampu jika Dosen
    const { data: classData, error: classErr } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classErr || !classData) {
      return res.status(404).json({ error: 'Kelas tidak ditemukan' });
    }

    if (role === 'dosen' && classData.dosen_id !== sub) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Ownership Violation: Dosen ${decoded.username} does not teach class ${classData.nama_mk}`,
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Anda bukan pengampu kelas ini' });
    }

    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: 'Authorized to unfinalize and unlock class for grade editing',
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint: GET /transkrip/all (Khusus Admin untuk rekap semua mahasiswa)
  if (path === '/transkrip/all' && method === 'GET') {
    if (role !== 'admin') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'GET /transkrip/all strictly requires Admin role',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Hanya Admin yang dapat melihat seluruh rekap mahasiswa' });
    }

    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: 'Admin authorized to inspect all students transcripts',
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint: GET /transkrip/:nim
  const transkripMatch = path.match(/^\/transkrip\/([a-zA-Z0-9_-]+)$/);
  if (transkripMatch && method === 'GET') {
    const targetNim = transkripMatch[1];

    if (role !== 'admin' && role !== 'mahasiswa') {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: 'GET /transkrip/:nim requires Admin or Mahasiswa role',
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Role tidak berhak mengakses transkrip' });
    }

    // Mahasiswa: hanya boleh melihat NIM miliknya sendiri! (Least Privilege & Data Isolation)
    if (role === 'mahasiswa' && decoded.nim_or_nip !== targetNim) {
      await logAudit({
        subject: decoded.username,
        role,
        endpoint: path,
        method,
        deviceId,
        decision: 'DENY',
        reason: `Least Privilege Violation: Mahasiswa ${decoded.username} (${decoded.nim_or_nip}) attempted to view transcript of NIM ${targetNim}`,
        ipAddress: clientIp
      });
      return res.status(403).json({ error: 'Zero Trust Deny: Mahasiswa hanya boleh melihat transkrip milik sendiri' });
    }

    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: `Transcript access authorized (${role === 'admin' ? 'Admin all access' : 'Mahasiswa self-ownership'})`,
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint: POST /transkrip/sinkron (Khusus Token User jika coba-coba akses langsung)
  if (path === '/transkrip/sinkron' && method === 'POST') {
    await logAudit({
      subject: decoded.username || sub,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'DENY',
      reason: `Policy Violation: Endpoint /transkrip/sinkron strictly requires 'service' role. User token (${role}) rejected`,
      ipAddress: clientIp
    });
    return res.status(403).json({
      error: 'Zero Trust Deny: Endpoint ini khusus sinkronisasi internal antar-service. Token pengguna ditolak!'
    });
  }

  // Jika endpoint lain yang terdaftar di sistem (cth: GET /kelas)
  if (path === '/kelas' && method === 'GET') {
    await logAudit({
      subject: decoded.username,
      role,
      endpoint: path,
      method,
      deviceId,
      decision: 'ALLOW',
      reason: 'Classes list access authorized',
      ipAddress: clientIp
    });
    req.user = decoded;
    return next();
  }

  // Endpoint tidak dikenali
  await logAudit({
    subject: decoded.username || sub,
    role,
    endpoint: path,
    method,
    deviceId: deviceId || 'NONE',
    decision: 'DENY',
    reason: 'Endpoint or method not permitted by Zero Trust Policy',
    ipAddress: clientIp
  });
  return res.status(404).json({ error: 'Endpoint tidak ditemukan atau tidak diizinkan oleh kebijakan Zero Trust' });
}
