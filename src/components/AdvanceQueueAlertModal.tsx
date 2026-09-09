import React, { useEffect } from 'react';
import {
  Bell,
  Clock,
  Scissors,
  Phone,
  User,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Armchair,
  CreditCard,
} from 'lucide-react';
import { Booking } from '../types';
import { useBooking } from '../context/BookingContext';

interface AdvanceQueueAlertModalProps {
  alertData: { booking: Booking; minutesLeft: number } | null;
  onClose: () => void;
}

export const AdvanceQueueAlertModal: React.FC<AdvanceQueueAlertModalProps> = ({
  alertData,
  onClose,
}) => {
  const { setActiveBookingId, setActiveTab } = useBooking();

  // Close on Escape
  useEffect(() => {
    if (!alertData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [alertData, onClose]);

  if (!alertData) return null;

  const { booking, minutesLeft } = alertData;

  const handleGoToQueue = () => {
    setActiveBookingId(booking.id);
    setActiveTab('live_queue');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-amber-500/10 space-y-4 relative overflow-hidden"
      >
        {/* Glow ambient decoration */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  แจ้งเตือนคิวล่วงหน้า
                </span>
                <span className="text-xs font-bold text-amber-300">
                  ~{minutesLeft} นาที
                </span>
              </div>
              <h3 className="text-sm font-bold text-zinc-100 mt-0.5">
                ถึงคิวลูกค้าที่จองไว้เร็วๆ นี้
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition cursor-pointer"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Queue Ticket Card */}
        <div className="bg-zinc-950/80 rounded-2xl p-4 border border-zinc-800 space-y-3 shadow-inner">
          {/* Queue Number & Time Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-0.5">หมายเลขคิว</span>
              <span className="text-2xl font-black font-mono text-amber-400 tracking-tight">
                {booking.queueNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 block mb-0.5">เวลานัดหมาย</span>
              <span className="inline-flex items-center space-x-1 text-sm font-bold text-zinc-100 bg-zinc-900 px-2.5 py-1 rounded-xl border border-zinc-700 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{booking.bookingTimeSlot} น.</span>
              </span>
            </div>
          </div>

          {/* Customer & Barber Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
              <span className="text-[11px] text-zinc-400 block mb-1">ลูกค้า</span>
              <div className="font-bold text-zinc-100 truncate flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{booking.customerName}</span>
              </div>
              <div className="text-zinc-400 mt-1 flex items-center space-x-1 font-mono">
                <Phone className="w-3 h-3 text-zinc-500 shrink-0" />
                <a
                  href={`tel:${booking.customerPhone}`}
                  className="hover:text-amber-400 transition underline underline-offset-2"
                >
                  {booking.customerPhone}
                </a>
              </div>
            </div>

            <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
              <span className="text-[11px] text-zinc-400 block mb-1">ช่างผู้ดูแล</span>
              <div className="font-bold text-amber-300 truncate flex items-center space-x-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{booking.barber.name} ({booking.barber.nickname})</span>
              </div>
              <div className="text-zinc-400 mt-1 flex items-center space-x-1">
                <Armchair className="w-3 h-3 text-zinc-500 shrink-0" />
                <span>เก้าอี้ประจำที่ {booking.barber.chairNumber || 1}</span>
              </div>
            </div>
          </div>

          {/* Service & Payment Summary */}
          <div className="bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/40 text-xs flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[11px] text-zinc-400 block">บริการที่จอง</span>
              <span className="font-semibold text-zinc-200 truncate block">
                {booking.service.name} ({booking.durationMinutes} นาที)
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-zinc-400 block">ยอดชำระ</span>
              <span className="font-bold text-emerald-400 font-mono">
                ฿{booking.finalTotalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          {booking.customerNotes && (
            <div className="text-[11px] text-zinc-400 bg-zinc-900/30 p-2 rounded-lg border border-zinc-800/40">
              <span className="text-zinc-300 font-medium">หมายเหตุ: </span>
              {booking.customerNotes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 text-xs font-bold rounded-xl transition cursor-pointer text-center"
          >
            รับทราบ / ปิด
          </button>

          <button
            type="button"
            onClick={handleGoToQueue}
            className="py-2.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-zinc-950 text-xs font-bold rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>ดูคิวสดหน้าร้าน</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
