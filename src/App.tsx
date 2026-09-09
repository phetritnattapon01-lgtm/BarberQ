import React, { useState, useEffect } from 'react';
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
import { AdvanceQueueAlertModal } from './components/AdvanceQueueAlertModal';
import { AdvanceQueueToast } from './components/AdvanceQueueToast';
import { Scissors, Sparkles, Clock, ShieldCheck, MapPin } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAdminUnlocked,
    unlockAdminWithPin,
    shopSettings,
    advanceAlertData,
    dismissAdvanceAlert,
  } = useBooking();
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [showModalAlert, setShowModalAlert] = useState(false);

  // Synchronize modal visibility with new advance queue alerts
  useEffect(() => {
    if (advanceAlertData) {
      const alertType = shopSettings.advanceNotificationType || 'both';
      if (alertType === 'popup' || alertType === 'both') {
        setShowModalAlert(true);
      }
    } else {
      setShowModalAlert(false);
    }
  }, [advanceAlertData, shopSettings.advanceNotificationType]);

  const isTabProtected =
    (activeTab === 'accounting' || activeTab === 'settings' || activeTab === 'barber_panel') &&
    shopSettings.pinLockEnabled !== false &&
    !isAdminUnlocked;

  const getProtectedTabTitle = () => {
    switch (activeTab) {
      case 'barber_panel':
        return 'แผงควบคุมและข้อมูล 3 ช่าง (Barber Station Hub)';
      case 'accounting':
        return 'ระบบบัญชี รายรับ-รายจ่าย';
      case 'settings':
      default:
        return 'ระบบตั้งค่าหลังบ้าน (Admin Settings)';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Advance Queue Toast Notification (Shown when alert is active and configured for toast/both) */}
      {advanceAlertData && !showModalAlert && (shopSettings.advanceNotificationType === 'toast' || shopSettings.advanceNotificationType === 'both' || !shopSettings.advanceNotificationType) && (
        <AdvanceQueueToast
          alertData={advanceAlertData}
          onClose={dismissAdvanceAlert}
          onOpenModal={() => setShowModalAlert(true)}
        />
      )}

      {/* Advance Queue Pop-up Modal Alert (Shown when alert is active and configured for popup/both) */}
      {showModalAlert && advanceAlertData && (
        <AdvanceQueueAlertModal
          alertData={advanceAlertData}
          onClose={() => {
            setShowModalAlert(false);
            dismissAdvanceAlert();
          }}
        />
      )}

      {/* Outer wrapper to toggle between Fullscreen and Smartphone Frame */}
      <div className={`w-full mx-auto transition-all duration-300 ${isMobileFrame ? 'max-w-md my-4 rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden bg-zinc-950' : 'max-w-4xl'}`}>
        {/* App Header */}
        <Header isMobileFrame={isMobileFrame} setIsMobileFrame={setIsMobileFrame} />

        {/* Dynamic View Content */}
        <main className="p-3.5 sm:p-5 flex-1 pb-24 sm:pb-28">
          {isTabProtected ? (
            <InlinePinLockScreen
              targetTitle={getProtectedTabTitle()}
              currentPin={shopSettings.adminPin || '8888'}
              onSuccess={() => unlockAdminWithPin(shopSettings.adminPin || '8888')}
              onCancel={() => setActiveTab('book')}
            />
          ) : (
            <>
              {activeTab === 'book' && <BookingStepWizard />}
              {activeTab === 'live_queue' && <LiveQueueTracker isMobileFrame={isMobileFrame} />}
              {activeTab === 'barber_panel' && <BarberDashboard isMobileFrame={isMobileFrame} />}
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
