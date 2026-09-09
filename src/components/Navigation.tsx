import React, { useState } from 'react';
import { CalendarDays, Clock, Users, DollarSign, Settings, Lock, Unlock } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { ActiveTab } from '../types';
import { PinLockModal } from './PinLockModal';

interface NavigationProps {
  isMobileFrame?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ isMobileFrame }) => {
  const {
    activeTab,
    setActiveTab,
    activeBooking,
    shopSettings,
    isAdminUnlocked,
    unlockAdminWithPin,
  } = useBooking();

  const [pendingTab, setPendingTab] = useState<ActiveTab | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const isCurrentActiveQueue =
    activeBooking &&
    activeBooking.status !== 'COMPLETED' &&
    activeBooking.status !== 'CANCELLED';

  const isPinEnabled = shopSettings.pinLockEnabled !== false;

  const handleTabClick = (tabId: ActiveTab) => {
    // Check if protected tab and currently locked
    if (
      (tabId === 'accounting' || tabId === 'settings' || tabId === 'barber_panel') &&
      isPinEnabled &&
      !isAdminUnlocked
    ) {
      setPendingTab(tabId);
      setShowPinModal(true);
      return;
    }

    setActiveTab(tabId);
  };

  const handlePinSuccess = () => {
    unlockAdminWithPin(shopSettings.adminPin || '8888');
    if (pendingTab) {
      setActiveTab(pendingTab);
    }
    setShowPinModal(false);
    setPendingTab(null);
  };

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    isProtected?: boolean;
  }[] = [
    {
      id: 'book',
      label: 'จองคิว',
      icon: CalendarDays,
    },
    {
      id: 'live_queue',
      label: 'คิวสด',
      icon: Clock,
      badge: isCurrentActiveQueue ? 'สด' : undefined,
    },
    {
      id: 'barber_panel',
      label: '3 ช่าง',
      icon: Users,
      isProtected: true,
    },
    {
      id: 'accounting',
      label: 'รายรับ-จ่าย',
      icon: DollarSign,
      badge: 'บัญชี',
      isProtected: true,
    },
    {
      id: 'settings',
      label: 'หลังบ้าน',
      icon: Settings,
      isProtected: true,
    },
  ];

  return (
    <>
      <nav
        className={`fixed bottom-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-1.5 sm:py-2 transition-all duration-300 ${
          isMobileFrame
            ? 'left-1/2 -translate-x-1/2 w-full max-w-md rounded-b-3xl'
            : 'left-0 right-0'
        }`}
      >
        <div className="max-w-md sm:max-w-xl mx-auto grid grid-cols-5 gap-1 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isItemLocked = item.isProtected && isPinEnabled && !isAdminUnlocked;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 h-14 ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-400 font-semibold shadow-sm shadow-amber-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 font-normal'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
                      isActive ? 'scale-110 text-amber-400' : ''
                    }`}
                  />
                  {item.badge && (
                    <span
                      className={`absolute -top-1.5 -right-3.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase leading-none ${
                        item.badge === 'สด'
                          ? 'bg-emerald-500 text-white animate-pulse shadow-sm shadow-emerald-500/40'
                          : 'bg-zinc-800 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Lock Indicator icon for protected tabs */}
                  {isItemLocked && (
                    <span
                      className="absolute -top-1 -left-2 w-3.5 h-3.5 bg-zinc-900 rounded-full border border-amber-500/50 flex items-center justify-center text-amber-400 shadow"
                      title="มีรหัส Lock ป้องกัน"
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 text-center truncate max-w-full block leading-snug">
                  {item.label}
                </span>
                <div
                  className={`w-4 h-0.5 rounded-full mt-0.5 transition-colors ${
                    isActive ? 'bg-amber-400' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* PIN Security Modal */}
      <PinLockModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingTab(null);
        }}
        onSuccess={handlePinSuccess}
        currentPin={shopSettings.adminPin || '8888'}
        targetTitle={pendingTab === 'accounting' ? 'ระบบบัญชี รายรับ-จ่าย' : 'เมนูตั้งค่าหลังบ้าน'}
      />
    </>
  );
};
