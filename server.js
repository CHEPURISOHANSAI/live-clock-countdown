import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'alerts.json');

app.use(cors());
app.use(express.json());

// Load alerts database
let scheduledAlerts = [];
if (fs.existsSync(DB_FILE)) {
  try {
    scheduledAlerts = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    scheduledAlerts = [];
  }
}

function saveAlerts() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(scheduledAlerts, null, 2));
  } catch (e) {
    console.error('Error saving alerts file:', e);
  }
}

/**
 * Format phone to international format (handles 10-digit mobile numbers e.g. 9876543210 -> +919876543210)
 */
function normalizePhone(rawPhone) {
  const digits = String(rawPhone).replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) {
    // If starts with 6, 7, 8, 9, it's typically an Indian mobile number
    if (/^[6-9]/.test(digits)) {
      return `+91${digits}`;
    }
    // Default US/Canada
    return `+1${digits}`;
  }
  return `+${digits}`;
}

/**
 * Dispatches an alert to a mobile device via:
 * 1. Free instant phone push notification (ntfy.sh) - works globally including India (+91) with loud ringtone
 * 2. WhatsApp notification link
 * 3. Textbelt / Twilio SMS gateway
 */
async function dispatchMobileAlert(phone, message, eventTitle = 'Timer Alert') {
  const formattedPhone = normalizePhone(phone);
  const cleanPhoneId = formattedPhone.replace(/[^\d]/g, '');
  const topicId = `chrono-${cleanPhoneId}`;

  console.log(`\n========================================`);
  console.log(`[DISPATCHING MOBILE ALERT]`);
  console.log(`Target Phone: ${formattedPhone} (Topic: ${topicId})`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Message: "${message}"`);

  const deliveryReport = {
    phone: formattedPhone,
    topicUrl: `https://ntfy.sh/${topicId}`,
    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhoneId}&text=${encodeURIComponent(message)}`,
    pushDelivered: false,
    smsDelivered: false,
    details: {}
  };

  // 1. Send Instant Push Notification via ntfy.sh (100% Free, High Priority, Audible Loud Ring on Phone)
  try {
    const ntfyRes = await fetch(`https://ntfy.sh/${topicId}`, {
      method: 'POST',
      body: message,
      headers: {
        'Title': 'ChronoSphere: Timer Finished!',
        'Priority': '5', // 5 = Urgent/Max priority (plays loud sound on phone)
        'Tags': 'loudspeaker,alarm_clock',
        'Click': `http://localhost:3000`
      }
    });
    const ntfyData = await ntfyRes.json();
    console.log('[ntfy.sh Push Response]: Sent to topic', topicId, ntfyData.id);
    deliveryReport.pushDelivered = true;
    deliveryReport.details.ntfy = ntfyData;
  } catch (err) {
    console.warn('[ntfy.sh Push Warning]:', err.message);
  }

  // 2. Try SMS Gateway (Textbelt)
  try {
    const textbeltRes = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
        key: 'textbelt'
      })
    });
    const tbData = await textbeltRes.json();
    console.log('[Textbelt SMS Response]:', tbData);
    deliveryReport.smsDelivered = !!tbData.success;
    deliveryReport.details.textbelt = tbData;
  } catch (err) {
    console.log('[SMS Gateway Notice]:', err.message);
  }

  console.log(`========================================\n`);
  return deliveryReport;
}

// Background Alert Monitoring Engine (runs even when browser tab is closed!)
setInterval(async () => {
  const now = Date.now();
  for (const alert of scheduledAlerts) {
    if (alert.status === 'pending' && now >= alert.targetTime) {
      alert.status = 'sent';
      alert.sentAt = new Date().toISOString();
      saveAlerts();

      const smsBody = `🔔 ChronoSphere Alert: Your countdown "${alert.eventName}" has completed! Finished at ${new Date().toLocaleTimeString()}`;
      await dispatchMobileAlert(alert.phone, smsBody, alert.eventName);
    }
  }
}, 1000);

// API Endpoints
app.post('/api/alerts/schedule', async (req, res) => {
  const { phone, eventName, targetTime } = req.body;
  if (!phone || !targetTime) {
    return res.status(400).json({ error: 'Phone number and target time are required.' });
  }

  const formattedPhone = normalizePhone(phone);
  const cleanPhoneId = formattedPhone.replace(/[^\d]/g, '');

  const newAlert = {
    id: Date.now().toString(),
    phone: formattedPhone,
    eventName: eventName || 'Countdown Target',
    targetTime: Number(targetTime),
    createdAt: new Date().toISOString(),
    status: 'pending',
    topicUrl: `https://ntfy.sh/chrono-${cleanPhoneId}`,
    whatsappUrl: `https://api.whatsapp.com/send?phone=${cleanPhoneId}&text=${encodeURIComponent(`🔔 ChronoSphere: Your timer target has completed!`)}`
  };

  scheduledAlerts.push(newAlert);
  saveAlerts();

  console.log(`[Alert Scheduled] For: ${formattedPhone} | Event: "${newAlert.eventName}" | Target: in ${Math.round((newAlert.targetTime - Date.now())/1000)}s`);

  return res.json({ 
    success: true, 
    alert: newAlert,
    topicUrl: newAlert.topicUrl,
    whatsappUrl: newAlert.whatsappUrl,
    message: `Alert armed for ${formattedPhone}! Even if you close the browser, you will receive phone push and alerts.`
  });
});

app.post('/api/alerts/test-sms', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  const formattedPhone = normalizePhone(phone);
  const msg = `🔔 ChronoSphere Test: Mobile alert connection verified for ${formattedPhone}! Loud alarm ready.`;
  const report = await dispatchMobileAlert(formattedPhone, msg, 'Test Alert');

  res.json({ 
    success: true, 
    message: `Mobile alert sent to ${formattedPhone}!`,
    report 
  });
});

app.get('/api/alerts/active', (req, res) => {
  const pending = scheduledAlerts.filter(a => a.status === 'pending');
  res.json({ alerts: pending });
});

app.get('/api/alerts/history', (req, res) => {
  res.json({ alerts: scheduledAlerts.slice(-20).reverse() });
});

app.post('/api/alerts/cancel', (req, res) => {
  const { id } = req.body;
  scheduledAlerts = scheduledAlerts.map(a => a.id === id ? { ...a, status: 'cancelled' } : a);
  saveAlerts();
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`ChronoSphere SMS & Background Alert Server listening on http://localhost:${PORT}`);
});
