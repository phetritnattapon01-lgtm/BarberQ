import React from 'react';
import { X, CheckCheck, Bell, Sparkles, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBooking } from '../context/BookingContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, setActiveTab, setActiveBookingId } = useBooking();

  if (!isOpen) return null;

  const handleNotificationClick = (notif: (typeof notifications)[0]) => {
    markNotificationAsRead(notif.id);
    if (notif.bookingId) {
      setActiveBookingId(notif.bookingId);
      setActiveTab('live_queue');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100">การแจ้งเตือนแบบเรียลไทม์</h3>
              <p className="text-[11px] text-zinc-400">อัปเดตสถานะคิวและการชำระเงินทันใจ</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1 px-2 py-1 bg-zinc-800 rounded-lg transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>อ่านทั้งหมด</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Bell className="w-10 h-10 mx-auto text-zinc-700 mb-2 stroke-1" />
              <p className="text-sm">ยังไม่มีการแจ้งเตือนใหม่</p>
              <p className="text-xs text-zinc-600 mt-1">การอัปเดตคิวตัดผมจะแสดงที่นี่แบบเรียลไทม์</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer relative overflow-hidden ${
                  n.read
                    ? 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400'
                    : 'bg-zinc-900 border-amber-500/40 text-zinc-100 shadow-md shadow-amber-950/20'
                }`}
              >
                {!n.read && (
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : n.type === 'status_change' ? (
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    ) : n.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 pr-3">
                    <h4 className="text-xs font-semibold text-zinc-200 leading-snug">{n.title}</h4>
                    <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500">
                      <span>{n.timestamp}</span>
                      {n.bookingId && (
                        <span className="text-amber-400 font-medium hover:underline">
                          แตะเพื่อดูคิวนี้ →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 text-center text-[11px] text-zinc-500">
          ระบบเชื่อมต่อ WebSocket / Push Notification แบบเรียลไทม์
        </div>
      </div>
    </div>
  );
};
