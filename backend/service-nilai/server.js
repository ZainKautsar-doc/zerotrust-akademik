import express from 'express';
import cors from 'cors';
import { config } from '../shared/config.js';
import { supabase } from '../shared/supabase.js';
import { verifyGatewayAndToken } from './middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Semua rute di Service Nilai wajib melewati verifikasi Gateway Secret & JWT
app.use(verifyGatewayAndToken);

// -------------------------------------------------------------
// GET /kelas
// Mengambil daftar kelas (Mahasiswa atau Dosen)
// -------------------------------------------------------------
app.get('/kelas', async (req, res) => {
  const user = req.user;
  try {
    let query = supabase.from('classes').select('*, users(full_name, username)');

    if (user.role === 'dosen') {
      query = query.eq('dosen_id', user.sub);
    }

    const { data: classes, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(classes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /nilai
// Mahasiswa: hanya nilai miliknya sendiri
// Dosen: hanya nilai mahasiswa pada kelas yang diampunya
// -------------------------------------------------------------
app.get('/nilai', async (req, res) => {
  const user = req.user;

  try {
    if (user.role === 'mahasiswa') {
      const { data: grades, error } = await supabase
        .from('grades')
        .select('*, classes(id, kode_mk, nama_mk, sks, is_finalized, users(full_name)), users(full_name, nim_or_nip)')
        .eq('mahasiswa_id', user.sub);

      if (error) return res.status(500).json({ error: error.message });
      return res.json(grades);
    }

    if (user.role === 'dosen') {
      // Dosen hanya boleh melihat nilai mahasiswa di kelas yang ia ampu
      const { data: dosenClasses, error: classErr } = await supabase
        .from('classes')
        .select('id')
        .eq('dosen_id', user.sub);

      if (classErr) return res.status(500).json({ error: classErr.message });
      const classIds = dosenClasses.map(c => c.id);

      if (classIds.length === 0) {
        return res.json([]);
      }

      const { data: grades, error } = await supabase
        .from('grades')
        .select('*, classes(id, kode_mk, nama_mk, sks, is_finalized), users(id, full_name, username, nim_or_nip)')
        .in('class_id', classIds);

      if (error) return res.status(500).json({ error: error.message });
      return res.json(grades);
    }

    return res.status(403).json({ error: 'Role tidak diizinkan mengakses nilai' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// PUT /nilai/:id
// Dosen mengubah nilai tugas/UTS/UAS mahasiswa pada kelas yang diampu
// -------------------------------------------------------------
app.put('/nilai/:id', async (req, res) => {
  const { id } = req.params;
  const { nilai_tugas, nilai_uts, nilai_uas } = req.body;

  try {
    const t = parseFloat(nilai_tugas) || 0;
    const uts = parseFloat(nilai_uts) || 0;
    const uas = parseFloat(nilai_uas) || 0;

    // Hitung Nilai Akhir (30% Tugas + 30% UTS + 40% UAS)
    const nilaiAkhir = parseFloat((t * 0.3 + uts * 0.3 + uas * 0.4).toFixed(2));
    let gradeLetter = 'E';
    if (nilaiAkhir >= 85) gradeLetter = 'A';
    else if (nilaiAkhir >= 75) gradeLetter = 'B';
    else if (nilaiAkhir >= 65) gradeLetter = 'C';
    else if (nilaiAkhir >= 50) gradeLetter = 'D';

    const { data: updated, error } = await supabase
      .from('grades')
      .update({
        nilai_tugas: t,
        nilai_uts: uts,
        nilai_uas: uas,
        nilai_akhir: nilaiAkhir,
        grade_letter: gradeLetter,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, classes(nama_mk), users(full_name, nim_or_nip)')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({
      message: 'Nilai berhasil diperbarui',
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /kelas/:id/finalisasi
// Dosen memfinalisasi kelas. Nilai dikunci, lalu Service Nilai
// meminta Service Token ke Gateway dan memanggil Service Transkrip
// -------------------------------------------------------------
app.post('/kelas/:id/finalisasi', async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Kunci status kelas menjadi finalized di database
    const { data: classData, error: classErr } = await supabase
      .from('classes')
      .update({
        is_finalized: true,
        finalized_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (classErr) return res.status(500).json({ error: classErr.message });

    // 2. Ambil semua nilai mahasiswa pada kelas tersebut
    const { data: classGrades, error: gradeErr } = await supabase
      .from('grades')
      .select('*, users(nim_or_nip)')
      .eq('class_id', id);

    if (gradeErr) return res.status(500).json({ error: gradeErr.message });

    // 3. ZERO TRUST INTER-SERVICE CALL:
    // Service Nilai memanggil Gateway POST /auth/service untuk mendapatkan Token Service
    const authServiceRes = await fetch(`http://127.0.0.1:${config.portGateway}/auth/service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: config.serviceClientId,
        clientSecret: config.serviceClientSecret
      })
    });

    if (!authServiceRes.ok) {
      const errBody = await authServiceRes.text();
      return res.status(500).json({
        error: `Gagal memperoleh service token dari Gateway: ${errBody}`
      });
    }

    const { token: serviceToken } = await authServiceRes.json();

    // 4. Service Nilai memanggil Service Transkrip melalui Gateway
    // Endpoint: POST /transkrip/sinkron dengan header Authorization: Bearer <serviceToken>
    const itemsToSync = classGrades.map(g => ({
      mahasiswa_id: g.mahasiswa_id,
      kode_mk: classData.kode_mk,
      nama_mk: classData.nama_mk,
      sks: classData.sks,
      grade_letter: g.grade_letter
    }));

    const syncRes = await fetch(`http://127.0.0.1:${config.portGateway}/transkrip/sinkron`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceToken}`
      },
      body: JSON.stringify({ items: itemsToSync })
    });

    const syncResult = await syncRes.json();

    return res.json({
      message: `Kelas ${classData.nama_mk} berhasil difinalisasi dan disinkronkan ke Service Transkrip`,
      classData,
      syncResult
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(config.portNilai, () => {
  console.log(`[SERVICE NILAI] Running on port ${config.portNilai}`);
});
