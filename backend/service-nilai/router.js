import express from 'express';
import { supabase } from '../shared/supabase.js';
import { config } from '../shared/config.js';
import { syncTranscriptsInternal } from '../service-transkrip/router.js';
import jwt from 'jsonwebtoken';

export const nilaiRouter = express.Router();

// -------------------------------------------------------------
// GET /kelas
// -------------------------------------------------------------
nilaiRouter.get('/kelas', async (req, res) => {
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
// -------------------------------------------------------------
nilaiRouter.get('/nilai', async (req, res) => {
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
// -------------------------------------------------------------
nilaiRouter.put('/nilai/:id', async (req, res) => {
  const { id } = req.params;
  const { nilai_tugas, nilai_uts, nilai_uas } = req.body;

  try {
    const t = parseFloat(nilai_tugas) || 0;
    const uts = parseFloat(nilai_uts) || 0;
    const uas = parseFloat(nilai_uas) || 0;

    const nilaiAkhir = parseFloat((t * 0.3 + uts * 0.3 + uas * 0.4).toFixed(2));
    let gradeLetter = 'E';
    if (nilaiAkhir >= 85) gradeLetter = 'A';
    else if (nilaiAkhir >= 70) gradeLetter = 'B';
    else if (nilaiAkhir >= 55) gradeLetter = 'C';
    else if (nilaiAkhir >= 40) gradeLetter = 'D';

    const { data: updatedGrade, error } = await supabase
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
      .select('*, classes(nama_mk), users(full_name)')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Nilai berhasil diperbarui', grade: updatedGrade });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /kelas/:id/finalisasi
// -------------------------------------------------------------
nilaiRouter.post('/kelas/:id/finalisasi', async (req, res) => {
  const { id } = req.params;

  try {
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

    const { data: classGrades, error: gradeErr } = await supabase
      .from('grades')
      .select('*, users(nim_or_nip)')
      .eq('class_id', id);

    if (gradeErr) return res.status(500).json({ error: gradeErr.message });

    // ZERO TRUST SERVICE TOKEN ISSUE
    const serviceToken = jwt.sign(
      {
        sub: config.serviceClientId,
        role: 'service',
        serviceName: 'Service Nilai'
      },
      config.jwtSecret,
      { expiresIn: '5m' }
    );

    const itemsToSync = classGrades.map(g => ({
      mahasiswa_id: g.mahasiswa_id,
      kode_mk: classData.kode_mk,
      nama_mk: classData.nama_mk,
      sks: classData.sks,
      grade_letter: g.grade_letter
    }));

    // Sinkronisasi dengan verifikasi defense-in-depth token service
    const syncResult = await syncTranscriptsInternal(itemsToSync, serviceToken);

    return res.json({
      message: `Kelas ${classData.nama_mk} berhasil difinalisasi dan disinkronkan ke Service Transkrip`,
      classData,
      syncResult
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /kelas/:id/unfinalisasi
// -------------------------------------------------------------
nilaiRouter.post('/kelas/:id/unfinalisasi', async (req, res) => {
  const { id } = req.params;

  try {
    const { data: classData, error: classErr } = await supabase
      .from('classes')
      .update({
        is_finalized: false,
        finalized_at: null
      })
      .eq('id', id)
      .select('*')
      .single();

    if (classErr) return res.status(500).json({ error: classErr.message });

    return res.json({
      message: `Kunci kelas ${classData.nama_mk} berhasil dibuka. Dosen dapat mengedit nilai kembali.`,
      classData
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
