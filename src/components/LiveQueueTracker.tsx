import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Phone,
  MapPin,
  QrCode,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Ban,
  User,
  CheckCircle,
  Footprints,
  Calendar,
  Layers,
  Filter,
  Users,
  Timer,
  Hourglass,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { Booking, BookingStatus, BarberId } from '../types';
import { soundFx } from '../utils/audio';
import { WalkInModal } from './WalkInModal';

// Helper to calculate end time given start time string ("11:00") and duration in minutes
const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  if (!startTime) return '';
  const parts = startTime.split(':');
  if (parts.length < 2) return startTime;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return startTime;
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

export const LiveQueueTracker: React.FC = () => {
  const {
    bookings,
    activeBooking,
    setActiveBookingId,
    updateBookingStatus,
    simulateNextQueueEvent,
    setActiveTab,
    barbers,
  } = useBooking();

  // Active view: 'timetable' (ตารางคิวตามเวลา) or 'ticket' (บัตรคิวเดี่ยว)
  const [viewMode, setViewMode] = useState<'timetable' | 'ticket'>('timetable');

  // Timetable Filters
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<'all' | BarberId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Clock
  const [currentTimeStr, setCurrentTimeStr] = useState(
    new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeStr(
        new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-play simulation timer
  useEffect(() => {
    if (!isAutoPlay || !activeBooking) return;

    const interval = setInterval(() => {
      simulateNextQueueEvent();
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoPlay, activeBooking, simulateNextQueueEvent]);

  // Sort bookings chronologically by time slot
  const sortedBookings = [...bookings].sort((a, b) => {
    if (a.bookingDate !== b.bookingDate) {
      return a.bookingDate.localeCompare(b.bookingDate);
    }
    return a.bookingTimeSlot.localeCompare(b.bookingTimeSlot);
  });

  // Filtered bookings for timetable
  const filteredBookings = sortedBookings.filter((b) => {
    if (selectedBarberFilter !== 'all' && b.barberId !== selectedBarberFilter) {
      return false;
    }
    if (statusFilter === 'active') {
      return b.status !== 'COMPLETED' && b.status !== 'CANCELLED';
    }
    if (statusFilter === 'completed') {
      return b.status === 'COMPLETED';
    }
    return true;
  });

  const getStepState = (stepStatus: BookingStatus, targetBooking: Booking) => {
    const order: BookingStatus[] = ['CONFIRMED', 'BARBER_PREPARING', 'IN_PROGRESS', 'COMPLETED'];
    if (targetBooking.status === 'CANCELLED') return 'cancelled';
    const currentIndex = order.indexOf(targetBooking.status);
    const stepIndex = order.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  // Metrics for overview
  const inProgressCount = bookings.filter((b) => b.status === 'IN_PROGRESS').length;
  const waitingCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'BARBER_PREPARING'
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;

  // Selected active booking calculation
  const currentActive = activeBooking || sortedBookings[0] || null;

  const peopleAhead = currentActive
    ? bookings.filter(
        (b) =>
          b.barberId === currentActive.barberId &&
          b.bookingDate === currentActive.bookingDate &&
          b.status !== 'COMPLETED' &&
          b.status !== 'CANCELLED' &&
          b.id !== currentActive.id
      ).length
    : 0;

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      {/* Real-time Header & Digital Clock */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <h2 className="text-sm font-black tracking-wide text-zinc-100 uppercase">
                ระบบตารางคิวสด (LIVE QUEUE)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              แสดงผังเวลาบริการแบบเรียลไทม์ • หน้าร้านเปิด 10:00 - 20:30 น.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-2.5">
          <div className="px-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl font-mono text-xs text-amber-400 font-bold flex items-center space-x-1.5 shadow-inner">
            <Timer className="w-3.5 h-3.5 text-zinc-500" />
            <span>{currentTimeStr} น.</span>
          </div>

          <button
            type="button"
            onClick={() => setShowWalkInModal(true)}
            className="px-3 py-1.5 bg-purple-600/25 hover:bg-purple-600/35 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shrink-0 shadow-sm active:scale-95 cursor-pointer"
          >
            <Footprints className="w-3.5 h-3.5 text-purple-400" />
            <span>+ ออกคิว Walk-in</span>
          </button>
        </div>
      </div>

      {/* Main View Mode Selector (Equal 2-Column Grid on Mobile) */}
      <div className="grid grid-cols-2 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setViewMode('timetable')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            viewMode === 'timetable'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <CalendarClock className="w-4 h-4 shrink-0" />
          <span className="truncate">ตารางคิวตามเวลา</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              viewMode === 'timetable'
                ? 'bg-zinc-950/20 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('ticket')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
            viewMode === 'ticket'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Scissors className="w-4 h-4 shrink-0" />
          <span className="truncate">บัตรคิว & สถานะ</span>
          {currentActive && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                viewMode === 'ticket'
                  ? 'bg-zinc-950/20 text-zinc-950'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {currentActive.queueNumber}
            </span>
          )}
        </button>
      </div>

      {/* Quick Queue Strip - Horizontal scroll showing all queue slots with time */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar pt-1">
        <span className="text-[11px] text-zinc-500 font-bold whitespace-nowrap pl-1 shrink-0">
          คิววันนี้:
        </span>
        {sortedBookings.map((b) => {
          const isSelected = currentActive?.id === b.id;
          const isWk = b.isWalkIn;
          const isCurrent = b.status === 'IN_PROGRESS';
          const isPrep = b.status === 'BARBER_PREPARING';

          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setActiveBookingId(b.id);
                soundFx.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition flex items-center space-x-2 border cursor-pointer shrink-0 ${
                isSelected
                  ? isWk
                    ? 'bg-purple-600 text-white font-bold border-purple-400 shadow-md shadow-purple-500/20'
                    : 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                  : isWk
                  ? 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800/50'
                  : 'bg-zinc-900/70 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              {isWk ? (
                <Footprints className="w-3 h-3 text-purple-400 shrink-0" />
              ) : (
                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
              )}
              <span className="font-mono font-bold">{b.queueNumber}</span>
              <span className="font-mono text-[11px] opacity-85">({b.bookingTimeSlot} น.)</span>
              {isCurrent && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              )}
              {isPrep && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* MODE 1: TIMETABLE SCHEDULE VIEW (ตารางคิวตามช่วงเวลา)       */}
      {/* ========================================================= */}
      {viewMode === 'timetable' && (
        <div className="space-y-4">
          {/* Day Metrics Overview Box */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">กำลังให้บริการ</span>
              <span className="text-xl font-mono font-black text-emerald-400 flex items-center justify-center space-x-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{inProgressCount} คิว</span>
              </span>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">รอถึงเวลานัด</span>
              <span className="text-xl font-mono font-black text-amber-400 block mt-0.5">
                {waitingCount} คิว
              </span>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-400 block font-medium">เสร็จสิ้นแล้ว</span>
              <span className="text-xl font-mono font-black text-blue-400 block mt-0.5">
                {completedCount} คิว
              </span>
            </div>
          </div>

          {/* Filter Bar: Barber & Status */}
          <div className="p-3.5 bg-zinc-900/60 rounded-2xl border border-zinc-800 space-y-2.5">
            {/* Barber Filter */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-xs text-zinc-400 font-bold shrink-0 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>ช่าง:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedBarberFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedBarberFilter === 'all'
                    ? 'bg-amber-500 text-zinc-950 font-black'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                ทุกคน ({sortedBookings.length})
              </button>
              {barbers.map((barber) => {
                const count = sortedBookings.filter((b) => b.barberId === barber.id).length;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => setSelectedBarberFilter(barber.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                      selectedBarberFilter === barber.id
                        ? 'bg-amber-500 text-zinc-950 font-black'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <span>{barber.nickname}</span>
                    <span className="text-[10px] opacity-75">(#{barber.chairNumber}: {count})</span>
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2 pt-1 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-bold shrink-0 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span>สถานะ:</span>
              </span>
              <div className="grid grid-cols-3 gap-1 flex-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`py-1 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-zinc-700 text-white font-extrabold'
                      : 'text-zinc-400 hover:text-white bg-zinc-950/60'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`py-1 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white font-extrabold'
                      : 'text-emerald-400 hover:text-white bg-zinc-950/60'
                  }`}
                >
                  รอ & กำลังตัด
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`py-1 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                    statusFilter === 'completed'
                      ? 'bg-blue-600 text-white font-extrabold'
                      : 'text-blue-400 hover:text-white bg-zinc-950/60'
                  }`}
                >
                  เสร็จสิ้นแล้ว
                </button>
              </div>
            </div>
          </div>

          {/* Chronological Queue Timetable Cards */}
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 rounded-3xl border border-zinc-800 text-zinc-500 text-xs space-y-2">
                <CalendarClock className="w-8 h-8 mx-auto text-zinc-600" />
                <p>ไม่พบคิวในช่วงเวลาหรือเงื่อนไขที่เลือก</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBarberFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-3 py-1 bg-zinc-800 text-amber-400 rounded-xl text-xs hover:bg-zinc-700"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            ) : (
              filteredBookings.map((b, index) => {
                const endTime = calculateEndTime(b.bookingTimeSlot, b.durationMinutes);
                const isSelected = currentActive?.id === b.id;
                const isInProgress = b.status === 'IN_PROGRESS';
                const isPrep = b.status === 'BARBER_PREPARING';
                const isDone = b.status === 'COMPLETED';

                return (
                  <div
                    key={b.id}
                    className={`rounded-3xl border transition-all p-4 shadow-lg relative overflow-hidden ${
                      isInProgress
                        ? 'bg-zinc-900 border-emerald-500/80 ring-2 ring-emerald-500/30'
                        : isPrep
                        ? 'bg-zinc-900 border-amber-500/80 ring-2 ring-amber-500/20'
                        : isDone
                        ? 'bg-zinc-950/70 border-zinc-800/80 opacity-80'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Time Window Banner (Top Highlight) */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center space-x-2">
                        <div className="px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center space-x-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-black text-zinc-100">
                            {b.bookingTimeSlot} - {endTime} น.
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          ({b.durationMinutes} นาที)
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isInProgress && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center space-x-1.5 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>กำลังตัดอยู่ตอนนี้</span>
                          </span>
                        )}
                        {isPrep && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold inline-flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                            <span>เตรียมอุปกรณ์</span>
                          </span>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-semibold inline-flex items-center space-x-1">
                            <Hourglass className="w-3 h-3 text-amber-400" />
                            <span>รอตามเวลานัด</span>
                          </span>
                        )}
                        {isDone && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-blue-400" />
                            <span>ตัดเสร็จแล้ว</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Queue Info & Customer Row */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-sm shrink-0 border shadow-inner ${
                            b.isWalkIn
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {b.queueNumber}
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-zinc-100">{b.customerName}</h4>
                            {b.isWalkIn ? (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center space-x-0.5">
                                <Footprints className="w-2.5 h-2.5 text-purple-400" />
                                <span>Walk-in</span>
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                จองออนไลน์
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 flex items-center space-x-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-zinc-500" />
                            <span>{b.customerPhone}</span>
                          </p>
                        </div>
                      </div>

                      {/* Barber & Service Info */}
                      <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                        <div className="flex items-center space-x-2">
                          <img
                            src={b.barber.avatarUrl}
                            alt={b.barber.name}
                            className="w-9 h-9 rounded-xl object-cover border border-amber-500/40"
                          />
                          <div className="text-left sm:text-right">
                            <span className="text-xs font-bold text-zinc-200 block">
                              ช่าง{b.barber.nickname}
                            </span>
                            <span className="text-[10px] text-amber-400 block font-medium">
                              โต๊ะ #{b.barber.chairNumber} • {b.service.name}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveBookingId(b.id);
                            setViewMode('ticket');
                            soundFx.playClick();
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 text-xs font-bold rounded-xl transition flex items-center space-x-1 shrink-0 border border-zinc-700 shadow-sm cursor-pointer"
                          title="ดูบัตรคิวและขั้นตอนบริการ"
                        >
                          <span>ดูบัตรคิว</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: SINGLE TICKET VIEW (บัตรคิวเดี่ยว & ขั้นตอนบริการ)    */}
      {/* ========================================================= */}
      {viewMode === 'ticket' && currentActive && (
        <div className="space-y-4">
          <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Time Slot Highlight Bar - Front & Center */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] text-amber-300/80 font-bold block">
                    ช่วงเวลาที่เข้ารับบริการของคุณ
                  </span>
                  <div className="text-base sm:text-lg font-black font-mono text-amber-400">
                    {currentActive.bookingTimeSlot} -{' '}
                    {calculateEndTime(currentActive.bookingTimeSlot, currentActive.durationMinutes)} น.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs px-2.5 py-1 bg-zinc-950/80 border border-zinc-800 rounded-xl font-mono text-zinc-300 font-bold">
                  ⏱️ ใช้เวลา {currentActive.durationMinutes} นาที
                </span>
              </div>
            </div>

            {/* Big Queue Number & Barber Info */}
            <div className="my-4 pt-2 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-zinc-400 block font-medium">หมายเลขคิวของคุณ</span>
                  {currentActive.isWalkIn ? (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/40 inline-flex items-center space-x-1">
                      <Footprints className="w-3 h-3" />
                      <span>Walk-in หน้าร้าน</span>
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      🌐 จองออนไลน์
                    </span>
                  )}
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 tracking-wider mt-1">
                  {currentActive.queueNumber}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-bold text-zinc-200">{currentActive.customerName}</span>
                  <span className="text-xs text-zinc-400">• โทร {currentActive.customerPhone}</span>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <img
                    src={currentActive.barber.avatarUrl}
                    alt={currentActive.barber.name}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
                  />
                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-100 block">
                      ช่าง{currentActive.barber.nickname}
                    </span>
                    <span className="text-[11px] text-amber-400 font-semibold block">
                      Station #{currentActive.barber.chairNumber}
                    </span>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {currentActive.service.name} (฿{currentActive.finalTotalPrice})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Metric Chips: Start Time, Duration, End Time */}
            <div className="grid grid-cols-3 gap-2 my-4">
              <div className="p-2.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 block">เวลานัดเริ่ม</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-200 block mt-0.5">
                  {currentActive.bookingTimeSlot} น.
                </span>
              </div>

              <div className="p-2.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 block">คิวรอก่อนหน้า</span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-400 block mt-0.5">
                  {peopleAhead === 0 ? 'ถึงคิวของคุณแล้ว' : `${peopleAhead} คิว`}
                </span>
              </div>

              <div className="p-2.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
                <span className="text-[10px] text-zinc-500 block">เสร็จโดยประมาณ</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 block mt-0.5">
                  {calculateEndTime(currentActive.bookingTimeSlot, currentActive.durationMinutes)} น.
                </span>
              </div>
            </div>

            {/* 4-Step Progress Indicator */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>ความคืบหน้าตามเวลา</span>
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {currentActive.status === 'CONFIRMED' && '1. ยืนยันคิวเรียบร้อย'}
                  {currentActive.status === 'BARBER_PREPARING' && '2. ช่างกำลังเตรียมโต๊ะ'}
                  {currentActive.status === 'IN_PROGRESS' && '3. กำลังให้บริการตัดผม'}
                  {currentActive.status === 'COMPLETED' && '4. บริการเสร็จสิ้นแล้ว'}
                  {currentActive.status === 'CANCELLED' && 'ยกเลิกการจอง'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                {[
                  { id: 'CONFIRMED', label: '1. ยืนยันคิว' },
                  { id: 'BARBER_PREPARING', label: '2. เตรียมโต๊ะ' },
                  { id: 'IN_PROGRESS', label: '3. กำลังตัด' },
                  { id: 'COMPLETED', label: '4. เสร็จสิ้น' },
                ].map((step) => {
                  const state = getStepState(step.id as BookingStatus, currentActive);
                  return (
                    <div key={step.id} className="space-y-1.5 text-center">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          state === 'completed'
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                            : state === 'current'
                            ? 'bg-amber-500 animate-pulse shadow-sm shadow-amber-500/40 ring-2 ring-amber-400/20'
                            : 'bg-zinc-800'
                        }`}
                      />
                      <span
                        className={`text-[11px] block font-semibold truncate ${
                          state === 'current'
                            ? 'text-amber-400 font-bold'
                            : state === 'completed'
                            ? 'text-emerald-400'
                            : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actual Time Audit Log */}
            {currentActive.timeline && currentActive.timeline.length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <span className="text-[11px] font-bold text-zinc-400 block mb-2">
                  บันทึกประวัติเวลาจริง (Time History Log):
                </span>
                <div className="space-y-1.5">
                  {currentActive.timeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 text-xs text-zinc-300 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-zinc-800/60 font-mono"
                    >
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-amber-400 font-bold">{item.timestamp} น.</span>
                      <span className="text-zinc-400">•</span>
                      <span className="font-sans text-zinc-200">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Simulation Box */}
            <div className="mt-5 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowSimulator(!showSimulator)}
                className="w-full py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-zinc-400 hover:text-amber-300 flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>แผงจำลองการเปลี่ยนขั้นตอนคิว (Simulator Tool)</span>
                </div>
                {showSimulator ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {showSimulator && (
                <div className="mt-2 p-3 bg-zinc-950 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400 font-bold">
                      กดเพื่อจำลองสถานะคิว:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setIsAutoPlay(!isAutoPlay);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center space-x-1 border transition ${
                        isAutoPlay
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {isAutoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isAutoPlay ? 'กำลังจำลองสด (3s)' : 'เล่นอัตโนมัติ'}</span>
                    </button>
                  </div>

                  {statusToast && (
                    <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-2">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{statusToast}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        updateBookingStatus(currentActive.id, 'CONFIRMED', 'ลูกค้ายืนยันและชำระมัดจำ');
                        setStatusToast('⚡ เปลี่ยนเป็น: 1. ยืนยันคิวเรียบร้อย');
                        setTimeout(() => setStatusToast(null), 2500);
                      }}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                        currentActive.status === 'CONFIRMED'
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      1. ยืนยันคิว
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        updateBookingStatus(
                          currentActive.id,
                          'BARBER_PREPARING',
                          `ช่าง${currentActive.barber.nickname} เตรียมอุปกรณ์พร้อม`
                        );
                        setStatusToast(`⚡ เปลี่ยนเป็น: 2. ช่าง${currentActive.barber.nickname} เตรียมโต๊ะ`);
                        setTimeout(() => setStatusToast(null), 2500);
                      }}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                        currentActive.status === 'BARBER_PREPARING'
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      2. เตรียมโต๊ะ
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playSuccess();
                        updateBookingStatus(
                          currentActive.id,
                          'IN_PROGRESS',
                          `เริ่มตัดผมทรง ${currentActive.service.name}`
                        );
                        setStatusToast('✂️ เปลี่ยนเป็น: 3. เริ่มตัดผม (In Progress)');
                        setTimeout(() => setStatusToast(null), 2500);
                      }}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                        currentActive.status === 'IN_PROGRESS'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-black'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      3. กำลังตัด
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playSuccess();
                        updateBookingStatus(
                          currentActive.id,
                          'COMPLETED',
                          'บริการเสร็จสิ้น ชำระยอดคงเหลือ'
                        );
                        setStatusToast('🎉 เปลี่ยนเป็น: 4. ตัดเสร็จสิ้น');
                        setTimeout(() => setStatusToast(null), 2500);
                      }}
                      className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                        currentActive.status === 'COMPLETED'
                          ? 'bg-blue-500 text-zinc-950 border-blue-400 font-black'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      4. ตัดเสร็จสิ้น
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shop & Barber Quick Contact */}
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center space-x-1 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate max-w-[200px]">BarberQ สยามสแควร์ ซอย 3</span>
              </div>

              <a
                href="tel:02-123-4567"
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl flex items-center space-x-1 text-[11px] transition font-bold"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>โทรหาร้าน</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Quick Modal */}
      <WalkInModal isOpen={showWalkInModal} onClose={() => setShowWalkInModal(false)} />
    </div>
  );
};
