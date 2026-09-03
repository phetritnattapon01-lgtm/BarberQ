import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Scissors, Sparkles, Smartphone, Monitor, Receipt, Footprints } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { NotificationDrawer } from './NotificationDrawer';
import { WalkInModal } from './WalkInModal';

interface HeaderProps {
  isMobileFrame: boolean;
  setIsMobileFrame: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ isMobileFrame, setIsMobileFrame }) => {
  const { unreadCount, soundEnabled, setSoundEnabled, setActiveTab, activeTab } = useBooking();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 py-2 sm:py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('book')}
            className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer group min-w-0 shrink"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 font-black group-hover:scale-105 transition-transform shrink-0">
              <Scissors className="w-5 h-5 text-zinc-950 -rotate-45" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 whitespace-nowrap">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-mono shrink-0">
                  BARBER<span className="text-amber-400">Q</span>
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 whitespace-nowrap leading-none hidden xs:inline-block sm:inline-block">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 flex items-center whitespace-nowrap truncate max-w-[130px] sm:max-w-none">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1 shrink-0" />
                <span className="truncate">เปิดบริการวันนี้ • คิวว่าง</span>
              </p>
            </div>
          </div>

          {/* Action Icons - All unified to h-9 equal height and vertically aligned */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Quick Walk-in Button */}
            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              title="ออกบัตรคิว Walk-in ด่วนหน้าร้าน"
              className="h-9 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/45 hover:to-indigo-600/45 text-purple-200 border border-purple-500/50 hover:border-purple-400 font-bold transition shadow-sm active:scale-95 cursor-pointer flex items-center justify-center space-x-1 sm:space-x-1.5 shrink-0 whitespace-nowrap"
            >
              <Footprints className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="font-semibold text-xs whitespace-nowrap">Walk-in</span>
            </button>

            {/* History Receipt Shortcut */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              title="ดูประวัติการจองและใบเสร็จ"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Receipt className="w-4 h-4" />
            </button>

            {/* Desktop / Mobile Frame Viewport Switcher */}
            <button
              type="button"
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              title={isMobileFrame ? 'ขยายเป็นหน้าจอเต็ม' : 'เปลี่ยนเป็นกรอบสมาร์ทโฟน'}
              className="hidden sm:flex h-9 items-center space-x-1 text-xs px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition shrink-0 cursor-pointer"
            >
              {isMobileFrame ? (
                <>
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] whitespace-nowrap">เต็มจอ</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] whitespace-nowrap">มุมมองมือถือ</span>
                </>
              )}
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition cursor-pointer ${
                soundEnabled
                  ? 'bg-zinc-900 border-zinc-700 text-amber-400'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              title="การแจ้งเตือน"
              className="relative w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 flex items-center justify-center shrink-0 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Notifications Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Quick Walk-in Queue Modal */}
      <WalkInModal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
      />
    </>
  );
};
