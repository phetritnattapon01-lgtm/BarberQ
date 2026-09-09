import React, { useEffect } from 'react';
import { Bell, Clock, X, ExternalLink, Scissors } from 'lucide-react';
import { Booking } from '../types';
import { useBooking } from '../context/BookingContext';

interface AdvanceQueueToastProps {
  alertData: { booking: Booking; minutesLeft: number } | null;
  onClose: () => void;
  onOpenModal?: () => void;
}

export const AdvanceQueueToast: React.FC<AdvanceQueueToastProps> = ({
  alertData,
  onClose,
  onOpenModal,
}) => {
  const { setActiveBookingId, setActiveTab } = useBooking();

  // Auto dismiss after 14 seconds
  useEffect(() => {
    if (!alertData) return;
    const timer = setTimeout(() => {
      onClose();
    }, 14000);
    return () => clearTimeout(timer);
  }, [alertData, onClose]);

  if (!alertData) return null;

  const { booking, minutesLeft } = alertData;

  const handleGoToQueue = () => {
    setActiveBookingId(booking.id);
    setActiveTab('live_queue');
    onClose();
  };

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-3 animate-slideDown pointer-events-none">
      <div className="pointer-events-auto bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-2xl shadow-amber-500/20 text-zinc-100 flex items-center justify-between gap-3 backdrop-blur-md">
        {/* Bell pulse icon */}
        <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 animate-bounce">
          <Bell className="w-5 h-5" />
        </div>

        {/* Info */}
        <div
          onClick={onOpenModal}
          className="flex-1 min-w-0 cursor-pointer group"
          title="แตะเพื่อดูรายละเอียดทั้งหมด"
        >
          <div className="flex items-center space-x-1.5">
            <span className="font-mono font-black text-xs text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
              {booking.queueNumber}
            </span>
            <span className="text-[11px] font-bold text-amber-300">
              ⚡ ถึงคิวใน ~{minutesLeft} นาที ({booking.bookingTimeSlot} น.)
            </span>
          </div>
          <p className="text-xs text-zinc-200 font-semibold truncate mt-0.5">
            {booking.customerName} • {booking.service.name}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">
            {booking.barber.name} ({booking.barber.nickname})
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            type="button"
            onClick={handleGoToQueue}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 text-xs font-bold rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            ดูคิว
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center justify-center cursor-pointer"
            title="ปิด"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
