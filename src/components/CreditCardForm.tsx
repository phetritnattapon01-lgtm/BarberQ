import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';

interface CreditCardFormProps {
  amount: number;
  onPaymentSuccess: () => void;
}

export const CreditCardForm: React.FC<CreditCardFormProps> = ({
  amount,
  onPaymentSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Format card number with spaces
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCardNumber(formatted);
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length > 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setExpiry(raw);
  };

  const getCardType = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(clean)) return 'MASTERCARD';
    if (/^3[47]/.test(clean)) return 'AMEX';
    if (/^35/.test(clean)) return 'JCB';
    return 'CREDIT / DEBIT';
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      setErrorMsg('กรุณาระบุหมายเลขบัตรให้ครบถ้วน');
      return;
    }
    if (!cardHolder.trim()) {
      setErrorMsg('กรุณาระบุชื่อบนบัตร');
      return;
    }
    if (expiry.length < 5) {
      setErrorMsg('กรุณาระบุวันหมดอายุ (ดด/ปป)');
      return;
    }
    if (cvv.length < 3) {
      setErrorMsg('กรุณาระบุรหัส CVV 3 หรือ 4 หลัก');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('otp');
    }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('done');
      onPaymentSuccess();
    }, 1200);
  };

  const fillDemoCard = () => {
    setCardNumber('4532 8890 1234 5678');
    setCardHolder('SOMCHAI JAIDEE');
    setExpiry('12/28');
    setCvv('789');
    setErrorMsg('');
  };

  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl">
      {/* Interactive Virtual Card Preview */}
      <div className="relative w-full h-44 rounded-2xl bg-gradient-to-tr from-zinc-950 via-zinc-900 to-amber-950/60 p-4 border border-zinc-700/60 text-white shadow-xl flex flex-col justify-between overflow-hidden mb-6">
        {/* Card Hologram chip decoration */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-7 rounded bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <div className="w-5 h-4 border border-amber-300/50 rounded-sm grid grid-cols-2 gap-0.5 p-0.5">
                <div className="bg-amber-300/60 rounded-xs" />
                <div className="bg-amber-300/60 rounded-xs" />
                <div className="bg-amber-300/60 rounded-xs" />
                <div className="bg-amber-300/60 rounded-xs" />
              </div>
            </div>
            <span className="text-[10px] tracking-widest text-zinc-400 font-mono">SECURE CHIP</span>
          </div>
          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-zinc-800/80 border border-zinc-700 text-amber-300">
            {getCardType(cardNumber)}
          </span>
        </div>

        <div>
          <div className="font-mono text-lg tracking-widest text-zinc-100 font-medium">
            {cardNumber || '•••• •••• •••• ••••'}
          </div>
        </div>

        <div className="flex justify-between items-end text-xs">
          <div>
            <span className="text-[9px] text-zinc-400 block tracking-wider uppercase">CARDHOLDER</span>
            <span className="font-medium tracking-wide text-zinc-200 uppercase truncate max-w-[170px] block">
              {cardHolder || 'YOUR NAME'}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-zinc-400 block tracking-wider uppercase">EXPIRES</span>
            <span className="font-mono text-zinc-200">{expiry || 'MM/YY'}</span>
          </div>
        </div>
      </div>

      {step === 'form' && (
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-zinc-400">กรอกข้อมูลบัตรเครดิต / เดบิต</span>
            <button
              type="button"
              onClick={fillDemoCard}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline"
            >
              เติมข้อมูลทดสอบ (Demo)
            </button>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-medium">หมายเลขบัตร (Card Number)</label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1 font-medium">ชื่อบนบัตร (Cardholder Name)</label>
            <input
              type="text"
              placeholder="e.g. SOMCHAI JAIDEE"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-300 block mb-1 font-medium">วันหมดอายุ (MM/YY)</label>
              <input
                type="text"
                placeholder="MM/YY"
                value={expiry}
                onChange={handleExpiryChange}
                maxLength={5}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono text-center"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-300 block mb-1 font-medium">CVV / CVC (3-4 หลัก)</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-3.5" />
                <input
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono text-center tracking-widest"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อเกตเวย์ความปลอดภัย...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ชำระเงิน ฿{amount.toFixed(2)} อย่างปลอดภัย</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-center space-x-2 text-[11px] text-zinc-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>เข้ารหัส 256-Bit SSL & 3D Secure ปลอดภัยสูงสุด</span>
          </div>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
            <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-100">ยืนยันรหัส OTP (3D Secure)</h4>
            <p className="text-xs text-zinc-400 mt-1">
              ระบบได้ส่งรหัส OTP 6 หลัก ไปยังเบอร์มือถือที่ผูกกับบัตรแล้ว
            </p>
            <p className="text-xs font-mono text-amber-400 mt-1">
              (สำหรับทดสอบ: กรอกเลขใดก็ได้ เช่น 123456)
            </p>
          </div>

          <div>
            <input
              type="text"
              placeholder="1 2 3 4 5 6"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.slice(0, 6))}
              className="w-full text-center tracking-[0.5em] font-mono text-lg bg-zinc-950 border border-amber-500/60 rounded-xl py-3 text-amber-300 focus:outline-none"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setStep('form')}
              className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1"
            >
              {isProcessing ? (
                <span>กำลังยืนยัน OTP...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>ยืนยันการตัดเงิน ฿{amount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-zinc-100">ทำรายการสำเร็จ</h4>
          <p className="text-xs text-zinc-400 mt-1">ตัดเงินผ่านบัตรเรียบร้อยแล้ว กำลังออกบัตรคิว...</p>
        </div>
      )}
    </div>
  );
};
