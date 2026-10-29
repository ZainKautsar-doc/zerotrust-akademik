import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  portGateway: parseInt(process.env.PORT_GATEWAY || '3000', 10),
  portNilai: parseInt(process.env.PORT_NILAI || '3001', 10),
  portTranskrip: parseInt(process.env.PORT_TRANSKRIP || '3002', 10),

  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_zero_trust',
  gatewaySecret: process.env.GATEWAY_SECRET || 'fallback_gate_secret',

  serviceClientId: process.env.SERVICE_CLIENT_ID || 'service-nilai-client',
  serviceClientSecret: process.env.SERVICE_CLIENT_SECRET || 'sec_client_pwd_nilai_98765',

  accessHourStart: process.env.ACCESS_HOUR_START || '07:00',
  accessHourEnd: process.env.ACCESS_HOUR_END || '21:00',
  accessHoursEnforced: process.env.ACCESS_HOURS_ENFORCED !== 'false',

  // Memeriksa apakah saat ini berada dalam rentang jam akses
  isWithinAccessHours(overrideHour = null) {
    if (!this.accessHoursEnforced) return true;

    const now = new Date();
    let currentHour = now.getHours();
    let currentMinute = now.getMinutes();

    if (overrideHour !== null && overrideHour !== undefined) {
      // Untuk simulasi demo lewat frontend/header
      currentHour = parseInt(overrideHour, 10);
      currentMinute = 0;
    }

    const [startH, startM] = this.accessHourStart.split(':').map(Number);
    const [endH, endM] = this.accessHourEnd.split(':').map(Number);

    const currentTotalMin = currentHour * 60 + currentMinute;
    const startTotalMin = startH * 60 + startM;
    const endTotalMin = endH * 60 + endM;

    return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
  }
};
