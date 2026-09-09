import React, { useState, useEffect } from 'react';
import {
  X,
  Footprints,
  User,
  Phone,
  Sparkles,
  Clock,
  CheckCircle2,
  Printer,
  QrCode,
  Zap,
  Banknote,
  Smartphone,
  Scissors,
  ArrowRight,
  ShieldCheck,
  Armchair,
  Share2,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { BarberId, Booking, CreateWalkInParams, PaymentMethodType } from '../types';
import { soundFx } from '../utils/audio';
import { formatBarberDisplayName } from '../data/barbers';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultBarberId?: BarberId | 'auto';
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  isOpen,
  onClose,
  defaultBarberId,
}) => {
  const {
    barbers,
    services,
    bookings,
    createWalkInBooking,
    setActiveTab,
    setActiveBookingId,
  } = useBooking();

  // Barbers who are currently active and in the shop (ช่างเท่าที่มี)
  const availableBarbers = barbers.filter((b) => b.isActive !== false);

  const getInitialBarberId = (): BarberId | 'auto' => {
    if (defaultBarberId) {
      if (defaultBarberId === 'auto') return 'auto';
      const b = barbers.find((x) => x.id === defaultBarberId);
      if (b && b.isActive !== false) return defaultBarberId;
    }
    // If multiple active barbers exist, default to auto-distribution across available barbers
    if (availableBarbers.length > 1) {
      return 'auto';
    }
    return availableBarbers[0]?.id || barbers[0]?.id || 'barber-top';
  };

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [selectedBarberId, setSelectedBarberId] = useState<BarberId | 'auto'>(getInitialBarberId());
  const [selectedServiceId, setSelectedServiceId] = useState<string>(services[0]?.id || 'srv-1');
  const [paymentTiming, setPaymentTiming] = useState<'pay_later' | 'pay_now'>('pay_later');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [createdWalkIn, setCreatedWalkIn] = useState<Booking | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [barberError, setBarberError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultBarberId) {
        if (defaultBarberId === 'auto') {
          setSelectedBarberId('auto');
        } else {
          const b = barbers.find((x) => x.id === defaultBarberId);
          setSelectedBarberId(b && b.isActive !== false ? defaultBarberId : (availableBarbers[0]?.id || 'auto'));
        }
      } else {
        setSelectedBarberId(availableBarbers.length > 1 ? 'auto' : (availableBarbers[0]?.id || 'barber-top'));
      }
      setBarberError(null);
    }
  }, [isOpen, defaultBarberId, barbers]);

  const handleCloseModal = () => {
    setCreatedWalkIn(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNotes('');
    setBarberError(null);
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Quick preset name tags
  const namePresets = ['ลูกค้า Walk-in', 'ลูกค้าหน้าร้าน', 'ลูกค้าประจำ', 'เด็กนักเรียน', 'คุณลูกค้า VIP'];

  // Calculate waiting count for each barber
  const getBarberQueueStats = (barberId: BarberId) => {
    const activeWaiting = bookings.filter(
      (b) =>
        b.barberId === barberId &&
        b.status !== 'COMPLETED' &&
        b.status !== 'CANCELLED'
    );
    const count = activeWaiting.length;
    const estMinutes = count * 35;
    return { count, estMinutes };
  };

  // Find candidate barber with lowest queue among available barbers (ช่างเท่าที่มี)
  const autoAssignedBarber = (() => {
    const candidates = availableBarbers.length > 0 ? availableBarbers : barbers;
    const counts = candidates.map((b) => {
      const queueCount = bookings.filter(
        (bk) =>
          bk.barberId === b.id &&
          bk.status !== 'COMPLETED' &&
          bk.status !== 'CANCELLED'
      ).length;
      return { barber: b, count: queueCount };
    });
    counts.sort((a, b) => a.count - b.count);
    return counts[0]?.barber;
  })();

  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBarberId) {
      setBarberError('กรุณาเลือกช่างตัดผมก่อนออกบัตรคิว');
      soundFx.playError();
      return;
    }

    if (selectedBarberId === 'auto') {
      if (availableBarbers.length === 0) {
        setBarberError('ขณะนี้ไม่มีช่างเปิดรับคิว กรุณาเปิดสถานะช่างก่อนออกบัตรคิว');
        soundFx.playError();
        return;
      }
    } else {
      const chosenBarber = barbers.find((b) => b.id === selectedBarberId);
      if (chosenBarber?.isActive === false) {
        setBarberError(`${formatBarberDisplayName(chosenBarber.nickname)} งดรับคิวในขณะนี้ กรุณาเลือกช่างเท่าที่มี`);
        soundFx.playError();
        return;
      }
    }

    const params: CreateWalkInParams = {
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerNotes: customerNotes.trim() || undefined,
      barberId: selectedBarberId,
      serviceId: selectedServiceId,
      paymentMethod,
      isPaidNow: paymentTiming === 'pay_now',
    };

    const newBooking = createWalkInBooking(params);
    setCreatedWalkIn(newBooking);
  };

  const handlePrintTicket = () => {
    setIsPrinting(true);
    soundFx.playClick();
    setTimeout(() => {
      try {
        window.print();
      } catch {
        // Safe fallback in sandboxed iframes
      }
      setIsPrinting(false);
    }, 200);
  };

  const handleResetForNextWalkIn = () => {
    setCreatedWalkIn(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNotes('');
    setSelectedBarberId(availableBarbers.length > 1 ? 'auto' : (availableBarbers[0]?.id || 'barber-top'));
    setBarberError(null);
    setPaymentTiming('pay_later');
    soundFx.playClick();
  };

  const handleGoToTracker = () => {
    if (createdWalkIn) {
      setActiveBookingId(createdWalkIn.id);
    }
    setActiveTab('live_queue');
    onClose();
  };

  const selectedServiceObj = services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedBarberObj = selectedBarberId === 'auto' 
    ? autoAssignedBarber 
    : barbers.find((b) => b.id === selectedBarberId);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseModal();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cursor-default relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 font-black">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">ออกบัตรคิว Walk-in หน้าร้าน</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ⚡ ด่วนทันที
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                สำหรับลูกค้าที่เดินทางมาที่ร้านโดยตรง ไม่ต้องผ่านขั้นตอนโอนมัดจำล่วงหน้า
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseModal();
            }}
            className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 flex items-center justify-center transition cursor-pointer shrink-0 z-10"
            title="ปิดหน้าต่าง"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {createdWalkIn ? (
          /* STEP 2: TICKET ISSUED SUCCESS VIEW */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">ออกบัตรคิว Walk-in เรียบร้อยแล้ว!</h4>
              <p className="text-xs text-zinc-400">
                ส่งมอบบัตรคิวให้ลูกค้า หรือให้ลูกค้าสแกน QR เพื่อดูสถานะคิวบนมือถือ
              </p>
            </div>

            {/* Printable Thermal Receipt / Queue Card */}
            <div
              id="walkin-printable-ticket"
              className="bg-zinc-950 rounded-2xl border-2 border-purple-500/40 p-4 sm:p-5 shadow-2xl relative overflow-hidden"
            >
              {/* Receipt Header */}
              <div className="text-center pb-3 border-b border-dashed border-zinc-800">
                <span className="font-extrabold text-sm tracking-wider text-amber-400 font-mono">
                  BARBERQ HAIR STUDIO
                </span>
                <p className="text-[10px] text-zinc-400">สาขาสยามสแควร์ ซอย 3 • บัตรคิวหน้าร้าน (Walk-in)</p>
                <div className="mt-2 inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs rounded-full">
                  🚶 คิว Walk-in หน้าร้าน
                </div>
              </div>

              {/* Big Queue Number */}
              <div className="text-center py-4 border-b border-dashed border-zinc-800">
                <span className="text-xs text-zinc-400 uppercase font-medium">หมายเลขคิว (Queue No.)</span>
                <div className="text-4xl sm:text-5xl font-black font-mono text-purple-400 tracking-wider my-1">
                  {createdWalkIn.queueNumber}
                </div>
                <p className="text-xs font-bold text-zinc-200">
                  {createdWalkIn.customerName}
                </p>
              </div>

              {/* Barber & Service Info */}
              <div className="py-3 border-b border-dashed border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">ช่างประจำคิว:</span>
                  <span className="font-bold text-amber-400 flex items-center space-x-1">
                    <Armchair className="w-3.5 h-3.5" />
                    <span>{createdWalkIn.barber.name} (เก้าอี้ #{createdWalkIn.barber.chairNumber})</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">บริการ:</span>
                  <span className="font-medium text-zinc-200">{createdWalkIn.service.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">เวลาออกบัตรคิว:</span>
                  <span className="font-mono text-zinc-300">{createdWalkIn.bookingTimeSlot} น.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">ยอดค่าบริการ:</span>
                  <span className="font-bold font-mono text-emerald-400">
                    ฿{createdWalkIn.finalTotalPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">การชำระเงิน:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    createdWalkIn.amountPaid > 0
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {createdWalkIn.amountPaid > 0 ? 'ชำระแล้วที่เคาน์เตอร์' : 'รอชำระหลังบริการเสร็จ'}
                  </span>
                </div>
              </div>

              {/* QR Code Simulation for Mobile Queue Tracking */}
              <div className="pt-3 text-center">
                <div className="inline-flex flex-col items-center justify-center p-2.5 bg-white rounded-xl shadow-md">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://barberq.app/q/${createdWalkIn.queueNumber}`}
                    alt="Scan Live Queue"
                    className="w-24 h-24"
                  />
                  <span className="text-[9px] font-bold text-zinc-900 mt-1">สแกนดูสถานะคิวบนมือถือ</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1.5">
                  ลูกค้าสามารถไปทำธุระใกล้เคียงและเช็คคิวได้แบบเรียลไทม์
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintTicket}
                className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 flex items-center justify-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>พิมพ์สลิปบัตรคิว</span>
              </button>

              <button
                type="button"
                onClick={handleGoToTracker}
                className="py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition"
              >
                <span>ไปหน้าติดตามคิวสด</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetForNextWalkIn}
              className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ ออกบัตรคิว Walk-in คนถัดไป</span>
            </button>
          </div>
        ) : (
          /* STEP 1: WALK-IN FORM */
          <form onSubmit={handleCreateWalkIn} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
            {/* Barber Selection Error Banner */}
            {barberError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl text-rose-200 text-xs font-bold flex items-center space-x-2 animate-shake shadow-lg">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
                <span>{barberError}</span>
              </div>
            )}

            {/* Section 1: Barber Selection - Available Barbers Only (ช่างเท่าที่มี) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="text-xs font-bold text-zinc-100 flex items-center space-x-1.5">
                  <Armchair className="w-3.5 h-3.5 text-amber-400" />
                  <span>1. เลือกช่างประจำคิว (ช่างเท่าที่มี)</span>
                  <span className="text-emerald-400 font-extrabold text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                    🟢 พร้อมบริการ {availableBarbers.length} ท่าน
                  </span>
                </label>
                {selectedBarberId === 'auto' ? (
                  <span className="text-[11px] text-purple-300 font-bold bg-purple-500/15 px-2 py-0.5 rounded-lg border border-purple-500/30 truncate max-w-[200px]">
                    ⚡ เฉลี่ยคิวเท่ากัน (จัดให้: {autoAssignedBarber?.nickname})
                  </span>
                ) : selectedBarberObj ? (
                  <span className="text-[11px] text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-lg border border-amber-500/30 truncate max-w-[200px]">
                    {formatBarberDisplayName(selectedBarberObj.nickname)} (โต๊ะ #{selectedBarberObj.chairNumber})
                  </span>
                ) : null}
              </div>

              {/* Quick Auto-Assign Option (Distribute queues equally among available barbers) */}
              {availableBarbers.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBarberId('auto');
                    setBarberError(null);
                    soundFx.playClick();
                  }}
                  className={`w-full p-2.5 rounded-2xl border transition flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                    selectedBarberId === 'auto'
                      ? 'bg-purple-500/20 border-purple-400 text-purple-100 shadow-md ring-2 ring-purple-400/70'
                      : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-purple-500/40 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white">⚡ จัดคิวอัตโนมัติ (เฉลี่ยให้ช่างเท่าๆ กัน)</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-500/40 font-bold">
                          แนะนำ
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        ระบบจะส่งคิวให้ {autoAssignedBarber?.nickname ? `ช่าง${autoAssignedBarber.nickname} (โต๊ะ #${autoAssignedBarber.chairNumber})` : 'ช่างที่คิวน้อยสุด'}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right ml-2">
                    {selectedBarberId === 'auto' ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500 text-white flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>เลือกแล้ว</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400">คลิกเลือก</span>
                    )}
                  </div>
                </button>
              )}

              {/* Available Barbers Grid - Only Available Barbers, Equal Sizing */}
              {availableBarbers.length === 0 ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-rose-300">
                    ขณะนี้ไม่มีช่างเปิดรับคิว (ช่างทุกคนปิดสถานะ)
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    กรุณาเปิดสถานะการทำงานของช่างในระบบตั้งค่าหรือแผงควบคุมช่าง
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-2.5 ${
                    availableBarbers.length === 1
                      ? 'grid-cols-1'
                      : availableBarbers.length === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-3'
                  }`}
                >
                  {availableBarbers.map((barber) => {
                    const stats = getBarberQueueStats(barber.id);
                    const isSelected = selectedBarberId === barber.id;

                    return (
                      <button
                        key={barber.id}
                        type="button"
                        onClick={() => {
                          setSelectedBarberId(barber.id);
                          setBarberError(null);
                          soundFx.playClick();
                        }}
                        className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative cursor-pointer min-w-0 active:scale-[0.98] ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-amber-100 shadow-md ring-2 ring-amber-400/80'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                        }`}
                      >
                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black flex items-center space-x-0.5 shadow">
                            <CheckCircle2 className="w-3 h-3 fill-zinc-950 text-amber-400" />
                            <span>เลือกแล้ว</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <img
                              src={barber.avatarUrl}
                              alt={barber.name}
                              className={`w-11 h-11 rounded-xl object-cover border ${
                                isSelected ? 'border-amber-400 ring-1 ring-amber-400' : 'border-zinc-700'
                              }`}
                            />
                            <span className="absolute -bottom-1 -right-1 px-1 rounded bg-zinc-900 border border-zinc-700 text-[9px] font-mono font-bold text-amber-400">
                              #{barber.chairNumber}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-black text-white block truncate">
                              {barber.nickname}
                            </span>
                            <span className="text-[10px] text-zinc-400 block truncate">
                              {barber.name}
                            </span>
                            <span className="text-[10px] text-amber-400/90 block truncate mt-0.5 font-medium">
                              โต๊ะ #{barber.chairNumber}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                          {stats.count === 0 ? (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                              <span>ว่างพร้อมตัด (0 คิว)</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-zinc-300">
                              รอ <strong className="text-amber-400">{stats.count}</strong> คิว (~{stats.estMinutes}น.)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 2: Service Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. เลือกบริการที่ต้องการตัด</span>
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  ฿{selectedServiceObj.price} ({selectedServiceObj.durationMinutes} นาที)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {services.map((srv) => {
                  const isSelected = selectedServiceId === srv.id;
                  return (
                    <div
                      key={srv.id}
                      onClick={() => {
                        setSelectedServiceId(srv.id);
                        soundFx.playClick();
                      }}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <span className="text-xs font-bold text-white block truncate">{srv.name}</span>
                        <span className="text-[10px] text-zinc-400">{srv.durationMinutes} นาที</span>
                      </div>
                      <span className="text-xs font-bold font-mono text-amber-400 shrink-0">
                        ฿{srv.price}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Customer Name & Preset Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. ชื่อลูกค้า หรือหมายเลขเรียกหน้าร้าน</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-normal">กดปุ่มด่วนได้</span>
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="เช่น ชาย, คุณเก่ง, ลูกค้าหน้าร้าน #1"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-purple-500 font-medium"
              />

              {/* Preset chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                {namePresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setCustomerName(preset);
                      soundFx.playClick();
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-purple-300 hover:border-purple-500/50 transition shrink-0 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Phone & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  เบอร์โทรศัพท์ (ไม่บังคับ)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08x-xxx-xxxx"
                    className="w-full pl-8 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  หมายเหตุทรงผม / รีเควสพิเศษ
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="เช่น ไถข้างเบอร์ 2, รีบไปธุระ"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Section 4: Payment Timing & Method */}
            <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
              <label className="text-xs font-bold text-zinc-200 block">
                การชำระเงินของลูกค้า Walk-in
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentTiming('pay_later')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    paymentTiming === 'pay_later'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-xs font-bold block">💵 รอชำระหลังตัดเสร็จ</span>
                  <span className="text-[10px] text-zinc-400">มาตรฐาน Walk-in</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentTiming('pay_now')}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    paymentTiming === 'pay_now'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-xs font-bold block">💳 ชำระทันทีที่เคาน์เตอร์</span>
                  <span className="text-[10px] text-zinc-400">บันทึกรายรับเข้าระบบทันที</span>
                </button>
              </div>

              {paymentTiming === 'pay_now' && (
                <div className="pt-2 border-t border-zinc-850 flex items-center space-x-2">
                  <span className="text-xs text-zinc-400 shrink-0">วิธีชำระ:</span>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center space-x-1 ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <Banknote className="w-3 h-3" />
                    <span>เงินสด</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('promptpay')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center space-x-1 ${
                      paymentMethod === 'promptpay'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>สแกนพร้อมเพย์</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Submit Button */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">ยอดชำระ</span>
                <span className="text-base font-black font-mono text-amber-400">
                  ฿{selectedServiceObj.price.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-500/25 flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Footprints className="w-4 h-4" />
                  <span>
                    {selectedBarberObj ? `ออกบัตรคิว (${formatBarberDisplayName(selectedBarberObj.nickname)})` : 'ออกบัตรคิว Walk-in'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
