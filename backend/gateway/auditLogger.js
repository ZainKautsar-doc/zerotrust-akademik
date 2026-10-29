import { supabase } from '../shared/supabase.js';

export async function logAudit({
  subject = 'anonymous',
  role = null,
  endpoint,
  method,
  deviceId = null,
  decision, // 'ALLOW' or 'DENY'
  reason,
  ipAddress = '127.0.0.1'
}) {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      subject,
      role,
      endpoint,
      method,
      device_id: deviceId,
      decision,
      reason,
      ip_address: ipAddress
    });

    if (error) {
      console.error('[Audit Logger Error]', error.message);
    }
  } catch (err) {
    console.error('[Audit Logger Exception]', err);
  }
}
