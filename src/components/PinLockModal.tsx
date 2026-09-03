import React, { useState, useEffect } from 'react';
import { Shield, Lock, KeyRound, X, Delete, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface PinLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetTitle?: string;
  currentPin: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetTitle = 'ระบบบัญชี & จัดการหลังบ้าน',
  currentPin,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
      setIsShaking(false);
      setShowHint(false);
    }
  }, [isOpen]);

  // Handle keyboard typing
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, currentPin]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    soundFx.playClick();
    setErrorMsg(null);

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      // Validate PIN
      setTimeout(() => {
        if (newPin === (currentPin || '8888')) {
          soundFx.playSuccess();
          onSuccess();
        } else {
          soundFx.playNotification();
          setErrorMsg('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      soundFx.playClick();
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    soundFx.playClick();
    setPin('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className={`w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-zinc-100">ยืนยันรหัสผ่านความปลอดภัย</h3>
          <p className="text-xs text-zinc-400 max-w-[260px]">
            กรุณากรอกรหัส PIN 4 หลัก เพื่อเข้าถึง <strong className="text-amber-400">{targetTitle}</strong>
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className="my-6 flex justify-center items-center space-x-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 border-amber-400 scale-125 shadow-md shadow-amber-500/40'
                    : 'bg-zinc-950 border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center space-x-1.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-100 font-mono text-xl font-bold border border-zinc-800/80 hover:border-amber-500/50 transition active:scale-95 flex items-center justify-center shadow"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-950/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 text-xs font-semibold border border-zinc-800 transition active:scale-95 flex items-center justify-center"
          >
            ล้าง
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-100 font-mono text-xl font-bold border border-zinc-800/80 hover:border-amber-500/50 transition active:scale-95 flex items-center justify-center shadow"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-zinc-950/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Default PIN Hint */}
        <div className="mt-5 text-center">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-center space-x-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              รหัสเริ่มต้น: <strong className="text-amber-400 font-mono">8888</strong> (เปลี่ยนได้ในเมนูหลังบ้าน)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            ยกเลิก / กลับไปหน้าจองคิว
          </button>
        </div>
      </div>
    </div>
  );
};

export const InlinePinLockScreen: React.FC<{
  targetTitle: string;
  currentPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ targetTitle, currentPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, currentPin]);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    soundFx.playClick();
    setErrorMsg(null);

    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === (currentPin || '8888')) {
          soundFx.playSuccess();
          onSuccess();
        } else {
          soundFx.playNotification();
          setErrorMsg('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
          setIsShaking(true);
          setTimeout(() => {
            setIsShaking(false);
            setPin('');
          }, 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      soundFx.playClick();
      setPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    soundFx.playClick();
    setPin('');
    setErrorMsg(null);
  };

  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
      <div
        className={`w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-zinc-100">ระบบถูกล็อคด้วยรหัสความปลอดภัย</h3>
          <p className="text-xs text-zinc-400 max-w-[260px]">
            กรุณากรอกรหัส PIN 4 หลัก เพื่อเข้าใช้งาน <strong className="text-amber-400">{targetTitle}</strong>
          </p>
        </div>

        {/* PIN Dots */}
        <div className="my-6 flex justify-center items-center space-x-4">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 border-amber-400 scale-125 shadow-md shadow-amber-500/40'
                    : 'bg-zinc-950 border-zinc-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center space-x-1.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-100 font-mono text-xl font-bold border border-zinc-800/80 hover:border-amber-500/50 transition active:scale-95 flex items-center justify-center shadow"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-zinc-950/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 text-xs font-semibold border border-zinc-800 transition active:scale-95 flex items-center justify-center"
          >
            ล้าง
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 text-zinc-100 font-mono text-xl font-bold border border-zinc-800/80 hover:border-amber-500/50 transition active:scale-95 flex items-center justify-center shadow"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-zinc-950/40 hover:bg-zinc-800/60 text-zinc-400 hover:text-amber-400 border border-zinc-800 transition active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Helper */}
        <div className="mt-5 text-center space-y-3">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center justify-center space-x-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              รหัสเริ่มต้น: <strong className="text-amber-400 font-mono">8888</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-zinc-400 hover:text-zinc-200 underline"
          >
            ← กลับไปหน้าจองคิว
          </button>
        </div>
      </div>
    </div>
  );
};
