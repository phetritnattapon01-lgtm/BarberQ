import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  Scissors,
  Phone,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  User,
  CheckCircle,
  Footprints,
  Users,
  Timer,
  Hourglass,
  ArrowRight,
  CalendarClock,
  Search,
  Armchair,
  Filter,
  X,
  Ticket,
  AlertCircle,
  Bell,
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

export interface LiveQueueTrackerProps {
  isMobileFrame?: boolean;
}

const getBarberDisplayName = (nickname: string) => {
  if (!nickname) return '';
  return nickname.startsWith('ช่าง') ? nickname : `ช่าง${nickname}`;
};

export const LiveQueueTracker: React.FC<LiveQueueTrackerProps> = ({ isMobileFrame }) => {
  const {
    bookings,
    activeBooking,
    setActiveBookingId,
    updateBookingStatus,
    simulateNextQueueEvent,
    barbers,
    cancelBooking,
    triggerAdvanceQueueAlert,
    shopSettings,
  } = useBooking();

  // Active view: 'stations' (ผัง 3 ช่าง), 'timeline' (ตารางคิวทั้งหมด), 'ticket' (บัตรคิวเดี่ยว)
  const [activeView, setActiveView] = useState<'stations' | 'timeline' | 'ticket'>('stations');

  // Check if shop is currently within opening hours from settings
  const isShopOpen = useMemo(() => {
    if (!shopSettings?.openTime || !shopSettings?.closeTime) return true;
    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [openH, openM] = shopSettings.openTime.split(':').map((v) => parseInt(v, 10) || 0);
      const [closeH, closeM] = shopSettings.closeTime.split(':').map((v) => parseInt(v, 10) || 0);

      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (closeMinutes >= openMinutes) {
        return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
      } else {
        return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
      }
    } catch {
      return true;
    }
  }, [shopSettings?.openTime, shopSettings?.closeTime]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Station barber filter
  const [stationBarberFilter, setStationBarberFilter] = useState<'all' | BarberId>('all');

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
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = a.bookingDate || '';
      const dateB = b.bookingDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      const slotA = a.bookingTimeSlot || '';
      const slotB = b.bookingTimeSlot || '';
      return slotA.localeCompare(slotB);
    });
  }, [bookings]);

  // Search filtered bookings
  const searchedBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedBookings;

    return sortedBookings.filter(
      (b) =>
        (b.queueNumber || '').toLowerCase().includes(query) ||
        (b.customerName || '').toLowerCase().includes(query) ||
        (b.customerPhone || '').includes(query) ||
        (b.barber?.nickname || '').toLowerCase().includes(query) ||
        (b.barber?.name || '').toLowerCase().includes(query) ||
        (b.service?.name || '').toLowerCase().includes(query)
    );
  }, [sortedBookings, searchQuery]);

  // Filtered bookings for timetable
  const filteredBookings = useMemo(() => {
    return searchedBookings.filter((b) => {
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
  }, [searchedBookings, selectedBarberFilter, statusFilter]);

  // Metrics for overview
  const inProgressCount = bookings.filter((b) => b.status === 'IN_PROGRESS').length;
  const waitingCount = bookings.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'BARBER_PREPARING'
  ).length;
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const walkInCount = bookings.filter((b) => b.isWalkIn).length;

  // Selected active booking calculation
  const currentActive = activeBooking || sortedBookings.find(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED') || sortedBookings[0] || null;

  // Calculate people ahead for the active ticket
  const peopleAhead = currentActive
    ? bookings.filter(
        (b) =>
          b.barberId === currentActive.barberId &&
          b.bookingDate === currentActive.bookingDate &&
          b.status !== 'COMPLETED' &&
          b.status !== 'CANCELLED' &&
          b.id !== currentActive.id &&
          b.bookingTimeSlot < currentActive.bookingTimeSlot
      ).length
    : 0;

  const getStepState = (stepStatus: BookingStatus, targetBooking: Booking) => {
    const order: BookingStatus[] = ['CONFIRMED', 'BARBER_PREPARING', 'IN_PROGRESS', 'COMPLETED'];
    if (targetBooking.status === 'CANCELLED') return 'cancelled';
    const currentIndex = order.indexOf(targetBooking.status);
    const stepIndex = order.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-4 pb-16 animate-fadeIn">
      {/* 1. Header: เรียบง่าย ชัดเจน เข้าใจง่ายในทันที */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl">
        <div
          className={`pb-3 border-b border-zinc-800/80 flex gap-3 ${
            isMobileFrame
              ? 'flex-col'
              : 'flex-col sm:flex-row sm:items-center justify-between'
          }`}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-black tracking-wide text-zinc-100 whitespace-nowrap">
                  ระบบคิวสดหน้าร้าน
                </h2>
                {isShopOpen ? (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 inline-flex items-center space-x-1 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>กำลังเปิดบริการ</span>
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-400 font-bold border border-zinc-700/60 inline-flex items-center space-x-1 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <span>ปิดบริการแล้ว</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                เวลาปัจจุบัน <strong className="font-mono text-amber-400 tabular-nums">{currentTimeStr} น.</strong> • ร้านเปิด {shopSettings?.openTime || '10:00'} - {shopSettings?.closeTime || '20:30'} น.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowWalkInModal(true);
              soundFx.playClick();
            }}
            className={`h-10 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-600/25 active:scale-95 cursor-pointer shrink-0 border border-purple-500/30 whitespace-nowrap ${
              isMobileFrame ? 'w-full' : 'w-full sm:w-auto'
            }`}
          >
            <Footprints className="w-4 h-4 text-purple-200 shrink-0" />
            <span>+ ออกบัตรคิว Walk-in</span>
          </button>
        </div>

        {/* 3 สถานะหลักแบบเข้าใจง่าย (กำลังตัด / รอคิว / เสร็จแล้ว) - ปรับสัดส่วนให้เท่ากัน */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3">
          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between">
            <span className="text-xs text-zinc-400 flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">กำลังตัดผม</span>
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400 block mt-1 tabular-nums">
              {inProgressCount} <span className="text-xs font-sans text-zinc-500 font-normal">คิว</span>
            </span>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between">
            <span className="text-xs text-zinc-400 flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="whitespace-nowrap">รอรับบริการ</span>
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 block mt-1 tabular-nums">
              {waitingCount} <span className="text-xs font-sans text-zinc-500 font-normal">คิว</span>
            </span>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between">
            <span className="text-xs text-zinc-400 flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span className="whitespace-nowrap">ตัดเสร็จแล้ว</span>
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-blue-400 block mt-1 tabular-nums">
              {completedCount} <span className="text-xs font-sans text-zinc-500 font-normal">คิว</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. บัตรคิวของคุณ (ถ้ามีคิวที่กำลังติดตามอยู่ ให้แสดงเด่นชัดทันที เข้าใจง่าย ไม่ต้องค้นหา) */}
      {currentActive && currentActive.status !== 'CANCELLED' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-4.5 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-zinc-950 font-mono font-black flex flex-col items-center justify-center shadow-md shrink-0">
                <span className="text-xs leading-none">คิว</span>
                <span className="text-sm font-black">{currentActive.queueNumber}</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-amber-400 font-bold">คิวของคุณ: {currentActive.customerName}</span>
                  {currentActive.status === 'IN_PROGRESS' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>กำลังตัดผมอยู่</span>
                    </span>
                  ) : currentActive.status === 'BARBER_PREPARING' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>ช่างกำลังเตรียมเก้าอี้</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                      รออีก {peopleAhead === 0 ? 'ถึงคิวแล้ว!' : `${peopleAhead} คิว`}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  ช่าง: <strong className="text-zinc-100">{getBarberDisplayName(currentActive.barber.nickname)}</strong> (เก้าอี้ #{currentActive.barber.chairNumber}) • นัดเวลา {currentActive.bookingTimeSlot} น.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setActiveBookingId(currentActive.id);
                  setActiveView('ticket');
                  soundFx.playClick();
                }}
                className="h-8 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center space-x-1 shadow transition cursor-pointer"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>ดูบัตรคิวเต็ม</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cancelBooking(currentActive.id);
                }}
                className="h-8 px-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-bold flex items-center space-x-1 transition cursor-pointer"
                title="ยกเลิกการจองคิวนี้"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>ยกเลิก</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. แท็บเลือกมุมมอง: 3 มุมมองเข้าใจง่าย (ผัง 3 ช่าง / ตารางเวลาทั้งหมด / บัตรคิวของฉัน) */}
      <div className="grid grid-cols-3 p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl gap-1 shadow-md">
        <button
          type="button"
          onClick={() => {
            setActiveView('stations');
            soundFx.playClick();
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeView === 'stations'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Armchair className="w-4 h-4 shrink-0" />
          <span>ผัง 3 ช่าง</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('timeline');
            soundFx.playClick();
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeView === 'timeline'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <CalendarClock className="w-4 h-4 shrink-0" />
          <span>ตารางคิวทั้งหมด</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeView === 'timeline' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {bookings.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('ticket');
            soundFx.playClick();
          }}
          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeView === 'ticket'
              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
          }`}
        >
          <Ticket className="w-4 h-4 shrink-0" />
          <span>บัตรคิวของฉัน</span>
          {currentActive && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeView === 'ticket' ? 'bg-zinc-950/20 text-zinc-950' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              #{currentActive.queueNumber}
            </span>
          )}
        </button>
      </div>

      {/* 4. ช่องค้นหาคิวด่วน (ค้นหาตามเลขคิว หรือชื่อลูกค้า) */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาเลขคิว (เช่น Q-001, W-001) หรือชื่อลูกค้า..."
          className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-2.5 text-xs text-zinc-500 hover:text-zinc-300 font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ผังเก้าอี้ 3 ช่าง (ดูง่ายที่สุด สรุปชัดเจนว่าใครกำลังตัด/ใครว่าง)   */}
      {/* ========================================================================= */}
      {activeView === 'stations' && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span className="font-bold flex items-center space-x-1.5 text-zinc-200">
              <Armchair className="w-3.5 h-3.5 text-amber-400" />
              <span>สถานะเก้าอี้ช่าง ({barbers.length} ท่าน)</span>
            </span>
            <span className="text-[11px] text-zinc-400">คลิกที่บัตรเพื่อดูคิว</span>
          </div>

          <div className={`grid gap-3.5 ${isMobileFrame ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            {barbers.map((barber) => {
              const isBarberClosed = barber.isActive === false;
              const barberBookings = sortedBookings.filter((b) => b.barberId === barber.id);

              // 1. คิวที่กำลังตัดตอนนี้ (IN_PROGRESS หรือ BARBER_PREPARING)
              const nowServing = barberBookings.find(
                (b) => b.status === 'IN_PROGRESS' || b.status === 'BARBER_PREPARING'
              );

              // 2. คิวถัดไปที่รออยู่ (CONFIRMED)
              const nextInLine = barberBookings.find(
                (b) => b.status === 'CONFIRMED' && b.id !== nowServing?.id
              );

              // 3. จำนวนคิวรอทั้งหมดของช่างนี้
              const waitingCountForBarber = barberBookings.filter(
                (b) => b.status === 'CONFIRMED' || b.status === 'BARBER_PREPARING'
              ).length;

              const isServing = !!nowServing;

              return (
                <div
                  key={barber.id}
                  className={`rounded-3xl border transition-all p-4 relative overflow-hidden flex flex-col justify-between ${
                    isBarberClosed
                      ? 'bg-zinc-950/60 border-zinc-900 opacity-60'
                      : isServing
                      ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                      : 'bg-zinc-900/80 border-zinc-800 shadow-md'
                  }`}
                >
                  <div>
                    {/* ข้อมูลช่างและหมายเลขเก้าอี้ */}
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                      <div className="flex items-center space-x-2.5">
                        <div className="relative">
                          <img
                            src={barber.avatarUrl}
                            alt={barber.name}
                            className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-500/40 shadow shrink-0"
                          />
                          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-zinc-950 border border-zinc-700 text-[9px] font-mono font-black text-amber-400">
                            #{barber.chairNumber}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h3 className="text-sm font-black text-white">{getBarberDisplayName(barber.nickname)}</h3>
                            <span className="text-[10px] text-zinc-400 font-medium">
                              (เก้าอี้ {barber.chairNumber})
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate max-w-[140px]">{barber.name}</p>
                        </div>
                      </div>

                      <div>
                        {isBarberClosed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            งดรับคิว
                          </span>
                        ) : isServing ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center space-x-1 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>กำลังตัดผม</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>ว่างพร้อมรับ</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* กล่อง 1: กำลังตัดตอนนี้ */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                        <Scissors className="w-3 h-3" />
                        <span>กำลังตัดอยู่บนเก้าอี้:</span>
                      </span>

                      {nowServing ? (
                        <div
                          onClick={() => {
                            setActiveBookingId(nowServing.id);
                            setActiveView('ticket');
                            soundFx.playClick();
                          }}
                          className="p-3 bg-zinc-950/90 rounded-2xl border border-emerald-500/40 hover:border-emerald-400 transition cursor-pointer shadow-inner space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-black font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                {nowServing.queueNumber}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                                  {nowServing.customerName}
                                </h4>
                                <span className="text-[10px] text-zinc-400">
                                  {nowServing.service.name}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] font-mono font-bold text-emerald-400 block">
                                ถึง ~{calculateEndTime(nowServing.bookingTimeSlot, nowServing.durationMinutes)} น.
                              </span>
                              <span className="text-[10px] text-zinc-500 block">
                                (เริ่ม {nowServing.bookingTimeSlot} น.)
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-zinc-950/50 rounded-2xl border border-zinc-850 text-center py-3 flex flex-col justify-center">
                          <span className="text-xs text-zinc-400 block">เก้าอี้ว่าง ไม่มีลูกค้ากำลังตัด</span>
                          <span className="text-[11px] text-emerald-400 font-bold mt-0.5 block">
                            สามารถออกคิว Walk-in ให้{getBarberDisplayName(barber.nickname)} ได้ทันที
                          </span>
                        </div>
                      )}
                    </div>

                    {/* กล่อง 2: คิวรอถัดไป */}
                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-bold text-amber-400 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>คิวรอถัดไป (เตรียมตัว):</span>
                      </span>

                      {nextInLine ? (
                        <div
                          onClick={() => {
                            setActiveBookingId(nextInLine.id);
                            setActiveView('ticket');
                            soundFx.playClick();
                          }}
                          className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800 hover:border-amber-500/40 transition cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {nextInLine.queueNumber}
                            </span>
                            <span className="text-xs font-bold text-zinc-200 truncate max-w-[120px]">
                              {nextInLine.customerName}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-400">
                            เวลานัด {nextInLine.bookingTimeSlot} น.
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 bg-zinc-950/40 rounded-xl border border-zinc-850 text-center text-[11px] text-zinc-500">
                          ไม่มีคิวรอถัดไป
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ส่วนล่าง: สรุปจำนวนคิวรอ & ปุ่มดูตารางเวลา */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-zinc-400 text-[11px]">
                      คิวรอทั้งหมด:{' '}
                      <strong className="text-amber-400 font-bold">{waitingCountForBarber}</strong> คิว
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBarberFilter(barber.id);
                        setActiveView('timeline');
                        soundFx.playClick();
                      }}
                      className="h-7 px-2.5 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-bold flex items-center space-x-1 transition cursor-pointer"
                    >
                      <span>ดูคิวช่างคนนี้</span>
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ตารางคิวทั้งหมด (เรียงตามลำดับเวลา เข้าใจง่าย มีตัวกรอง)          */}
      {/* ========================================================================= */}
      {activeView === 'timeline' && (
        <div className="space-y-3.5">
          {/* ตัวกรองช่างและสถานะ */}
          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 space-y-2.5 shadow-md">
            {/* กรองตามช่าง */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-xs text-zinc-400 font-bold shrink-0 flex items-center space-x-1 mr-1">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>ช่าง:</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedBarberFilter('all')}
                className={`h-7 px-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center shrink-0 ${
                  selectedBarberFilter === 'all'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow'
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
                    className={`h-7 px-2.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1 shrink-0 ${
                      selectedBarberFilter === barber.id
                        ? 'bg-amber-500 text-zinc-950 font-black shadow'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    <span>{getBarberDisplayName(barber.nickname)}</span>
                    <span className="text-[10px] opacity-80 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* กรองตามสถานะ */}
            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800/80">
              <span className="text-xs text-zinc-400 font-bold shrink-0 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <span>สถานะ:</span>
              </span>
              <div className="grid grid-cols-3 gap-1.5 flex-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`h-7 text-center text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${
                    statusFilter === 'all'
                      ? 'bg-zinc-700 text-white font-extrabold shadow-sm'
                      : 'text-zinc-400 hover:text-white bg-zinc-950/70 border border-zinc-800'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`h-7 text-center text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${
                    statusFilter === 'active'
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : 'text-emerald-400 hover:text-white bg-zinc-950/70 border border-zinc-800'
                  }`}
                >
                  <span>🟢 กำลังตัด/รอคิว</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`h-7 text-center text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center ${
                    statusFilter === 'completed'
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                      : 'text-blue-400 hover:text-white bg-zinc-950/70 border border-zinc-800'
                  }`}
                >
                  <span>🔵 เสร็จแล้ว</span>
                </button>
              </div>
            </div>
          </div>

          {/* รายการคิว */}
          <div className="space-y-2.5">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-zinc-400 text-xs space-y-2">
                <CalendarClock className="w-8 h-8 mx-auto text-zinc-600" />
                <p>ไม่พบคิวตรงกับคำค้นหาหรือตัวกรองที่เลือก</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBarberFilter('all');
                    setStatusFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-zinc-800 text-amber-400 rounded-xl text-xs hover:bg-zinc-700 font-bold"
                >
                  ล้างตัวกรองและค้นหาใหม่
                </button>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const endTime = calculateEndTime(b.bookingTimeSlot, b.durationMinutes);
                const isInProgress = b.status === 'IN_PROGRESS';
                const isPrep = b.status === 'BARBER_PREPARING';
                const isDone = b.status === 'COMPLETED';

                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl border transition-all p-3.5 sm:p-4 shadow-md space-y-2.5 ${
                      isInProgress
                        ? 'bg-gradient-to-r from-zinc-900 to-zinc-950 border-emerald-500/70 ring-1 ring-emerald-500/30'
                        : isPrep
                        ? 'bg-gradient-to-r from-zinc-900 to-zinc-950 border-amber-500/70 ring-1 ring-amber-500/30'
                        : isDone
                        ? 'bg-zinc-950/60 border-zinc-900 opacity-75'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* แถวบน: หมายเลขคิว ชื่อลูกค้า และสถานะ */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 border shadow-inner ${
                            b.isWalkIn
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          <span className="text-xs tracking-tight">{b.queueNumber}</span>
                          <span className="text-[9px] opacity-80 font-sans font-bold leading-none">
                            {b.isWalkIn ? 'Walk-in' : 'จอง'}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-zinc-100 truncate">
                            {b.customerName}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate">
                            โทร {b.customerPhone}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isInProgress && (
                          <span className="h-7 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold inline-flex items-center space-x-1.5 shadow-sm whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>กำลังตัด</span>
                          </span>
                        )}
                        {isPrep && (
                          <span className="h-7 px-2.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold inline-flex items-center space-x-1.5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            <span>เตรียมโต๊ะ</span>
                          </span>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <span className="h-7 px-2.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-semibold inline-flex items-center space-x-1.5 whitespace-nowrap">
                            <Hourglass className="w-3 h-3 text-amber-400" />
                            <span>รอตามเวลา</span>
                          </span>
                        )}
                        {isDone && (
                          <span className="h-7 px-2.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold inline-flex items-center space-x-1.5 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-blue-400" />
                            <span>เสร็จแล้ว</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* แถวกลาง: ข้อมูลบริการและเวลา */}
                    <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 gap-2">
                      <span className="text-amber-300/90 font-medium truncate">
                        ✂️ {b.service.name}
                      </span>
                      <span className="font-mono text-zinc-300 font-bold shrink-0 text-[11px] whitespace-nowrap bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                        ⏰ {b.bookingTimeSlot} - {endTime} น.
                      </span>
                    </div>

                    {/* แถวล่าง: ช่างผู้ให้บริการ และปุ่มดูบัตรคิว */}
                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 gap-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <img
                          src={b.barber.avatarUrl}
                          alt={b.barber.name}
                          className="w-7 h-7 rounded-lg object-cover border border-amber-500/40 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-zinc-200 block truncate">
                            {getBarberDisplayName(b.barber.nickname)}
                          </span>
                          <span className="text-[10px] text-amber-400/90 block font-mono leading-none">
                            เก้าอี้ #{b.barber.chairNumber}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
                        {(b.status === 'CONFIRMED' || b.status === 'BARBER_PREPARING') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerAdvanceQueueAlert(b, 15);
                            }}
                            className="h-7 px-2 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg transition flex items-center space-x-1 cursor-pointer"
                            title="ส่งการแจ้งเตือนคิวล่วงหน้า 15 นาที สำหรับคิวนี้"
                          >
                            <Bell className="w-3 h-3 text-amber-400" />
                            <span className="hidden sm:inline text-xs">เตือน 15 นาที</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveBookingId(b.id);
                            setActiveView('ticket');
                            soundFx.playClick();
                          }}
                          className="h-7 px-3 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 text-xs font-bold rounded-lg transition flex items-center space-x-1 shrink-0 border border-zinc-700 shadow-sm cursor-pointer whitespace-nowrap"
                          title="ดูบัตรคิวเดี่ยว"
                        >
                          <span>ดูบัตรคิว</span>
                          <ArrowRight className="w-3 h-3" />
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

      {/* ========================================================================= */}
      {/* VIEW 3: บัตรคิวเดี่ยว (ตัวเลขโต ชัดเจน สวยงาม เข้าใจง่าย)                     */}
      {/* ========================================================================= */}
      {activeView === 'ticket' && (
        <div className="space-y-4">
          {currentActive ? (
            <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* ช่วงเวลาที่นัดหมาย */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-300/80 font-bold block">
                      เวลานัดหมายรับบริการ
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

              {/* หมายเลขคิวตัวโต & ข้อมูลช่าง */}
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
                        จองออนไลน์
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
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={currentActive.barber.avatarUrl}
                      alt={currentActive.barber.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md"
                    />
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-100 block">
                        {getBarberDisplayName(currentActive.barber.nickname)}
                      </span>
                      <span className="text-[11px] text-amber-400 font-semibold block">
                        เก้าอี้ #{currentActive.barber.chairNumber}
                      </span>
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {currentActive.service.name} (฿{currentActive.finalTotalPrice})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 ตัววัดสรุป: เวลาเริ่ม / คิวรอข้างหน้า / เวลาเสร็จโดยประมาณ */}
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
                    {peopleAhead === 0 ? 'ถึงคิวแล้ว!' : `${peopleAhead} คิว`}
                  </span>
                </div>

                <div className="p-2.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center">
                  <span className="text-[10px] text-zinc-500 block">เสร็จโดยประมาณ</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 block mt-0.5">
                    {calculateEndTime(currentActive.bookingTimeSlot, currentActive.durationMinutes)} น.
                  </span>
                </div>
              </div>

              {/* ความคืบหน้า 4 ขั้นตอน เข้าใจง่าย (สามารถคลิกเพื่อเปลี่ยนสถานะได้) */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>ลำดับขั้นตอนการรับบริการ:</span>
                    <span className="text-[10px] text-zinc-500 font-normal hidden sm:inline">
                      (คลิกเลือกขั้นตอนได้)
                    </span>
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {currentActive.status === 'CONFIRMED' && '1. ได้รับคิวเรียบร้อย'}
                    {currentActive.status === 'BARBER_PREPARING' && '2. ช่างกำลังเตรียมเก้าอี้'}
                    {currentActive.status === 'IN_PROGRESS' && '3. กำลังตัดผม'}
                    {currentActive.status === 'COMPLETED' && '4. บริการเสร็จสิ้นแล้ว'}
                    {currentActive.status === 'CANCELLED' && 'ยกเลิกคิวแล้ว'}
                  </span>
                </div>

                {statusToast && (
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center space-x-2 animate-fadeIn shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{statusToast}</span>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                  {[
                    {
                      id: 'CONFIRMED',
                      label: '1. ได้รับคิว',
                      fullLabel: '1. ยืนยันคิว',
                      note: 'ลูกค้ายืนยันคิว',
                    },
                    {
                      id: 'BARBER_PREPARING',
                      label: '2. เตรียมเก้าอี้',
                      fullLabel: '2. เตรียมเก้าอี้',
                      note: `${getBarberDisplayName(currentActive.barber.nickname)} เตรียมอุปกรณ์พร้อม`,
                    },
                    {
                      id: 'IN_PROGRESS',
                      label: '3. กำลังตัด',
                      fullLabel: '3. กำลังตัดผม',
                      note: `เริ่มตัดผมทรง ${currentActive.service.name}`,
                    },
                    {
                      id: 'COMPLETED',
                      label: '4. เสร็จสิ้น',
                      fullLabel: '4. บริการเสร็จสิ้นแล้ว',
                      note: 'บริการเสร็จสิ้น',
                    },
                  ].map((step) => {
                    const state = getStepState(step.id as BookingStatus, currentActive);
                    const isCurrent = currentActive.status === step.id;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => {
                          if (step.id === 'COMPLETED' || step.id === 'IN_PROGRESS') {
                            soundFx.playSuccess();
                          } else {
                            soundFx.playClick();
                          }
                          updateBookingStatus(
                            currentActive.id,
                            step.id as BookingStatus,
                            step.note
                          );
                          setStatusToast(`⚡ เปลี่ยนสถานะเป็น: ${step.fullLabel}`);
                          setTimeout(() => setStatusToast(null), 2500);
                        }}
                        title={`คลิกเพื่อเปลี่ยนสถานะเป็น "${step.fullLabel}"`}
                        className={`group space-y-1.5 text-center p-1.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                          isCurrent
                            ? 'bg-amber-500/10 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                            : 'hover:bg-zinc-800/80 border border-zinc-800/50 hover:border-zinc-700'
                        }`}
                      >
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 group-hover:brightness-125 ${
                            state === 'completed'
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                              : state === 'current'
                              ? 'bg-amber-500 animate-pulse shadow-sm shadow-amber-500/40 ring-2 ring-amber-400/30'
                              : 'bg-zinc-800 group-hover:bg-zinc-700'
                          }`}
                        />
                        <span
                          className={`text-[11px] block font-semibold truncate transition-colors ${
                            state === 'current'
                              ? 'text-amber-400 font-bold'
                              : state === 'completed'
                              ? 'text-emerald-400'
                              : 'text-zinc-500 group-hover:text-zinc-300'
                          }`}
                        >
                          {step.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ส่วนติดต่อร้านและปุ่มยกเลิกคิว */}
              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 gap-2">
                <div className="flex items-center space-x-1 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">BarberQ สยามสแควร์ ซอย 3</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {currentActive.status !== 'COMPLETED' && currentActive.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={() => {
                        cancelBooking(currentActive.id);
                      }}
                      className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-rose-200 rounded-xl flex items-center space-x-1 text-[11px] transition font-bold cursor-pointer active:scale-95"
                      title="ยกเลิกการจองคิวนี้"
                    >
                      <X className="w-3 h-3 text-rose-400" />
                      <span>ยกเลิกคิว</span>
                    </button>
                  )}

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
          ) : (
            <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-zinc-800 text-zinc-400 text-xs space-y-2">
              <Ticket className="w-8 h-8 mx-auto text-zinc-600" />
              <p>ยังไม่มีบัตรคิวที่เลือก</p>
              <button
                type="button"
                onClick={() => setActiveView('stations')}
                className="px-3.5 py-1.5 bg-amber-500 text-zinc-950 rounded-xl text-xs font-bold"
              >
                ดูผังคิวหน้าร้าน
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. เครื่องมือจำลอง (ซ่อนไว้ด้านล่างสุดสำหรับทดสอบระบบ ไม่ให้รบกวนมุมมองหลัก) */}
      {currentActive && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowSimulator(!showSimulator)}
            className="w-full py-2 px-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded-xl text-xs font-bold text-zinc-500 hover:text-amber-300 flex items-center justify-between transition cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
              <span>เครื่องมือทดสอบจำลองคิว (Simulator)</span>
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
                  ทดสอบเปลี่ยนสถานะคิว {currentActive.queueNumber} ({currentActive.customerName}):
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
                    updateBookingStatus(currentActive.id, 'CONFIRMED', 'ลูกค้ายืนยันคิว');
                    setStatusToast('⚡ เปลี่ยนเป็น: 1. ยืนยันคิว');
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
                      `${getBarberDisplayName(currentActive.barber.nickname)} เตรียมอุปกรณ์พร้อม`
                    );
                    setStatusToast(`⚡ เปลี่ยนเป็น: 2. เตรียมเก้าอี้`);
                    setTimeout(() => setStatusToast(null), 2500);
                  }}
                  className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                    currentActive.status === 'BARBER_PREPARING'
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  2. เตรียมเก้าอี้
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
                    setStatusToast('✂️ เปลี่ยนเป็น: 3. กำลังตัดผม');
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
                      'บริการเสร็จสิ้น'
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
      )}

      {/* Walk-in Quick Modal */}
      {showWalkInModal && <WalkInModal isOpen={showWalkInModal} onClose={() => setShowWalkInModal(false)} />}
    </div>
  );
};
