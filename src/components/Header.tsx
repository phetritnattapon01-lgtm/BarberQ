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
  const { unreadCount, soundEnabled, setSoundEnabled, setActiveTab, activeTab, shopSettings } = useBooking();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  // Check if shop is currently open based on settings
  const isShopOpen = React.useMemo(() => {
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

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-3.5 sm:px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('book')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0 shrink"
          >
            <div className="relative w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-zinc-950 shadow-md shadow-amber-500/20 font-black group-hover:scale-105 transition-transform shrink-0">
              <Scissors className="w-5 h-5 text-zinc-950 -rotate-45 shrink-0" />
              <div
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                  isShopOpen ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
                }`}
              />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white shrink-0">
                  BARBER<span className="text-amber-400">Q</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 leading-tight hidden md:inline-block">
                  LIVE
                </span>
              </div>
              <p
                title={`เวลาเปิด-ปิดร้าน: ${shopSettings?.openTime || '10:00'} - ${shopSettings?.closeTime || '20:30'} น.`}
                className="text-xs text-zinc-400 flex items-center whitespace-nowrap truncate leading-none mt-1"
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${
                    isShopOpen ? 'bg-emerald-400' : 'bg-zinc-500'
                  }`}
                />
                <span className="truncate">
                  {isShopOpen ? 'เปิดบริการวันนี้' : 'ปิดบริการ'}
                </span>
                <span className="text-[10px] text-zinc-500 ml-1 hidden sm:inline">
                  ({shopSettings?.openTime || '10:00'} - {shopSettings?.closeTime || '20:30'})
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons - ขนาด ความกว้าง ความสูง และขอบโค้งเท่ากันทุกปุ่ม (Equal & Balanced 36x36px) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pr-0.5">
            {/* 1. Quick Walk-in Button - ขนาด 36x36px ขอบมน rounded-xl เท่ากับปุ่มไอคอนทุกปุ่ม */}
            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              title="ออกบัตรคิว Walk-in ด่วนหน้าร้าน"
              aria-label="ออกบัตรคิว Walk-in"
              className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs border border-purple-500/40 shadow-sm shadow-purple-600/20 flex items-center justify-center active:scale-95 cursor-pointer transition shrink-0 box-border leading-none"
            >
              <Footprints className="w-4 h-4 text-purple-200 shrink-0" />
            </button>

            {/* 2. History Receipt Shortcut */}
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              title="ดูประวัติการจองและใบเสร็จ"
              aria-label="ดูประวัติการจองและใบเสร็จ"
              className={`w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl border flex items-center justify-center shrink-0 transition cursor-pointer box-border ${
                activeTab === 'history'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
            </button>

            {/* 3. Desktop / Mobile Frame Viewport Switcher */}
            <button
              type="button"
              onClick={() => setIsMobileFrame(!isMobileFrame)}
              title={isMobileFrame ? 'ขยายเป็นหน้าจอเต็ม (Fullscreen)' : 'เปลี่ยนเป็นกรอบสมาร์ทโฟน (Mobile View)'}
              aria-label="เปลี่ยนมุมมองหน้าจอ"
              className="w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-zinc-700 transition flex items-center justify-center shrink-0 cursor-pointer box-border"
            >
              {isMobileFrame ? (
                <Monitor className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Smartphone className="w-4 h-4 text-zinc-300 shrink-0" />
              )}
            </button>

            {/* 4. Sound Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
              aria-label="เปิด-ปิดเสียง"
              className={`w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl border flex items-center justify-center shrink-0 transition cursor-pointer box-border ${
                soundEnabled
                  ? 'bg-zinc-900 border-zinc-700 text-amber-400'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 shrink-0" /> : <VolumeX className="w-4 h-4 shrink-0" />}
            </button>

            {/* 5. Notification Bell with Safe Badge Placement */}
            <button
              type="button"
              onClick={() => setShowNotifications(true)}
              title="การแจ้งเตือน"
              aria-label="การแจ้งเตือน"
              className="relative w-9 h-9 min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center shrink-0 transition cursor-pointer box-border"
            >
              <Bell className="w-4 h-4 shrink-0" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-0.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-zinc-950 pointer-events-none">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Real-time Notifications Drawer */}
      {showNotifications && (
        <NotificationDrawer
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* Quick Walk-in Queue Modal */}
      {showWalkInModal && (
        <WalkInModal
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
        />
      )}
    </>
  );
};
