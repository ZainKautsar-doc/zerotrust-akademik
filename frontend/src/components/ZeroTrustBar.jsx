import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Laptop, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function ZeroTrustBar() {
  const { activeDeviceId, setDevice, simulatedHour, setSimulatedHour, user } = useAuth();
  const [deviceList, setDeviceList] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:3000/api/devices/all')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDeviceList(data);
      })
      .catch(() => {});
  }, []);

  const isWorkHour = parseInt(simulatedHour) >= 7 && parseInt(simulatedHour) <= 21;

  return (
    <div className="bg-slate-900 border-b border-indigo-900/60 px-6 py-2.5 text-sm flex flex-wrap items-center justify-between gap-4 shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      {/* Branding Badge */}
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600/30 p-1.5 rounded-lg border border-indigo-500/40 text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-semibold text-white tracking-wide text-xs uppercase px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/50">
            NIST SP 800-207
          </span>
          <span className="ml-2 font-bold text-slate-200">Zero Trust PEP Controller</span>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="flex items-center flex-wrap gap-4">
        {/* Device ID Selector */}
        <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
          <Laptop className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-medium">Header X-Device-ID:</span>
          <select
            value={activeDeviceId}
            onChange={(e) => setDevice(e.target.value)}
            className="bg-slate-900 text-xs font-mono text-emerald-300 font-semibold rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <optgroup label="Perangkat Resmi (Terdaftar)">
              {deviceList.map(d => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_id} ({d.users?.username})
                </option>
              ))}
            </optgroup>
            <optgroup label="Simulasi Device Ilegal / Tidak Terdaftar">
              <option value="DEV-HACKER-UNREGISTERED">DEV-HACKER-UNREGISTERED (Ditolak)</option>
              <option value="DEV-UNKNOWN-DEVICE">DEV-UNKNOWN-DEVICE (Ditolak)</option>
            </optgroup>
          </select>
        </div>

        {/* Time Simulator */}
        <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700">
          <Clock className={`w-4 h-4 ${isWorkHour ? 'text-blue-400' : 'text-amber-400'}`} />
          <span className="text-xs text-slate-400 font-medium">Jam Akses:</span>
          <select
            value={simulatedHour}
            onChange={(e) => setSimulatedHour(e.target.value)}
            className="bg-slate-900 text-xs font-mono font-semibold rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-indigo-500 text-slate-200"
          >
            <option value="10">10:00 (Jam Kerja 07.00 - 21.00 - ALLOW)</option>
            <option value="14">14:00 (Jam Kerja 07.00 - 21.00 - ALLOW)</option>
            <option value="23">23:00 (Luar Jam Kerja - DENY Perubahan Nilai)</option>
            <option value="03">03:00 (Dini Hari - DENY Perubahan Nilai)</option>
          </select>

          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
            isWorkHour ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {isWorkHour ? 'OPERASIONAL AKTIF' : 'DILUAR JAM KERJA'}
          </span>
        </div>
      </div>
    </div>
  );
}
