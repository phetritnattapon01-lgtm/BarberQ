import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  CheckCircle2,
  Copy,
  Clock,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  Upload,
  Camera,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { soundFx } from '../utils/audio';

interface PromptPayCardProps {
  amount: number;
  referenceNumber: string;
  onPaymentSuccess: () => void;
}

export const PromptPayCard: React.FC<PromptPayCardProps> = ({
  amount,
  referenceNumber,
  onPaymentSuccess,
}) => {
  const { shopSettings, updateShopSettings } = useBooking();
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [autoSimulateSeconds, setAutoSimulateSeconds] = useState<number | null>(null);
  const [showQrUploadModal, setShowQrUploadModal] = useState(false);
  const [tempQrUrl, setTempQrUrl] = useState('');
  const [qrToast, setQrToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualCheck = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onPaymentSuccess();
    }, 1200);
  };

  // Simulating instant bank push notification
  const handleAutoSimulate = () => {
    setAutoSimulateSeconds(3);
  };

  useEffect(() => {
    if (autoSimulateSeconds === null) return;
    if (autoSimulateSeconds > 0) {
      const t = setTimeout(() => setAutoSimulateSeconds(autoSimulateSeconds - 1), 1000);
      return () => clearTimeout(t);
    } else if (autoSimulateSeconds === 0) {
      onPaymentSuccess();
    }
  }, [autoSimulateSeconds, onPaymentSuccess]);

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl flex flex-col items-center text-center">
      {/* PromptPay Header Banner */}
      <div className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-xl p-3 mb-4 text-white flex items-center justify-between shadow-inner">
        <div className="flex items-center space-x-2">
          <div className="bg-white text-blue-950 font-black text-xs px-2 py-0.5 rounded tracking-tighter">
            PromptPay
          </div>
          <span className="text-xs text-blue-200 font-medium">พร้อมเพย์ QR Pay</span>
        </div>
        <div className="flex items-center text-xs text-amber-300 font-mono bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-700/50">
          <Clock className="w-3 h-3 mr-1" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Target Account Info */}
      <div className="text-xs text-zinc-400 mb-2">
        <p className="font-medium text-zinc-200">
          บัญชี: {shopSettings.promptPayName || 'บาร์เบอร์คิว แฮร์สตูดิโอ (BarberQ Studio)'}
        </p>
        <p className="text-[11px] text-zinc-500 font-mono">
          พร้อมเพย์: {shopSettings.promptPayNumber || '089-123-4567'}
        </p>
      </div>

      {/* QR Code Container */}
      <div className="relative p-3 bg-white rounded-2xl shadow-lg my-2 border-4 border-blue-500/20 max-w-[260px] mx-auto">
        {shopSettings.promptPayQrImage ? (
          <img
            src={shopSettings.promptPayQrImage}
            alt="Thai QR PromptPay"
            className="w-48 h-48 sm:w-56 sm:h-56 mx-auto object-contain rounded-xl"
          />
        ) : (
          <svg
            viewBox="0 0 100 100"
            className="w-48 h-48 sm:w-56 sm:h-56 mx-auto text-zinc-900"
            fill="currentColor"
          >
            {/* Authentic-looking QR Pattern */}
            {/* Top-Left Finder */}
            <rect x="5" y="5" width="28" height="28" fill="#000" rx="3" />
            <rect x="9" y="9" width="20" height="20" fill="#fff" rx="2" />
            <rect x="13" y="13" width="12" height="12" fill="#000" rx="1" />

            {/* Top-Right Finder */}
            <rect x="67" y="5" width="28" height="28" fill="#000" rx="3" />
            <rect x="71" y="9" width="20" height="20" fill="#fff" rx="2" />
            <rect x="75" y="13" width="12" height="12" fill="#000" rx="1" />

            {/* Bottom-Left Finder */}
            <rect x="5" y="67" width="28" height="28" fill="#000" rx="3" />
            <rect x="9" y="71" width="20" height="20" fill="#fff" rx="2" />
            <rect x="13" y="75" width="12" height="12" fill="#000" rx="1" />

            {/* Thai QR Central Emblem / Logo Shield */}
            <circle cx="50" cy="50" r="13" fill="#1e3a8a" />
            <text x="50" y="53" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">Prompt</text>
            <text x="50" y="59" fill="#93c5fd" fontSize="5" fontWeight="bold" textAnchor="middle">Pay</text>

            {/* QR Data Matrix Bits */}
            <rect x="37" y="6" width="5" height="5" fill="#000" />
            <rect x="46" y="6" width="5" height="5" fill="#000" />
            <rect x="56" y="6" width="5" height="5" fill="#000" />
            <rect x="37" y="15" width="5" height="5" fill="#000" />
            <rect x="46" y="18" width="5" height="5" fill="#000" />
            <rect x="56" y="24" width="5" height="5" fill="#000" />

            <rect x="6" y="37" width="5" height="5" fill="#000" />
            <rect x="15" y="37" width="5" height="5" fill="#000" />
            <rect x="24" y="37" width="5" height="5" fill="#000" />
            <rect x="6" y="46" width="5" height="5" fill="#000" />
            <rect x="15" y="46" width="5" height="5" fill="#000" />
            <rect x="24" y="55" width="5" height="5" fill="#000" />

            <rect x="67" y="37" width="5" height="5" fill="#000" />
            <rect x="76" y="43" width="5" height="5" fill="#000" />
            <rect x="85" y="37" width="5" height="5" fill="#000" />
            <rect x="67" y="52" width="5" height="5" fill="#000" />
            <rect x="85" y="52" width="5" height="5" fill="#000" />

            <rect x="37" y="67" width="5" height="5" fill="#000" />
            <rect x="46" y="67" width="5" height="5" fill="#000" />
            <rect x="56" y="73" width="5" height="5" fill="#000" />
            <rect x="40" y="80" width="5" height="5" fill="#000" />
            <rect x="50" y="85" width="5" height="5" fill="#000" />
            <rect x="67" y="67" width="5" height="5" fill="#000" />
            <rect x="76" y="76" width="5" height="5" fill="#000" />
            <rect x="85" y="85" width="5" height="5" fill="#000" />
            <rect x="67" y="85" width="5" height="5" fill="#000" />
          </svg>
        )}

        <div className="mt-1 flex items-center justify-center space-x-1 text-[10px] text-zinc-600 font-mono font-semibold">
          <QrCode className="w-3 h-3 text-blue-600" />
          <span>THAI QR PAYMENT</span>
        </div>
      </div>

      {/* Quick QR Upload or Change Button */}
      <div className="flex items-center justify-center space-x-2 my-2 w-full">
        <label className="cursor-pointer text-[11px] bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center space-x-1.5 transition">
          <Upload className="w-3 h-3" />
          <span>{shopSettings.promptPayQrImage ? 'เปลี่ยนรูป QR Code' : '📷 ใส่ / อัปโหลดรูป QR Code'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                  const base64 = event.target?.result as string;
                  if (base64) {
                    updateShopSettings({ promptPayQrImage: base64 });
                    soundFx.playSuccess();
                    setQrToast('✅ อัปโหลดรูป QR Code พร้อมเพย์เรียบร้อย');
                    setTimeout(() => setQrToast(null), 3500);
                  }
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </label>

        {shopSettings.promptPayQrImage && (
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              updateShopSettings({ promptPayQrImage: '' });
              setQrToast('คืนค่า QR Code อัตโนมัติเรียบร้อย');
              setTimeout(() => setQrToast(null), 3000);
            }}
            className="text-[11px] bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 px-2 py-1.5 rounded-lg border border-zinc-700/60 flex items-center space-x-1 transition"
            title="ใช้ QR จำลองของระบบ"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ใช้ QR ระบบ</span>
          </button>
        )}
      </div>

      {qrToast && (
        <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-lg mt-1 animate-fadeIn">
          {qrToast}
        </div>
      )}

      {/* Amount Display */}
      <div className="my-2">
        <span className="text-xs text-zinc-400">ยอดที่ต้องชำระทันที</span>
        <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono">
          ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Ref Number Pill */}
      <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-2.5 my-2 flex items-center justify-between text-xs">
        <div className="text-left">
          <span className="text-[10px] text-zinc-500 block">เลขอ้างอิง (Ref No.)</span>
          <span className="font-mono text-zinc-300 font-medium tracking-wider">{referenceNumber}</span>
        </div>
        <button
          type="button"
          onClick={handleCopyRef}
          className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">คัดลอกแล้ว</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอก</span>
            </>
          )}
        </button>
      </div>

      {/* Instruction Steps */}
      <div className="text-[11px] text-zinc-400 text-left bg-zinc-800/40 p-3 rounded-xl w-full my-2 space-y-1">
        <div className="flex items-center text-zinc-300 font-medium mb-1">
          <Smartphone className="w-3.5 h-3.5 mr-1 text-blue-400" />
          วิธีชำระเงินผ่านแอปธนาคาร:
        </div>
        <p>1. แคปภาพหน้าจอ หรือบันทึกรูป QR Code นี้</p>
        <p>2. เปิดแอปธนาคารใดก็ได้ (K PLUS, SCB EASY, Krungthai NEXT, ฯลฯ)</p>
        <p>3. เลือกเมนู "สแกนจ่าย" และเลือกรูปภาพ QR Code</p>
        <p>4. ตรวจสอบยอดเงิน <strong className="text-amber-400">฿{amount.toFixed(2)}</strong> แล้วกดยืนยัน</p>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2 mt-2">
        <button
          type="button"
          onClick={handleManualCheck}
          disabled={isVerifying || autoSimulateSeconds !== null}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950/50 disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>กำลังตรวจสอบยอดเงิน...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>ฉันโอนเงินเรียบร้อยแล้ว (ตรวจสอบยอด)</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleAutoSimulate}
          disabled={autoSimulateSeconds !== null || isVerifying}
          className="w-full py-2 bg-zinc-800/80 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 text-xs font-medium rounded-xl border border-zinc-700/60 transition flex items-center justify-center space-x-1"
        >
          {autoSimulateSeconds !== null ? (
            <span className="text-emerald-400">กำลังตรวจจับการโอนใน {autoSimulateSeconds} วิ...</span>
          ) : (
            <span>⚡ ทดสอบ: จำลองระบบตรวจจับยอดเงินอัตโนมัติ (Instant Test)</span>
          )}
        </button>
      </div>
    </div>
  );
};
