import React, { useState, useRef } from 'react';
import {
  Users,
  Scissors,
  CheckCircle,
  Clock,
  DollarSign,
  Percent,
  Play,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  Bell,
  Phone,
  Sparkles,
  QrCode,
  Printer,
  Settings,
  ShieldCheck,
  Ban,
  Power,
  Copy,
  Download,
  X,
  Edit2,
  Footprints,
  Trash2,
  Lock,
} from 'lucide-react';
import { BarberId, Booking, BookingStatus } from '../types';
import { useBooking } from '../context/BookingContext';
import { soundFx } from '../utils/audio';
import { formatBarberDisplayName } from '../data/barbers';
import { EditBarberModal } from './EditBarberModal';
import { WalkInModal } from './WalkInModal';
import { PinLockModal, InlinePinLockScreen } from './PinLockModal';
import html2canvas from 'html2canvas-pro';

export interface BarberDashboardProps {
  isMobileFrame?: boolean;
}

export const BarberDashboard: React.FC<BarberDashboardProps> = ({ isMobileFrame }) => {
  const {
    barbers,
    bookings,
    updateBookingStatus,
    cancelBooking,
    deleteBooking,
    setActiveBookingId,
    setActiveTab,
    toggleBarberActiveStatus,
    updateBarberProfile,
    shopSettings,
    addNotification,
    lockAdmin,
    isAdminUnlocked,
    unlockAdminWithPin,
  } = useBooking();
  const [activeBarberId, setActiveBarberId] = useState<BarberId>('barber-top');
  const [showPayoutSlip, setShowPayoutSlip] = useState(false);
  const [showEditBarberModal, setShowEditBarberModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [slipCopied, setSlipCopied] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [slipToast, setSlipToast] = useState<string | null>(null);
  const payoutSlipRef = useRef<HTMLDivElement>(null);

  const currentBarber = barbers.find((b) => b.id === activeBarberId) || barbers[0];

  const handlePrintSlip = () => {
    soundFx.playClick();
    const printContent = payoutSlipRef.current?.innerHTML;
    if (!printContent) {
      try {
        window.print();
      } catch {
        // Safe in iframe
      }
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>ใบสรุปค่าคอมมิชชั่น - ${currentBarber.name}</title>
              <style>
                @page { size: 80mm auto; margin: 5mm; }
                body {
                  font-family: 'Courier New', Courier, monospace, sans-serif;
                  background: #ffffff;
                  color: #000000;
                  margin: 0;
                  padding: 10px;
                  font-size: 12px;
                  line-height: 1.4;
                }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .flex-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {
            try {
              window.print();
            } catch {
              // Ignore
            }
          }
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 2000);
        }, 500);

        setSlipToast('🖨️ สั่งพิมพ์เอกสารเรียบร้อย');
        setTimeout(() => setSlipToast(null), 3000);
      } else {
        window.print();
      }
    } catch {
      try {
        window.print();
      } catch {
        // Ignore
      }
    }
  };

  const handleDownloadSlipPNG = async () => {
    if (!payoutSlipRef.current) return;
    setIsSavingImage(true);
    soundFx.playClick();

    try {
      const canvas = await html2canvas(payoutSlipRef.current, {
        scale: 2,
        backgroundColor: '#09090b',
        useCORS: true,
      });

      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `Commission-${currentBarber.nickname}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      soundFx.playSuccess();
      setSlipToast('💾 บันทึกรูปสลิป (PNG) สำเร็จแล้ว!');
      setTimeout(() => setSlipToast(null), 3500);
    } catch (err) {
      console.error('Error generating slip image:', err);
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleCopySlip = async () => {
    const text = `📊 ใบสรุปค่าคอมมิชชั่นช่าง BARBERQ HAIR STUDIO
--------------------------------
ชื่อช่าง: ${currentBarber.name} (เก้าอี้ #${currentBarber.chairNumber})
อัตราค่าคอม: ${commRate}%
คิวงานทั้งหมด: ${barberBookings.length} รายการ
ยอดขายรวม: ฿${totalRevenue.toLocaleString()}
ส่วนแบ่งร้านค้า: ฿${totalShopShare.toLocaleString()}
รายได้ค่าคอมสุทธิ: ฿${totalCommissionEarned.toLocaleString()}
วันที่พิมพ์: ${new Date().toLocaleString('th-TH')}
--------------------------------`;
    try {
      await navigator.clipboard.writeText(text);
      soundFx.playSuccess();
      setSlipCopied(true);
      setSlipToast('📋 คัดลอกข้อความสรุปค่าคอมแล้ว');
      setTimeout(() => {
        setSlipCopied(false);
        setSlipToast(null);
      }, 3000);
    } catch {
      // fallback
    }
  };

  // Filter bookings for this barber
  const barberBookings = bookings.filter((b) => b.barberId === activeBarberId);

  // Financial & Commission calculations
  const totalRevenue = barberBookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + b.finalTotalPrice : sum), 0);
  const commRate = currentBarber.commissionRate || 60;
  const totalCommissionEarned = barberBookings.reduce(
    (sum, b) =>
      b.status !== 'CANCELLED'
        ? sum + (b.barberCommissionEarned || Math.round((b.finalTotalPrice * commRate) / 100))
        : sum,
    0
  );
  const totalShopShare = totalRevenue - totalCommissionEarned;
  const totalDeposit50Collected = barberBookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + b.amountPaid : sum), 0);
  const totalRemainingDue = barberBookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + b.amountRemaining : sum), 0);
  const completedCount = barberBookings.filter((b) => b.status === 'COMPLETED').length;
  const inProgressCount = barberBookings.filter((b) => b.status === 'IN_PROGRESS').length;

  const handleBarberSwitch = (id: BarberId) => {
    soundFx.playClick();
    setActiveBarberId(id);
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus, label: string) => {
    soundFx.playClick();
    updateBookingStatus(bookingId, newStatus, label);
  };

  // Fallback protection in case accessed while locked
  if (shopSettings.pinLockEnabled !== false && !isAdminUnlocked) {
    return (
      <InlinePinLockScreen
        targetTitle="แผงควบคุมและข้อมูล 3 ช่าง (Barber Dashboard)"
        currentPin={shopSettings.adminPin || '8888'}
        onSuccess={() => unlockAdminWithPin(shopSettings.adminPin || '8888')}
        onCancel={() => setActiveTab('book')}
      />
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 3 Barbers Switcher Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>แผงควบคุมช่างตัดผม 3 ท่าน (Barber Station Hub)</span>
            </h3>
          </div>
          <div className="flex items-center space-x-1.5">
            {shopSettings.pinLockEnabled !== false && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  lockAdmin();
                }}
                className="text-[11px] px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold border border-rose-800/60 flex items-center space-x-1 transition shadow-sm"
                title="ล็อคหน้าจอซ่อนข้อมูลทันที"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>ล็อคซ่อนข้อมูล</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="text-[11px] px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold border border-amber-500/30 flex items-center space-x-1 transition"
              title="ไปที่การตั้งค่าหลังบ้านเพื่อปรับ % ค่าคอม"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตั้งค่าค่าคอม</span>
            </button>
          </div>
        </div>

        {/* 3 Barber Profile Tabs */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {barbers.map((barber) => {
            const isSelected = activeBarberId === barber.id;
            const isClosed = barber.isActive === false;
            const cutsToday = bookings.filter(
              (b) => b.barberId === barber.id && b.status !== 'CANCELLED'
            ).length;

            return (
              <button
                key={barber.id}
                type="button"
                onClick={() => handleBarberSwitch(barber.id)}
                className={`p-2 sm:p-3 rounded-2xl border transition-all text-center sm:text-left flex flex-col justify-between items-center sm:items-start relative overflow-hidden h-full min-h-[95px] sm:min-h-[90px] ${
                  isSelected
                    ? 'bg-zinc-800/95 border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 text-white'
                    : 'bg-zinc-950/50 hover:bg-zinc-800/50 border-zinc-800 text-zinc-400'
                } ${isClosed ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col sm:flex-row items-center sm:space-x-2.5 w-full">
                  <div className="relative shrink-0 mb-1 sm:mb-0">
                    <img
                      src={barber.avatarUrl}
                      alt={barber.nickname}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border ${
                        isClosed ? 'border-zinc-700 grayscale' : 'border-zinc-700'
                      }`}
                    />
                    <span
                      className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-zinc-900 ${
                        isClosed ? 'bg-rose-500' : 'bg-emerald-400'
                      }`}
                    />
                  </div>
                  <div className="text-center sm:text-left min-w-0 flex-1 w-full">
                    <span className="text-xs font-bold text-zinc-100 block leading-tight truncate">
                      {barber.nickname}
                    </span>
                    <span className="text-[10px] text-amber-400/90 block truncate mt-0.5">
                      {isClosed ? 'ปิดรับ' : `เก้าอี้ #${barber.chairNumber}`}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 pt-1.5 border-t border-zinc-800/60 w-full flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="text-zinc-500 hidden sm:inline">
                    {isClosed ? 'สถานะ' : 'คิววันนี้'}
                  </span>
                  <span
                    className={`font-mono font-bold text-center sm:text-right w-full sm:w-auto ${
                      isClosed ? 'text-rose-400 text-[10px]' : 'text-amber-400'
                    }`}
                  >
                    {isClosed ? '⛔ ปิดคิว' : `${cutsToday} คิว`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Barber Profile & Action Station Card */}
      <div className="rounded-3xl bg-zinc-900/95 border border-zinc-800 p-4 sm:p-5 shadow-xl space-y-4">
        {/* Top Profile Header: Avatar + Full Name + Badges */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="relative shrink-0">
            <img
              src={currentBarber.avatarUrl}
              alt={currentBarber.name}
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 shadow-md transition-all ${
                currentBarber.isActive === false
                  ? 'border-zinc-700 grayscale'
                  : 'border-amber-500/60'
              }`}
            />
            <span
              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                currentBarber.isActive === false ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-base sm:text-lg text-zinc-100 leading-snug break-words">
                {currentBarber.name}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap shrink-0">
                {currentBarber.badge}
              </span>
              {currentBarber.isActive === false && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap shrink-0">
                  ปิดรับคิวชั่วคราว
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 break-words">
              {currentBarber.title}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1.5 flex-wrap">
              <span className="text-amber-400 font-mono font-medium whitespace-nowrap bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
                Station #{currentBarber.chairNumber}
              </span>
              <span className="text-emerald-400 font-mono font-bold bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-500/30 whitespace-nowrap">
                อัตราค่าคอม {commRate}%
              </span>
              <span className="text-zinc-500 hidden sm:inline">•</span>
              <span className="text-zinc-400 hidden sm:inline whitespace-nowrap">
                เวลาทำการ {currentBarber.workingHours} น.
              </span>
            </div>
          </div>
        </div>

        {/* 4 Equal Action Buttons (2x2 on mobile, 4x1 on desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-zinc-800/80">
          {/* Quick Walk-in Button */}
          <button
            type="button"
            onClick={() => setShowWalkInModal(true)}
            className="w-full min-w-0 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 text-purple-200 border border-purple-500/40 transition flex items-center justify-center space-x-1.5 font-bold shadow-sm active:scale-95 cursor-pointer"
            title={`ออกบัตรคิว Walk-in หน้าร้าน (โต๊ะ #${currentBarber.chairNumber})`}
          >
            <Footprints className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="truncate">+ Walk-in</span>
          </button>

          {/* Quick Status Toggle Button */}
          <button
            type="button"
            onClick={() => toggleBarberActiveStatus(currentBarber.id)}
            className={`w-full min-w-0 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl border transition flex items-center justify-center space-x-1.5 font-bold shadow-sm cursor-pointer active:scale-95 ${
              currentBarber.isActive === false
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
            }`}
            title="คลิกเพื่อสลับสถานะเปิด/ปิดรับคิว"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                currentBarber.isActive === false ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span className="truncate">{currentBarber.isActive === false ? 'เปิดรับคิว' : 'ปิดรับคิว'}</span>
          </button>

          {/* Edit Barber Profile Button */}
          <button
            type="button"
            onClick={() => setShowEditBarberModal(true)}
            className="w-full min-w-0 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center justify-center space-x-1.5 font-bold shadow-sm active:scale-95 cursor-pointer"
            title="แก้ไขข้อมูลช่างตัดผม"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">แก้ไขช่าง</span>
          </button>

          {/* Daily Payout Slip Button */}
          <button
            type="button"
            onClick={() => setShowPayoutSlip(true)}
            className="w-full min-w-0 min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
            title="พิมพ์ / คัดลอกใบสรุปค่าคอมช่าง"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">ใบสรุปค่าคอม</span>
          </button>
        </div>

        {/* 4 Financial & Commission Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-zinc-800/80">
          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-emerald-500/30 text-center bg-gradient-to-b from-emerald-950/20 to-zinc-950 flex flex-col justify-between min-h-[80px]">
            <span className="text-[11px] text-emerald-400 font-bold block leading-tight">
              💰 ค่าคอมช่าง ({commRate}%)
            </span>
            <span className="text-lg font-black font-mono text-emerald-400 my-0.5">
              ฿{totalCommissionEarned.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-500/80 block">ส่วนแบ่งช่างตัดผม</span>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between min-h-[80px]">
            <span className="text-[11px] text-zinc-300 font-medium block leading-tight">
              ส่วนแบ่งร้าน ({(100 - commRate)}%)
            </span>
            <span className="text-lg font-black font-mono text-zinc-100 my-0.5">
              ฿{totalShopShare.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 block">เข้าบัญชีร้านค้า</span>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-blue-500/30 text-center bg-gradient-to-b from-blue-950/20 to-zinc-950 flex flex-col justify-between min-h-[80px]">
            <span className="text-[11px] text-blue-400 font-bold block leading-tight">
              มัดจำ 50% รับแล้ว
            </span>
            <span className="text-lg font-black font-mono text-blue-400 my-0.5">
              ฿{totalDeposit50Collected.toLocaleString()}
            </span>
            <span className="text-[10px] text-blue-400/80 block">รับผ่านออนไลน์</span>
          </div>

          <div className="p-3 bg-zinc-950/80 rounded-2xl border border-amber-500/30 text-center bg-gradient-to-b from-amber-950/20 to-zinc-950 flex flex-col justify-between min-h-[80px]">
            <span className="text-[11px] text-amber-400 font-bold block leading-tight">
              รอรับชำระหน้าร้าน
            </span>
            <span className="text-lg font-black font-mono text-amber-400 my-0.5">
              ฿{totalRemainingDue.toLocaleString()}
            </span>
            <span className="text-[10px] text-amber-500/80 block">ยอดคงเหลือ 50%</span>
          </div>
        </div>
      </div>

      {/* Queue List for this barber */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Scissors className="w-3.5 h-3.5 text-amber-400" />
            <span>ตารางคิวงานวันนี้ของ {currentBarber.nickname} ({barberBookings.length} รายการ)</span>
          </h4>
        </div>

        {barberBookings.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-500 text-xs">
            ยังไม่มีคิวที่จองสำหรับช่างท่านนี้ในวันนี้
          </div>
        ) : (
          barberBookings.map((b) => {
            const isDeposit = b.paymentOption === 'deposit_50';
            const bookingComm = b.barberCommissionEarned || Math.round((b.finalTotalPrice * commRate) / 100);
            const bookingShopShare = b.finalTotalPrice - bookingComm;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-3xl border transition-all ${
                  b.status === 'IN_PROGRESS'
                    ? 'bg-zinc-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg'
                    : b.status === 'BARBER_PREPARING'
                    ? 'bg-zinc-900 border-amber-500 shadow-md'
                    : b.status === 'COMPLETED'
                    ? 'bg-zinc-950/60 border-zinc-800/80 opacity-75'
                    : 'bg-zinc-900/70 border-zinc-800'
                }`}
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-black text-sm">
                      {b.queueNumber}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h5 className="font-bold text-sm text-zinc-100">{b.customerName}</h5>
                        {b.isWalkIn && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-flex items-center space-x-0.5">
                            <Footprints className="w-2.5 h-2.5 text-purple-400" />
                            <span>Walk-in</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{b.customerPhone}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-400 block bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-800">
                      {b.bookingTimeSlot} น.
                    </span>
                    <span
                      className={`text-[10px] font-bold mt-1 inline-block ${
                        b.status === 'IN_PROGRESS'
                          ? 'text-emerald-400 animate-pulse'
                          : b.status === 'BARBER_PREPARING'
                          ? 'text-amber-400'
                          : b.status === 'COMPLETED'
                          ? 'text-blue-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {b.status === 'CONFIRMED' && '• รอเริ่มบริการ'}
                      {b.status === 'BARBER_PREPARING' && '• กำลังเตรียมโต๊ะ'}
                      {b.status === 'IN_PROGRESS' && '• กำลังตัดผม'}
                      {b.status === 'COMPLETED' && '✓ เสร็จสิ้น'}
                      {b.status === 'CANCELLED' && '✕ ยกเลิก'}
                    </span>
                  </div>
                </div>

                {/* Service Details & Commission Breakdown */}
                <div className="mt-3 p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800/70 text-xs space-y-2">
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-400">บริการ:</span>
                    <span className="font-semibold text-zinc-100">{b.service.name} (฿{b.finalTotalPrice})</span>
                  </div>

                  {b.customerNotes && (
                    <div className="flex justify-between text-amber-300/90 text-[11px]">
                      <span>ความต้องการ:</span>
                      <span>"{b.customerNotes}"</span>
                    </div>
                  )}

                  {/* Financial & Commission breakdown in queue card */}
                  <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-500/25 flex flex-col justify-between">
                      <span className="text-zinc-400 text-[10px] block">ค่าคอมช่าง ({commRate}%)</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm mt-0.5">
                        ฿{bookingComm.toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800 flex flex-col justify-between">
                      <span className="text-zinc-400 text-[10px] block">ส่วนแบ่งร้าน ({(100 - commRate)}%)</span>
                      <span className="font-mono font-bold text-zinc-300 text-xs sm:text-sm mt-0.5">
                        ฿{bookingShopShare.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment deposit & remaining balance in queue card */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-blue-950/25 p-2.5 rounded-xl border border-blue-500/25 flex flex-col justify-between">
                      <span className="text-blue-300/80 text-[10px] block">
                        {b.paymentOption === 'no_deposit'
                          ? 'ชำระออนไลน์'
                          : b.paymentOption === 'deposit_50'
                          ? 'ยอดมัดจำ 50% รับแล้ว'
                          : 'จ่ายเต็ม 100%'}
                      </span>
                      <span className="font-mono font-bold text-blue-400 text-xs sm:text-sm mt-0.5">
                        {b.amountPaid === 0 ? '฿0 (ไม่มีมัดจำ)' : `฿${b.amountPaid.toLocaleString()}`}
                      </span>
                    </div>

                    <div className="bg-amber-950/25 p-2.5 rounded-xl border border-amber-500/25 flex flex-col justify-between">
                      <span className="text-amber-300/80 text-[10px] block">รอเก็บหน้าร้าน</span>
                      <span className="font-mono font-bold text-amber-400 text-xs sm:text-sm mt-0.5">
                        ฿{b.amountRemaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barber Action Push Controller & Delete Action */}
                <div className="mt-3 flex items-center gap-1.5 sm:gap-2">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          b.id,
                          'BARBER_PREPARING',
                          `${formatBarberDisplayName(currentBarber.nickname)} กำลังเตรียมเก้าอี้และอุปกรณ์`
                        )
                      }
                      className={`py-2 px-1 sm:px-2 text-[11px] sm:text-xs rounded-xl border transition flex items-center justify-center space-x-1 cursor-pointer active:scale-95 whitespace-nowrap ${
                        b.status === 'BARBER_PREPARING'
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                          : 'bg-amber-950/30 hover:bg-amber-900/50 text-amber-300 border-amber-800/40'
                      }`}
                      title="เปลี่ยนสถานะเป็น: กำลังเตรียมเก้าอี้และอุปกรณ์"
                    >
                      <span>🪑 เตรียมโต๊ะ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          b.id,
                          'IN_PROGRESS',
                          `${formatBarberDisplayName(currentBarber.nickname)} เริ่มตัดผมให้คุณ ${b.customerName}`
                        )
                      }
                      className={`py-2 px-1 sm:px-2 text-[11px] sm:text-xs rounded-xl border transition flex items-center justify-center space-x-1 cursor-pointer active:scale-95 whitespace-nowrap ${
                        b.status === 'IN_PROGRESS'
                          ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20 animate-pulse'
                          : 'bg-emerald-950/30 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/40'
                      }`}
                      title="เปลี่ยนสถานะเป็น: กำลังตัดผม"
                    >
                      <span>✂️ เริ่มตัด</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(
                          b.id,
                          'COMPLETED',
                          `บริการเสร็จสิ้น เก็บยอดคงเหลือ ฿${b.amountRemaining}`
                        )
                      }
                      className={`py-2 px-1 sm:px-2 text-[11px] sm:text-xs rounded-xl border transition flex items-center justify-center space-x-1 cursor-pointer active:scale-95 whitespace-nowrap ${
                        b.status === 'COMPLETED'
                          ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-md shadow-blue-500/20'
                          : 'bg-blue-950/30 hover:bg-blue-900/50 text-blue-300 border-blue-800/40'
                      }`}
                      title="เปลี่ยนสถานะเป็น: บริการเสร็จสิ้น"
                    >
                      <span>✨ เสร็จสิ้น</span>
                    </button>
                  </div>

                  {/* Cancel Queue Action */}
                  {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        cancelBooking(b.id);
                      }}
                      title="ยกเลิกคิวนี้"
                      className="p-2 sm:px-2.5 sm:py-2 text-[11px] sm:text-xs rounded-xl bg-zinc-900 hover:bg-rose-950/50 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 transition flex items-center justify-center space-x-1 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="hidden sm:inline font-medium">ยกเลิกคิว</span>
                    </button>
                  )}

                  {/* Delete / Remove Queue Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setBookingToDelete(b);
                    }}
                    title="ลบคิวนี้ออกจากระบบ (ต้องใส่รหัส PIN ร้าน)"
                    className="p-2 sm:px-3 sm:py-2 text-[11px] sm:text-xs rounded-xl bg-zinc-900 hover:bg-rose-950/50 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 transition flex items-center justify-center space-x-1 shrink-0 cursor-pointer active:scale-95 whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="hidden sm:inline font-medium">ลบออก</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payout Slip Modal */}
      {showPayoutSlip && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowPayoutSlip(false);
            }
          }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="cursor-default bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn relative"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h4 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>ใบสรุปค่าคอมมิชชั่นช่าง (Daily Commission Slip)</span>
              </h4>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPayoutSlip(false);
                }}
                className="w-9 h-9 text-zinc-400 hover:text-white rounded-full bg-zinc-800/80 hover:bg-zinc-700 active:scale-90 flex items-center justify-center transition cursor-pointer z-10"
                title="ปิด"
                aria-label="ปิด"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Slip Toast Feedback */}
            {slipToast && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{slipToast}</span>
              </div>
            )}

            {/* Slip Content for Print and Image Export */}
            <div
              ref={payoutSlipRef}
              className="bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 font-mono text-xs space-y-3 select-text shadow-inner"
            >
              <div className="text-center pb-2.5 border-b border-dashed border-zinc-700">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <h5 className="font-bold text-sm text-zinc-100 tracking-tight">BARBERQ HAIR STUDIO</h5>
                </div>
                <p className="text-[10px] text-zinc-400 font-sans">ใบสรุปส่วนแบ่งค่าบริการและค่าคอมมิชชั่นช่าง</p>
                <p className="text-[9px] text-zinc-500 font-sans">วันที่: {new Date().toLocaleDateString('th-TH')} • เวลา {new Date().toLocaleTimeString('th-TH')}</p>
              </div>

              <div className="space-y-1.5 text-zinc-300 font-sans">
                <div className="flex justify-between">
                  <span>ชื่อช่างตัดผม:</span>
                  <span className="font-bold text-zinc-100">{currentBarber.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>สถานีเก้าอี้:</span>
                  <span>Station #{currentBarber.chairNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>อัตราค่าคอมมิชชั่น:</span>
                  <span className="font-mono font-bold text-emerald-400">{commRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>จำนวนคิวงานทั้งหมด:</span>
                  <span className="font-mono font-bold text-amber-400">{barberBookings.length} รายการ</span>
                </div>
              </div>

              <div className="py-2.5 border-t border-b border-dashed border-zinc-700 space-y-1.5 text-zinc-300 font-sans">
                <div className="flex justify-between">
                  <span>ยอดขายรวมทั้งหมด:</span>
                  <span className="font-mono font-bold text-zinc-100">฿{totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>ส่วนแบ่งร้านค้า ({(100 - commRate)}%):</span>
                  <span className="font-mono text-zinc-400">-฿{totalShopShare.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1.5 border-t border-zinc-800 font-sans">
                  <span>รายได้ค่าคอมสุทธิ:</span>
                  <span className="font-mono font-black text-base">฿{totalCommissionEarned.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-center pt-1 font-sans text-[10px] text-zinc-500">
                ระบบจัดการร้านตัดผม BarberQ • เอกสารออกอัตโนมัติ
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-sans">
              <button
                type="button"
                onClick={handlePrintSlip}
                className="py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์เอกสาร</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadSlipPNG}
                disabled={isSavingImage}
                className="py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1 border border-zinc-700 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>{isSavingImage ? 'กำลังเซฟ...' : 'เซฟรูป PNG'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopySlip}
                className="py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1 border border-zinc-700"
              >
                {slipCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{slipCopied ? 'คัดลอกแล้ว' : 'ก็อปปี้สลิป'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowPayoutSlip(false)}
                className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs rounded-xl transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Barber Profile Modal */}
      <EditBarberModal
        barber={currentBarber}
        isOpen={showEditBarberModal}
        onClose={() => setShowEditBarberModal(false)}
        onSave={(barberId, updates) => {
          updateBarberProfile(barberId, updates);
          setSlipToast(`บันทึกข้อมูล ${updates.nickname || 'ช่าง'} เรียบร้อยแล้ว ✨`);
          setTimeout(() => setSlipToast(null), 3000);
        }}
      />

      {/* Walk-in Ticket Modal for Current Barber */}
      {showWalkInModal && (
        <WalkInModal
          defaultBarberId={currentBarber.id}
          isOpen={showWalkInModal}
          onClose={() => setShowWalkInModal(false)}
        />
      )}

      {/* PIN Lock Confirmation Modal for Deleting Queue */}
      {bookingToDelete && (
        <PinLockModal
          isOpen={true}
          actionType="danger"
          title="ใส่รหัส PIN เพื่อลบคิว"
          description={
            <span className="block text-center leading-relaxed">
              กรุณากรอกรหัส PIN ร้าน 4 หลัก เพื่อยืนยันการลบคิวลูกค้า{' '}
              <strong className="text-amber-400 font-bold">{bookingToDelete.customerName}</strong>{' '}
              {bookingToDelete.queueNumber && (
                <span className="text-zinc-300 font-mono font-bold">({bookingToDelete.queueNumber})</span>
              )}{' '}
              ออกจากระบบ
            </span>
          }
          currentPin={shopSettings?.adminPin || '8888'}
          cancelText="ยกเลิก / ไม่ลบคิวนี้"
          onClose={() => setBookingToDelete(null)}
          onSuccess={() => {
            const customer = bookingToDelete.customerName;
            deleteBooking(bookingToDelete.id);
            setBookingToDelete(null);
            addNotification(
              '🗑️ ลบคิวสำเร็จ',
              `ลบคิวของคุณ ${customer} ออกจากระบบเรียบร้อยแล้ว`,
              'info'
            );
          }}
        />
      )}
    </div>
  );
};

