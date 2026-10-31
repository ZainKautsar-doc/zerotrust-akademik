import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GATEWAY_URL } from '../services/api';
import { ShieldCheck, Laptop, Clock, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function ZeroTrustBar() {
  const { activeDeviceId, setDevice, simulatedHour, setSimulatedHour } = useAuth();
  const [deviceList, setDeviceList] = useState([]);
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

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
    <div className="bg-midnight-canvas/95 border-b border-glass-edge px-3 sm:px-6 py-2 text-xs sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Branding & Status Badge */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-steel-plate/60 border border-glass-edge flex items-center justify-center text-frost-glow flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-mono font-medium text-[10px] sm:text-[11px] text-pure-white whitespace-nowrap">
              PEP HUD
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-steel-plate/40 text-moon-mist border border-glass-edge">
              PDP ACTIVE
            </span>
            <span className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full border font-semibold ${
              isWorkHour 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}>
              {isWorkHour ? 'JAM KERJA' : 'DILUAR JAM'}
            </span>
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            onClick={() => setIsMobileControlsOpen(!isMobileControlsOpen)}
            className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full bg-steel-plate/60 border border-glass-edge text-pure-white"
            title="Buka simulator Device & Jam"
          >
            <SlidersHorizontal className="w-3 h-3 text-frost-glow" />
            <span>Simulasi</span>
            {isMobileControlsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Desktop Simulator Controls */}
        <div className="hidden sm:flex items-center flex-wrap gap-2.5">
          {/* Device ID Selector */}
          <div className="flex items-center gap-1.5 bg-steel-plate/60 px-3 py-1 rounded-full border border-glass-edge">
            <Laptop className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-pure-white font-medium whitespace-nowrap">Header Device:</span>
            <select
              value={activeDeviceId}
              onChange={(e) => setDevice(e.target.value)}
              className="bg-midnight-canvas text-[11px] font-mono text-emerald-300 font-medium rounded-full px-2 py-0.5 border border-glass-edge focus:outline-none focus:border-void-violet cursor-pointer max-w-[180px] md:max-w-[220px] truncate"
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
          <div className="flex items-center gap-1.5 bg-steel-plate/60 px-3 py-1 rounded-full border border-glass-edge">
            <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isWorkHour ? 'text-frost-glow' : 'text-amber-400'}`} />
            <span className="text-[11px] text-pure-white font-medium whitespace-nowrap">Jam:</span>
            <select
              value={simulatedHour}
              onChange={(e) => setSimulatedHour(e.target.value)}
              className="bg-midnight-canvas text-[11px] font-mono font-medium rounded-full px-2 py-0.5 border border-glass-edge focus:outline-none focus:border-void-violet text-pure-white cursor-pointer max-w-[140px] md:max-w-none"
            >
              <option value="10">10:00 (07-21 WIB · ALLOW)</option>
              <option value="14">14:00 (07-21 WIB · ALLOW)</option>
              <option value="23">23:00 (Luar Jam · DENY)</option>
              <option value="03">03:00 (Dini Hari · DENY)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Collapsible Simulator Controls Panel */}
      {isMobileControlsOpen && (
        <div className="mt-2 pt-2 border-t border-glass-edge space-y-2 sm:hidden animate-in fade-in duration-200">
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-moon-mist flex items-center gap-1">
              <Laptop className="w-3 h-3 text-emerald-400" />
              <span>Header X-Device-ID:</span>
            </label>
            <select
              value={activeDeviceId}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-midnight-canvas text-xs font-mono text-emerald-300 font-medium rounded-lg px-2.5 py-1.5 border border-glass-edge focus:outline-none focus:border-void-violet"
            >
              <optgroup label="Perangkat Resmi (Terdaftar)">
                {deviceList.map(d => (
                  <option key={d.device_id} value={d.device_id}>
                    {d.device_id} ({d.users?.username})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Simulasi Device Ilegal">
                <option value="DEV-HACKER-UNREGISTERED">DEV-HACKER-UNREGISTERED</option>
                <option value="DEV-UNKNOWN-DEVICE">DEV-UNKNOWN-DEVICE</option>
              </optgroup>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-mono text-moon-mist flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Simulasi Jam Operasional:</span>
            </label>
            <select
              value={simulatedHour}
              onChange={(e) => setSimulatedHour(e.target.value)}
              className="w-full bg-midnight-canvas text-xs font-mono font-medium rounded-lg px-2.5 py-1.5 border border-glass-edge focus:outline-none focus:border-void-violet text-pure-white"
            >
              <option value="10">10:00 (Jam Kerja 07:00 - 21:00 · ALLOW)</option>
              <option value="14">14:00 (Jam Kerja 07:00 - 21:00 · ALLOW)</option>
              <option value="23">23:00 (Luar Jam Kerja · DENY Mutasi)</option>
              <option value="03">03:00 (Dini Hari · DENY Mutasi)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
