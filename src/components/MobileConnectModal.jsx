import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  MessageCircle, 
  Copy, 
  Check, 
  Volume2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { playTestSound, unlockAudioOnMobile } from '../utils/sound';

export default function MobileConnectModal({ isOpen, onClose, mobileNumber, onUpdateMobileNumber }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [phoneInput, setPhoneInput] = useState(mobileNumber || '');
  const [testSoundPlayed, setTestSoundPlayed] = useState(false);

  // Machine Wi-Fi network URL
  const localNetworkUrl = `http://192.168.0.7:3000`;

  // Format clean phone for WhatsApp
  const cleanPhone = phoneInput.replace(/[^\d]/g, '');
  const fullPhone = cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)
    ? `91${cleanPhone}`
    : cleanPhone;

  const whatsappAlertUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodeURIComponent(
    `🔔 ChronoSphere Alert: Timer finished! Your scheduled countdown reached 00:00:00.`
  )}`;

  useEffect(() => {
    QRCode.toDataURL(localNetworkUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error(err));
  }, [localNetworkUrl]);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(localNetworkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestSpeaker = () => {
    unlockAudioOnMobile();
    playTestSound();
    setTestSoundPlayed(true);
    setTimeout(() => setTestSoundPlayed(false), 3000);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="mobile-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Smartphone size={22} className="text-primary" />
            <div>
              <h3>Connect Mobile Phone & Sound Setup</h3>
              <p className="modal-subtitle">Open on your phone or send instant alerts</p>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Method 1: Scan QR to open directly on phone */}
          <div className="modal-section-card">
            <div className="section-badge">
              <QrCode size={15} />
              <span>METHOD 1: OPEN DIRECTLY ON YOUR MOBILE PHONE</span>
            </div>
            <p className="section-desc">
              Scan this QR code with your phone camera or visit the link on the same Wi-Fi. The phone will run the clock and play loud 1-minute alarm music directly from its own speakers!
            </p>

            <div className="qr-display-row">
              {qrDataUrl && (
                <div className="qr-frame">
                  <img src={qrDataUrl} alt="Scan QR code to open ChronoSphere on mobile" />
                </div>
              )}
              <div className="qr-info-col">
                <span className="info-label">Your Phone Access Link:</span>
                <div className="url-copy-box">
                  <span className="url-text">{localNetworkUrl}</span>
                  <button className="btn-copy" onClick={handleCopyUrl} title="Copy URL">
                    {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="wifi-hint">
                  <Wifi size={14} className="text-primary" />
                  <span>Ensure your phone is connected to the same Wi-Fi network.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Method 2: Instant WhatsApp Notification */}
          <div className="modal-section-card">
            <div className="section-badge badge-whatsapp">
              <MessageCircle size={15} />
              <span>METHOD 2: DIRECT WHATSAPP NOTIFICATION TO PHONE</span>
            </div>
            <p className="section-desc">
              Free instant alert directly to WhatsApp (+91 India and all global numbers).
            </p>

            <div className="whatsapp-action-row">
              <div className="phone-input-wrap">
                <label>Mobile Number (with country code):</label>
                <input 
                  type="tel"
                  placeholder="e.g. +1 555-0199 or +91 9876543210"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    if (onUpdateMobileNumber) onUpdateMobileNumber(e.target.value);
                  }}
                />
              </div>

              <a 
                href={whatsappAlertUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-whatsapp-send"
              >
                <MessageCircle size={18} />
                <span>Test WhatsApp Alert</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Audio Troubleshooting Checklist for Mobile */}
          <div className="modal-section-card checklist-card">
            <div className="section-badge badge-warning">
              <AlertCircle size={15} />
              <span>📱 PHONE SOUND CHECKLIST (HOW TO ENSURE IT RINGS)</span>
            </div>
            <ul className="audio-checklist">
              <li>
                <strong>1. Physical Silent Switch:</strong> On iPhone, switch the physical side switch from Silent (Orange) to Ring. On Android, check Volume is not set to Mute/Vibrate.
              </li>
              <li>
                <strong>2. Tap to Unmute:</strong> Mobile browsers require 1 tap on the screen to permit sound playback.
              </li>
              <li>
                <strong>3. Test Sound Right Now:</strong> Tap the button below to test audio output:
              </li>
            </ul>

            <button 
              type="button" 
              className="btn-test-modal-speaker"
              onClick={handleTestSpeaker}
            >
              <Volume2 size={18} />
              <span>{testSoundPlayed ? 'Playing Test Sound Now...' : '🔊 Test Phone Speakers Now'}</span>
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            <span>Done & Close</span>
          </button>
        </div>
      </div>
    </div>
  );
}
