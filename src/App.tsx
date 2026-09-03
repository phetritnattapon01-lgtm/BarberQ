import React, { useState } from 'react';
import { BookingProvider, useBooking } from './context/BookingContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { BookingStepWizard } from './components/BookingStepWizard';
import { LiveQueueTracker } from './components/LiveQueueTracker';
import { BarberDashboard } from './components/BarberDashboard';
import { HistoryReceiptModal } from './components/HistoryReceiptModal';
import { AdminSettings } from './components/AdminSettings';
import { AccountingView } from './components/AccountingView';
import { InlinePinLockScreen } from './components/PinLockModal';
import { Scissors, Sparkles, Clock, ShieldCheck, MapPin } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAdminUnlocked,
    unlockAdminWithPin,
    shopSettings,
  } = useBooking();
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  const isTabProtected = (activeTab === 'accounting' || activeTab === 'settings') && shopSettings.pinLockEnabled !== false && !isAdminUnlocked;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Outer wrapper to toggle between Fullscreen and Smartphone Frame */}
      <div className={`w-full mx-auto transition-all duration-300 ${isMobileFrame ? 'max-w-md my-4 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden bg-zinc-950' : 'max-w-4xl'}`}>
        {/* App Header */}
        <Header isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame} />

        {/* Dynamic View Content */}
        <main className="p-3.5 sm:p-5 flex-1 pb-24 sm:pb-28">
          {isTabProtected ? (
            <InlinePinLockScreen
              targetTitle={activeTab === 'accounting' ? 'ระบบบัญชี รายรับ-รายจ่าย' : 'ระบบตั้งค่าหลังบ้าน (Admin)'}
              currentPin={shopSettings.adminPin || '8888'}
              onSuccess={() => unlockAdminWithPin(shopSettings.adminPin || '8888')}
              onCancel={() => setActiveTab('book')}
            />
          ) : (
            <>
              {activeTab === 'book' && <BookingStepWizard />}
              {activeTab === 'live_queue' && <LiveQueueTracker />}
              {activeTab === 'barber_panel' && <BarberDashboard />}
              {activeTab === 'accounting' && <AccountingView />}
              {activeTab === 'history' && <HistoryReceiptModal />}
              {activeTab === 'settings' && <AdminSettings />}
            </>
          )}
        </main>
      </div>

      {/* Fixed Bottom Navigation */}
      <Navigation isMobileFrame={isMobileFrame} />
    </div>
  );
};

export default function App() {
  return (
    <BookingProvider>
      <MainAppContent />
    </BookingProvider>
  );
}
