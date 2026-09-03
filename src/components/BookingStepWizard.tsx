import React, { useState } from 'react';
import {
  Scissors,
  User,
  Calendar,
  Receipt,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  QrCode,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { BarberSelector } from './BarberSelector';
import { ServiceSelector } from './ServiceSelector';
import { DateTimeSelector } from './DateTimeSelector';
import { CostSummaryAndDeposit } from './CostSummaryAndDeposit';
import { PromptPayCard } from './PromptPayCard';
import { CreditCardForm } from './CreditCardForm';
import { Booking } from '../types';

export const BookingStepWizard: React.FC = () => {
  const {
    barbers,
    services,
    selectedBarberId,
    setSelectedBarberId,
    selectedService,
    setSelectedService,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    paymentOption,
    paymentMethod,
    discountAmount,
    customerName,
    customerPhone,
    createBookingAndPay,
    setActiveTab,
    setActiveBookingId,
  } = useBooking();

  const [step, setStep] = useState<number>(1);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  const stepsHeader = [
    { num: 1, label: 'เลือกบริการ' },
    { num: 2, label: 'เลือกช่าง 3 ท่าน' },
    { num: 3, label: 'วัน & เวลา' },
    { num: 4, label: 'สรุปค่าบริการ' },
    { num: 5, label: paymentOption === 'no_deposit' ? 'ยืนยันคิว' : 'ชำระเงิน' },
  ];

  const barber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];
  const service = selectedService || services[0];
  const finalPrice = Math.max(0, service.price - discountAmount);
  const isNoDeposit = paymentOption === 'no_deposit';
  const amountToPayNow = isNoDeposit ? 0 : paymentOption === 'deposit_50' ? Math.round(finalPrice * 0.5) : finalPrice;
  const tempRefNumber = `PP-20260902-${Math.floor(1000 + Math.random() * 9000)}`;

  const handlePaymentSuccess = () => {
    const booking = createBookingAndPay();
    setCreatedBooking(booking);
    setStep(6); // Success Step
  };

  const goToLiveQueue = () => {
    if (createdBooking) {
      setActiveBookingId(createdBooking.id);
    }
    setActiveTab('live_queue');
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb Steps indicator */}
      {step <= 5 && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-md">
          {/* Mobile step info banner */}
          <div className="flex items-center justify-between mb-2 sm:hidden text-xs">
            <span className="text-zinc-400 text-[11px] font-medium">ขั้นตอน {step}/5</span>
            <span className="text-amber-400 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {stepsHeader[step - 1]?.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            {stepsHeader.map((s) => {
              const isDone = step > s.num;
              const isCurrent = step === s.num;

              return (
                <div
                  key={s.num}
                  onClick={() => {
                    if (isDone) setStep(s.num);
                  }}
                  className={`flex flex-col items-center flex-1 cursor-pointer transition ${
                    isCurrent
                      ? 'text-amber-400 font-bold'
                      : isDone
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : 'text-zinc-600'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono mb-1 transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-zinc-950 font-black ring-4 ring-amber-500/20 scale-105 shadow-md shadow-amber-500/30'
                        : isDone
                        ? 'bg-emerald-500 text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {isDone ? '✓' : s.num}
                  </div>
                  <span className="text-[10px] hidden sm:block truncate max-w-[70px] text-center">
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress bar line */}
          <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 1 && (
          <div className="space-y-4">
            <ServiceSelector
              selectedService={selectedService}
              onSelectService={(s) => {
                setSelectedService(s);
              }}
            />
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <span>ถัดไป: เลือกช่างตัดผม (3 ช่าง)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <BarberSelector
              selectedBarberId={selectedBarberId}
              onSelectBarber={(id) => {
                setSelectedBarberId(id);
              }}
            />
            <div className="pt-2 flex justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 sm:flex-initial px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <span>ถัดไป: เลือกวัน & เวลา</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <DateTimeSelector
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              selectedBarberId={selectedBarberId}
              onSelectDate={setSelectedDate}
              onSelectTimeSlot={setSelectedTimeSlot}
            />
            <div className="pt-2 flex justify-between space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-sm flex items-center space-x-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 sm:flex-initial px-6 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
              >
                <span>ถัดไป: สรุปค่าใช้จ่าย & มัดจำ 50%</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <CostSummaryAndDeposit onProceedToPayment={() => setStep(5)} />
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 text-xs flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับไปเปลี่ยนวัน/เวลา</span>
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {isNoDeposit ? (
              <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 space-y-4 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>ยืนยันการจองคิว (ไม่มีมัดจำ / ชำระหน้าร้าน)</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ไม่มีการเรียกเก็บเงินออนไลน์ — ชำระเต็มจำนวน ฿{finalPrice.toLocaleString()} ที่หน้าร้าน
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    เปลี่ยนตัวเลือก
                  </button>
                </div>

                {/* Booking Brief Card */}
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={barber.avatarUrl}
                      alt={barber.name}
                      className="w-12 h-12 rounded-xl object-cover border border-amber-500/40"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-zinc-100">{barber.name} ({barber.nickname})</h4>
                      <p className="text-xs text-zinc-400">{service.name} • {service.durationMinutes} นาที</p>
                      <span className="text-[11px] text-amber-400 font-mono">
                        วันที่ {selectedDate} เวลา {selectedTimeSlot} น.
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px]">ผู้รับบริการ:</span>
                      <span className="font-semibold text-zinc-200">{customerName || 'ลูกค้าทั่วไป'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">เบอร์ติดต่อ:</span>
                      <span className="font-semibold font-mono text-zinc-200">{customerPhone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">ยอดชำระออนไลน์ตอนนี้:</span>
                      <span className="font-bold text-emerald-400 font-mono">฿0 (จองฟรี)</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px]">ยอดชำระหน้าร้านเมื่อตัดเสร็จ:</span>
                      <span className="font-bold text-amber-400 font-mono">฿{finalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                  <p className="font-bold flex items-center space-x-1">
                    <span>💡 คำแนะนำก่อนเข้ารับบริการ:</span>
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    กรุณาเดินทางมาถึงหน้าร้านก่อนเวลานัดหมาย 5-10 นาที เพื่อให้ช่างสามารถเริ่มตัดผมได้ตามเวลาที่ท่านจองไว้
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePaymentSuccess}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ยืนยันการจองคิวทันที (รับบัตรคิว)</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>
                        {paymentMethod === 'promptpay'
                          ? 'สแกนจ่ายผ่านพร้อมเพย์ (PromptPay)'
                          : 'ชำระผ่านบัตรเครดิต / เดบิต'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      ยอดชำระ: <strong className="text-amber-400 font-mono">฿{amountToPayNow.toFixed(2)}</strong> (
                      {paymentOption === 'deposit_50' ? 'มัดจำ 50% ล็อคคิว' : 'จ่ายเต็ม 100%'}
                      )
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 underline"
                  >
                    เปลี่ยนช่องทาง
                  </button>
                </div>

                {paymentMethod === 'promptpay' ? (
                  <PromptPayCard
                    amount={amountToPayNow}
                    referenceNumber={tempRefNumber}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                ) : (
                  <CreditCardForm
                    amount={amountToPayNow}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Step 6: Booking Confirmation & Digital Queue Ticket */}
        {step === 6 && createdBooking && (
          <div className="space-y-5 animate-fadeIn">
            {/* Top Success Badge */}
            <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-zinc-900 to-zinc-900 border border-emerald-500/40 p-6 text-center shadow-2xl relative overflow-hidden">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h2 className="text-xl font-black text-white">จองคิวสำเร็จเรียบร้อย!</h2>
              <p className="text-xs text-zinc-300 mt-1">
                {createdBooking.paymentOption === 'no_deposit'
                  ? 'ล็อคคิวสำเร็จ (ไม่มีมัดจำ — ชำระเงินที่หน้าร้าน)'
                  : 'ระบบได้รับยอดชำระและแจ้งเตือนเข้าแอปเรียลไทม์แล้ว'}
              </p>

              <div className="my-4 py-2 px-4 bg-zinc-950/80 rounded-2xl inline-block border border-zinc-800">
                <span className="text-xs text-zinc-400 block font-medium">หมายเลขคิวของคุณ</span>
                <span className="text-3xl font-black font-mono text-amber-400 tracking-wider">
                  {createdBooking.queueNumber}
                </span>
              </div>
            </div>

            {/* E-Ticket Card */}
            <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl">
              {/* Ticket Top Strip */}
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4 text-zinc-950 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
                    BARBERQ DIGITAL QUEUE PASS
                  </span>
                  <h4 className="font-extrabold text-base">บัตรคิวตัดผมออนไลน์</h4>
                </div>
                <div className="bg-zinc-950 text-amber-400 px-3 py-1 rounded-xl text-xs font-mono font-bold">
                  {createdBooking.bookingTimeSlot} น.
                </div>
              </div>

              {/* Ticket Body */}
              <div className="p-5 space-y-4">
                <div className="flex items-center space-x-3 pb-3 border-b border-zinc-800">
                  <img
                    src={createdBooking.barber.avatarUrl}
                    alt={createdBooking.barber.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/50"
                  />
                  <div>
                    <h5 className="font-bold text-sm text-zinc-100">{createdBooking.barber.nickname}</h5>
                    <p className="text-xs text-zinc-400">{createdBooking.service.name}</p>
                    <span className="text-[11px] text-amber-400 font-medium">
                      Station #{createdBooking.barber.chairNumber} • {createdBooking.bookingDate}
                    </span>
                  </div>
                </div>

                {/* Pricing summary in ticket */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">รูปแบบการชำระ</span>
                    <span className="font-bold text-zinc-200">
                      {createdBooking.paymentOption === 'no_deposit'
                        ? 'ไม่มีมัดจำ (จ่ายหน้าร้าน)'
                        : createdBooking.paymentOption === 'deposit_50'
                        ? 'มัดจำ 50% แล้ว'
                        : 'จ่ายเต็ม 100%'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ยอดที่ชำระไปแล้ว</span>
                    <span className="font-bold font-mono text-emerald-400">
                      ฿{createdBooking.amountPaid.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ยอดคงเหลือหน้าร้าน</span>
                    <span className="font-bold font-mono text-amber-400">
                      ฿{createdBooking.amountRemaining.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">ช่องทางชำระ</span>
                    <span className="font-semibold text-zinc-300 uppercase">
                      {createdBooking.paymentOption === 'no_deposit'
                        ? 'ชำระที่หน้าร้าน'
                        : createdBooking.paymentMethod === 'promptpay'
                        ? 'พร้อมเพย์'
                        : 'บัตรเครดิต'}
                    </span>
                  </div>
                </div>

                {/* QR Check-in Box */}
                <div className="text-center p-3 bg-white rounded-2xl text-zinc-950">
                  <div className="w-32 h-32 mx-auto bg-zinc-950 p-2 rounded-xl flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-white" />
                  </div>
                  <p className="text-xs font-bold mt-2">สแกนเพื่อเช็คอินที่หน้าร้าน</p>
                  <p className="text-[10px] text-zinc-600 font-mono">Ref: {createdBooking.paymentRefNumber}</p>
                </div>
              </div>

              {/* Ticket Footer Actions */}
              <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 space-y-2">
                <button
                  type="button"
                  onClick={goToLiveQueue}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-zinc-950 font-black rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
                >
                  <Clock className="w-4 h-4" />
                  <span>ดูสถานะคิวสด & การแจ้งเตือน (Live Tracker)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setCreatedBooking(null);
                  }}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
                >
                  + จองคิวเพิ่มเติมอีกรอบ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
