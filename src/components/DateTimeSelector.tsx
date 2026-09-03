import React from 'react';
import { Calendar, Clock, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { TIME_SLOTS } from '../data/services';
import { BarberId } from '../types';
import { useBooking } from '../context/BookingContext';
import { soundFx } from '../utils/audio';

interface DateTimeSelectorProps {
  selectedDate: string;
  selectedTimeSlot: string;
  selectedBarberId: BarberId | null;
  onSelectDate: (d: string) => void;
  onSelectTimeSlot: (slot: string) => void;
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  selectedTimeSlot,
  selectedBarberId,
  onSelectDate,
  onSelectTimeSlot,
}) => {
  const { bookings } = useBooking();

  // Generate next 7 days dates
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    const monthNames = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    return {
      dateStr,
      dayNumber: d.getDate(),
      dayName: dayNames[d.getDay()],
      monthName: monthNames[d.getMonth()],
      isToday: i === 0,
      isTomorrow: i === 1,
    };
  });

  // Calculate booked slots for chosen date & barber
  const bookedSlots = bookings
    .filter(
      (b) =>
        b.bookingDate === selectedDate &&
        b.barberId === selectedBarberId &&
        b.status !== 'CANCELLED'
    )
    .map((b) => b.bookingTimeSlot);

  const handleDateClick = (dateStr: string) => {
    soundFx.playClick();
    onSelectDate(dateStr);
  };

  const handleSlotClick = (slot: string) => {
    if (bookedSlots.includes(slot)) return;
    soundFx.playClick();
    onSelectTimeSlot(slot);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>เลือกวันที่และเวลาเข้ารับบริการ</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          ระบบคำนวณคิวว่างของช่างแบบเรียลไทม์ (จองล่วงหน้าล็อคคิวทันที)
        </p>
      </div>

      {/* Date Carousel */}
      <div>
        <span className="text-xs font-semibold text-zinc-300 block mb-2">1. เลือกวัน</span>
        <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {days.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => handleDateClick(item.dateStr)}
                className={`flex-shrink-0 w-20 py-3 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? 'bg-amber-500 border-amber-400 text-zinc-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
              >
                <span className={`text-[11px] ${isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}`}>
                  {item.isToday ? 'วันนี้' : item.isTomorrow ? 'พรุ่งนี้' : item.dayName}
                </span>
                <span className="text-lg font-bold font-mono my-0.5">
                  {item.dayNumber}
                </span>
                <span className={`text-[10px] ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                  {item.monthName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-zinc-300">2. เลือกรอบเวลา (Slot)</span>
          <div className="flex items-center space-x-3 text-[10px] text-zinc-400">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>ว่าง</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
              <span>ติดจองแล้ว</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TIME_SLOTS.map((slot) => {
            const isBooked = bookedSlots.includes(slot);
            const isSelected = selectedTimeSlot === slot && !isBooked;

            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked}
                onClick={() => handleSlotClick(slot)}
                className={`py-2.5 px-3 rounded-xl border text-center transition relative overflow-hidden flex flex-col items-center justify-center ${
                  isBooked
                    ? 'bg-zinc-900/30 border-zinc-800/40 text-zinc-600 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-amber-500 border-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-zinc-900/70 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center space-x-1 text-xs font-mono font-semibold">
                  <Clock className={`w-3 h-3 ${isSelected ? 'text-zinc-950' : 'text-amber-400'}`} />
                  <span>{slot} น.</span>
                </div>
                <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-zinc-900' : isBooked ? 'text-zinc-600' : 'text-emerald-400'}`}>
                  {isBooked ? 'คิวเต็ม' : 'ว่างพร้อมตัด'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
