import express from 'express';
import { supabase } from '../shared/supabase.js';
import { config } from '../shared/config.js';
import jwt from 'jsonwebtoken';

export const transkripRouter = express.Router();

// Helper fungsi sinkronisasi transkrip dengan verifikasi defense-in-depth role 'service'
export async function syncTranscriptsInternal(items, token) {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (decoded.role !== 'service') {
    throw new Error('Defense-in-depth Forbidden: Endpoint sinkronisasi hanya menerima token role service!');
  }

  const upsertResults = [];
  for (const item of items) {
    const { data, error } = await supabase
      .from('transcripts')
      .upsert(
        {
          mahasiswa_id: item.mahasiswa_id,
          kode_mk: item.kode_mk,
          nama_mk: item.nama_mk,
          sks: item.sks,
          grade_letter: item.grade_letter,
          synced_at: new Date().toISOString()
        },
        { onConflict: 'mahasiswa_id,kode_mk' }
      )
      .select();

    if (error) {
      console.error('[Transcript Upsert Error]', error.message);
    } else {
      upsertResults.push(data);
    }
  }

  return {
    message: `Berhasil menyinkronkan ${upsertResults.length} nilai ke dalam transkrip`,
    syncedCount: upsertResults.length
  };
}

// -------------------------------------------------------------
// GET /transkrip/all
// -------------------------------------------------------------
transkripRouter.get('/transkrip/all', async (req, res) => {
  try {
    const { data: students, error: stuErr } = await supabase
      .from('users')
      .select('id, full_name, username, nim_or_nip')
      .eq('role', 'mahasiswa')
      .order('nim_or_nip', { ascending: true });

    if (stuErr) return res.status(500).json({ error: stuErr.message });

    const { data: transcripts, error: transErr } = await supabase
      .from('transcripts')
      .select('*');

    if (transErr) return res.status(500).json({ error: transErr.message });

    const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'E': 0.0 };

    const result = (students || []).map(st => {
      const studentTranscripts = (transcripts || []).filter(t => t.mahasiswa_id === st.id);
      let totalSks = 0;
      let totalPoints = 0;

      studentTranscripts.forEach(t => {
        const point = gradePoints[t.grade_letter] ?? 0;
        totalSks += t.sks;
        totalPoints += point * t.sks;
      });

      const ipk = totalSks > 0 ? (totalPoints / totalSks).toFixed(2) : '0.00';

      return {
        ...st,
        totalSks,
        ipk,
        transcripts: studentTranscripts
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// GET /transkrip/:nim
// -------------------------------------------------------------
transkripRouter.get('/transkrip/:nim', async (req, res) => {
  const { nim } = req.params;

  try {
    const { data: student, error: stuErr } = await supabase
      .from('users')
      .select('id, full_name, username, nim_or_nip')
      .eq('nim_or_nip', nim)
      .single();

    if (stuErr || !student) {
      return res.status(404).json({ error: `Mahasiswa dengan NIM ${nim} tidak ditemukan` });
    }

    const { data: transcripts, error: transErr } = await supabase
      .from('transcripts')
      .select('*')
      .eq('mahasiswa_id', student.id);

    if (transErr) return res.status(500).json({ error: transErr.message });

    const gradePoints = { 'A': 4.0, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'E': 0.0 };
    let totalSks = 0;
    let totalPoints = 0;

    transcripts.forEach(t => {
      const point = gradePoints[t.grade_letter] ?? 0;
      totalSks += t.sks;
      totalPoints += point * t.sks;
    });

    const ipk = totalSks > 0 ? (totalPoints / totalSks).toFixed(2) : '0.00';

    return res.json({
      mahasiswa: student,
      totalSks,
      ipk,
      mataKuliah: transcripts
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// POST /transkrip/sinkron
// -------------------------------------------------------------
transkripRouter.post('/transkrip/sinkron', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token Bearer diperlukan' });
  }
  const token = authHeader.split(' ')[1];

  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Body items array diperlukan' });
  }

  try {
    const result = await syncTranscriptsInternal(items, token);
    return res.json(result);
  } catch (err) {
    return res.status(403).json({ error: err.message });
  }
});
