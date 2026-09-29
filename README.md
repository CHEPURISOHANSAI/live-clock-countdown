# 🕐 ChronoSphere — Modern React Live Clock & Mobile Alert Countdown

A sleek, responsive, high-precision live digital timepiece and countdown application with **1-Minute Loud Alarm Music**, **Guaranteed Mobile Speaker Sound**, **Direct QR Code Phone Connection**, **Instant WhatsApp Alerts**, and **All 418 World Timezones**.

---

## 📱 How to Connect Your Mobile Phone & Hear the Loud Alarm

### Method 1: Open Directly on Your Phone (Speakers + Vibration)
1. Ensure your phone and computer are on the **same Wi-Fi network**.
2. Click **"Connect Mobile Phone"** in the app to display your dynamic **QR Code**.
3. Point your phone camera at the screen to open:
   ```
   http://192.168.0.7:3000
   ```
4. **Crucial for Mobile Sound**:
   - On your phone screen, tap the glowing banner: **"📱 Tap to Arm Phone Speaker"**.
   - Make sure your physical phone switch (iPhone mute switch) is set to **Ring**, not Silent.
   - When the countdown finishes, your phone will **play loud 1-minute alarm music directly from its own speakers and physically vibrate**!

### Method 2: Instant WhatsApp Notification
- Free instant delivery to your phone without SMS carrier blocks!
- Supports all standard mobile numbers worldwide.
- Tap **"Test WhatsApp Alert"** or **"Send WhatsApp Notification"** to receive the alert instantly.

---

## ✨ Features Summary

- 🕐 **Large Digital Clock**: Real-time Hours, Minutes, Seconds with pulsing colons and `.ms` toggle.
- 🌍 **All 418 World Timezones**: Search and view real-time clocks for every city on Earth; set any timezone as your main digital clock!
- ⏳ **Short-Duration Timers**: Instant 30s, 1m, 2m, 5m, 10m buttons + custom minute/second inputs.
- 🔊 **1-Minute Continuous Loud Music**: Driving musical fanfare that rings for a full 60 seconds with live countdown and a massive **`🛑 STOP ALARM NOW`** button.
- 📱 **Mobile Audio Pipeline**: Dual HTML5 PCM WAV loop + Web Audio synthesizer + `navigator.vibrate` physical buzz.
- 🔔 **Smart Alarms**: Set recurring or one-off alarms with custom labels, snooze, and dismiss.
- 🌙 **Cyberpunk Glassmorphism UI**: 5 switchable themes (*Neon Cyan, Aurora Violet, Matrix Emerald, Solar Sunset, and Minimal OLED*).

---

## 🚀 Services Status

- **Frontend App**: [http://localhost:3000](http://localhost:3000) (LAN: `http://192.168.0.7:3000`)
- **Background Alert Service**: [http://localhost:3001](http://localhost:3001)
