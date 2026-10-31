import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GATEWAY_URL } from '../services/api';
import { ShieldCheck, Laptop, Clock } from 'lucide-react';

export default function ZeroTrustBar() {
  const { activeDeviceId, setDevice, simulatedHour, setSimulatedHour } = useAuth();
  const [deviceList, setDeviceList] = useState([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/devices/all`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDeviceList(data);
      })
      .catch(() => {});
  }, []);

  const isWorkHour = parseInt(simulatedHour) >= 7 && parseInt(simulatedHour) <= 21;

  return (
    <div className="bg-midnight-canvas/90 border-b border-glass-edge px-4 sm:px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 backdrop-blur-xl">
      {/* Branding Badge */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center text-frost-glow">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-[11px] text-pure-white">
            PEP CONTROLLER
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-steel-plate/40 text-moon-mist border border-glass-edge">
            PDP ACTIVE
          </span>
        </div>
      </div>

      {/* Simulator Controls */}
      <div className="flex items-center flex-wrap gap-3">
        {/* Device ID Selector */}
        <div className="flex items-center gap-2 bg-steel-plate/60 px-3.5 py-1.5 rounded-full border border-glass-edge">
          <Laptop className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-pure-white font-medium">Header X-Device-ID:</span>
          <select
            value={activeDeviceId}
            onChange={(e) => setDevice(e.target.value)}
            className="bg-midnight-canvas text-[11px] font-mono text-emerald-300 font-medium rounded-full px-2.5 py-0.5 border border-glass-edge focus:outline-none focus:border-void-violet cursor-pointer"
          >
            <optgroup label="Perangkat Resmi (Terdaftar)">
              {deviceList.map(d => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_id} ({d.users?.username})
                </option>
              ))}
            </optgroup>
            <optgroup label="Simulasi Device Ilegal / Tidak Terdaftar">
              <option value="DEV-HACKER-UNREGISTERED">DEV-HACKER-UNREGISTERED (Ditolak PEP)</option>
              <option value="DEV-UNKNOWN-DEVICE">DEV-UNKNOWN-DEVICE (Ditolak PEP)</option>
            </optgroup>
          </select>
        </div>

        {/* Time Simulator */}
        <div className="flex items-center gap-2 bg-steel-plate/60 px-3.5 py-1.5 rounded-full border border-glass-edge">
          <Clock className={`w-3.5 h-3.5 ${isWorkHour ? 'text-frost-glow' : 'text-amber-400'}`} />
          <span className="text-[11px] text-pure-white font-medium">Simulasi Jam:</span>
          <select
            value={simulatedHour}
            onChange={(e) => setSimulatedHour(e.target.value)}
            className="bg-midnight-canvas text-[11px] font-mono font-medium rounded-full px-2.5 py-0.5 border border-glass-edge focus:outline-none focus:border-void-violet text-pure-white cursor-pointer"
          >
            <option value="10">10:00 (Jam Kerja 07:00 - 21:00 · ALLOW)</option>
            <option value="14">14:00 (Jam Kerja 07:00 - 21:00 · ALLOW)</option>
            <option value="23">23:00 (Luar Jam Kerja · DENY Mutasi)</option>
            <option value="03">03:00 (Dini Hari · DENY Mutasi)</option>
          </select>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
            isWorkHour 
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {isWorkHour ? 'JAM KERJA' : 'DILUAR JAM'}
          </span>
        </div>
      </div>
    </div>
  );
}
