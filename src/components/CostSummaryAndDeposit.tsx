import React, { useState } from 'react';
import {
  Receipt,
  Percent,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  User,
  Phone,
  MessageSquare,
  Sparkles,
  Banknote,
  Store,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { BARBERS } from '../data/barbers';
import { PaymentOption, PaymentMethodType } from '../types';
import { soundFx } from '../utils/audio';

interface CostSummaryAndDepositProps {
  onProceedToPayment: () => void;
}

export const CostSummaryAndDeposit: React.FC<CostSummaryAndDepositProps> = ({
  onProceedToPayment,
}) => {
  const {
    selectedBarberId,
    selectedService,
    selectedDate,
    selectedTimeSlot,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    customerNotes,
    setCustomerNotes,
    paymentOption,
    setPaymentOption,
    paymentMethod,
    setPaymentMethod,
    discountCode,
    discountAmount,
    applyDiscountCode,
  } = useBooking();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [formError, setFormError] = useState('');

  const barber = BARBERS.find((b) => b.id === selectedBarberId) || BARBERS[0];
  const servicePrice = selectedService ? selectedService.price : 0;
  const finalTotal = Math.max(0, servicePrice - discountAmount);

  const isNoDeposit = paymentOption === 'no_deposit';
  const isDeposit50 = paymentOption === 'deposit_50';
  const isFull100 = paymentOption === 'full_100';

  const amountDueNow = isNoDeposit ? 0 : isDeposit50 ? Math.round(finalTotal * 0.5) : finalTotal;
  const amountRemainingAtShop = finalTotal - amountDueNow;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const success = applyDiscountCode(inputCoupon);
    if (!success) {
      setCouponError('โค้ดไม่ถูกต้อง (ลองใช้ "BARBER50")');
    } else {
      setCouponError('');
    }
  };

  const handleNext = () => {
    if (!customerName.trim()) {
      setFormError('กรุณากรอกชื่อผู้จองคิว');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 9) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อยืนยันคิว');
      return;
    }
    setFormError('');
    soundFx.playClick();
    onProceedToPayment();
  };

  return (
    <div className="space-y-5">
      {/* Customer Info Form */}
      <div className="rounded-2xl bg-zinc-900/70 border border-zinc-800 p-4 space-y-3">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span>ข้อมูลผู้รับบริการ</span>
        </h4>

        {formError && (
          <div className="p-2.5 bg-red-950/50 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-300 block mb-1">ชื่อ-นามสกุล / ชื่อเล่น *</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น ณัฐพล (นัท)"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-300 block mb-1">เบอร์โทรศัพท์มือถือ *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08x-xxx-xxxx"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-300 block mb-1">หมายเหตุเพิ่มเติมถึงช่าง (ถ้ามี)</label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="เช่น อยากได้ทรงอันเดอร์คัทแบบไม่สั้นมาก หรือมีรูปตัวอย่าง"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Payment Options: No Deposit vs 50% Deposit vs Full 100% */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center space-x-1.5">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            <span>รูปแบบการชำระเงินค่าบริการ</span>
          </h4>
          <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
            เลือกได้ 3 รูปแบบ
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Option 1: No Deposit (ไม่มีมัดจำ) */}
          <div
            onClick={() => {
              soundFx.playClick();
              setPaymentOption('no_deposit');
            }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              isNoDeposit
                ? 'bg-zinc-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800'
            }`}
          >
            {isNoDeposit && (
              <div className="absolute top-2.5 right-2.5 bg-amber-500 text-zinc-950 rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center font-bold text-xs">
                  0%
                </div>
                <span className="font-bold text-xs sm:text-sm text-zinc-100">ไม่มีมัดจำ</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                จองคิวทันทีโดยไม่ต้องโอนเงิน ชำระเต็มจำนวนหน้าร้านเมื่อตัดเสร็จ
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-baseline">
              <span className="text-[10px] text-zinc-500">จ่ายตอนนี้</span>
              <span className="text-sm font-bold text-zinc-300 font-mono">฿0</span>
            </div>
          </div>

          {/* Option 2: Deposit 50% */}
          <div
            onClick={() => {
              soundFx.playClick();
              setPaymentOption('deposit_50');
            }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              isDeposit50
                ? 'bg-zinc-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800'
            }`}
          >
            {isDeposit50 && (
              <div className="absolute top-2.5 right-2.5 bg-amber-500 text-zinc-950 rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs">
                  50%
                </div>
                <span className="font-bold text-xs sm:text-sm text-zinc-100">มัดจำ 50% ล็อคคิว</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                จ่ายเพียงครึ่งเดียวก่อนเพื่อยืนยันคิว ส่วนที่เหลือชำระหน้าร้าน
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-baseline">
              <span className="text-[10px] text-zinc-500">จ่ายตอนนี้</span>
              <span className="text-sm font-bold text-amber-400 font-mono">
                ฿{Math.round(finalTotal * 0.5).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Option 3: Full 100% */}
          <div
            onClick={() => {
              soundFx.playClick();
              setPaymentOption('full_100');
            }}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
              isFull100
                ? 'bg-zinc-900 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800'
            }`}
          >
            {isFull100 && (
              <div className="absolute top-2.5 right-2.5 bg-amber-500 text-zinc-950 rounded-full p-0.5 shadow">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  100%
                </div>
                <span className="font-bold text-xs sm:text-sm text-zinc-100">ชำระเต็มจำนวน</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                จ่ายครบ 100% จบในรอบเดียว ไม่ต้องพกเงินสดหรือไม่ต้องโอนเพิ่มหน้าร้าน
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-zinc-800 flex justify-between items-baseline">
              <span className="text-[10px] text-zinc-500">จ่ายตอนนี้</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                ฿{finalTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Channel: PromptPay vs Credit Card vs Cash (For No Deposit) */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center space-x-1.5">
          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {isNoDeposit
              ? 'วิธีที่สะดวกชำระหน้าร้านเมื่อถึงคิว'
              : 'ช่องทางชำระเงินโดยตรง'}
          </span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setPaymentMethod('promptpay');
            }}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              paymentMethod === 'promptpay'
                ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/30 text-white'
                : 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-1.5">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">พร้อมเพย์ (PromptPay QR)</span>
            <span className="text-[10px] text-blue-300/80 mt-0.5">
              {isNoDeposit ? 'สแกนจ่ายเมื่อถึงร้าน' : 'สแกนผ่านทุกแอปธนาคาร'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setPaymentMethod('credit_card');
            }}
            className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center text-center transition ${
              paymentMethod === 'credit_card'
                ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/30 text-white'
                : 'bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-1.5">
              {isNoDeposit ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </div>
            <span className="text-xs font-bold">
              {isNoDeposit ? 'เงินสด / บัตรเครดิต' : 'บัตรเครดิต / เดบิต'}
            </span>
            <span className="text-[10px] text-amber-300/80 mt-0.5">
              {isNoDeposit ? 'ชำระที่เคาน์เตอร์ร้าน' : 'Visa, Mastercard, JCB'}
            </span>
          </button>
        </div>
      </div>

      {/* Coupon Code input */}
      <div className="rounded-2xl bg-zinc-900/50 border border-zinc-800 p-3">
        <form onSubmit={handleApplyCoupon} className="flex space-x-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              value={inputCoupon}
              onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
              placeholder="ใส่โค้ดส่วนลด (ลอง BARBER50)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 uppercase font-mono focus:outline-none focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold rounded-xl border border-zinc-700 transition"
          >
            ใช้โค้ด
          </button>
        </form>
        {discountAmount > 0 ? (
          <div className="mt-2 text-xs text-emerald-400 flex items-center space-x-1 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ใช้โค้ด {discountCode} สำเร็จ ลดทันที ฿{discountAmount}</span>
          </div>
        ) : couponError ? (
          <div className="mt-2 text-xs text-rose-400">{couponError}</div>
        ) : null}
      </div>

      {/* Complete Cost Summary Breakdown */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <h4 className="font-bold text-sm text-zinc-100 flex items-center space-x-1.5">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>สรุปรายละเอียดและค่าใช้จ่าย (Cost Breakdown)</span>
          </h4>
          <span className="text-xs font-mono text-zinc-400">
            {selectedDate} | {selectedTimeSlot} น.
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-zinc-300">
            <span>ช่างที่เลือก:</span>
            <span className="font-semibold text-zinc-100">{barber.name}</span>
          </div>

          <div className="flex justify-between text-zinc-300">
            <span>บริการ:</span>
            <span className="font-semibold text-zinc-100">{selectedService?.name}</span>
          </div>

          <div className="flex justify-between text-zinc-400">
            <span>ราคาบริการปกติ:</span>
            <span className="font-mono text-zinc-300">฿{servicePrice.toLocaleString()}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>ส่วนลดโปรโมชั่น ({discountCode}):</span>
              <span className="font-mono">-฿{discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-zinc-300 pt-2 border-t border-zinc-800/60 font-medium">
            <span>ยอดรวมทั้งสิ้น (Total):</span>
            <span className="font-mono text-base font-bold text-zinc-100">฿{finalTotal.toLocaleString()}</span>
          </div>

          <div className="p-3 bg-zinc-950/90 rounded-xl border border-amber-500/30 space-y-1.5 mt-2">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="text-amber-400 flex items-center space-x-1">
                <span>
                  {isNoDeposit
                    ? 'ยอดชำระออนไลน์ตอนนี้:'
                    : isDeposit50
                    ? 'ยอดชำระมัดจำ 50% (ชำระทันที):'
                    : 'ยอดชำระเต็มจำนวน (ชำระทันที):'}
                </span>
              </span>
              <span className={`text-xl font-extrabold font-mono ${isNoDeposit ? 'text-zinc-300' : 'text-amber-400'}`}>
                ฿{amountDueNow.toLocaleString()}
                {isNoDeposit && <span className="text-xs font-normal text-emerald-400 ml-1.5">(ไม่ต้องโอน)</span>}
              </span>
            </div>

            {isNoDeposit && (
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                <span>ยอดชำระหน้าร้านเมื่อถึงคิว (100%):</span>
                <span className="font-mono font-bold text-amber-400">
                  ฿{finalTotal.toLocaleString()}
                </span>
              </div>
            )}

            {isDeposit50 && (
              <div className="flex justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                <span>ยอดคงเหลือชำระหน้าร้านหลังบริการ:</span>
                <span className="font-mono font-bold text-zinc-300">
                  ฿{amountRemainingAtShop.toLocaleString()}
                </span>
              </div>
            )}

            {isFull100 && (
              <div className="flex justify-between text-[11px] text-emerald-400/90 pt-1 border-t border-zinc-800/80">
                <span>ยอดคงเหลือชำระหน้าร้าน:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ฿0 (ชำระครบถ้วนแล้ว)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Security & Guarantee note */}
        <div className="flex items-center space-x-1.5 text-[10px] text-zinc-500 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            {isNoDeposit
              ? 'จองฟรีล็อคคิวทันที กรุณามาถึงก่อนเวลา 5-10 นาทีเพื่อความรวดเร็ว'
              : 'การันตีคิว 100% สามารถเลื่อนคิวได้ฟรีล่วงหน้า 2 ชม. ก่อนเวลานัดหมาย'}
          </span>
        </div>

        {/* Next Button */}
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
        >
          <span>
            {isNoDeposit
              ? 'ไปที่หน้ายืนยันการจองคิว (ชำระหน้าร้าน)'
              : isDeposit50
              ? 'ไปที่หน้าชำระมัดจำ'
              : 'ไปที่หน้าชำระเงิน'}
          </span>
          <span className="font-mono text-base font-black">
            {isNoDeposit ? `฿${finalTotal.toLocaleString()}` : `฿${amountDueNow.toLocaleString()}`}
          </span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
