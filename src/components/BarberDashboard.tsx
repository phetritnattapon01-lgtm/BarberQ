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
} from 'lucide-react';
import { BarberId, Booking, BookingStatus } from '../types';
import { useBooking } from '../context/BookingContext';
import { soundFx } from '../utils/audio';
import { EditBarberModal } from './EditBarberModal';
import { WalkInModal } from './WalkInModal';
import html2canvas from 'html2canvas';

export const BarberDashboard: React.FC = () => {
  const {
    barbers,
    bookings,
    updateBookingStatus,
    setActiveBookingId,
    setActiveTab,
    toggleBarberActiveStatus,
    updateBarberProfile,
  } = useBooking();
  const [activeBarberId, setActiveBarberId] = useState<BarberId>('barber-top');
  const [showPayoutSlip, setShowPayoutSlip] = useState(false);
  const [showEditBarberModal, setShowEditBarberModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [slipCopied, setSlipCopied] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [slipToast, setSlipToast] = useState<string | null>(null);
  const payoutSlipRef = useRef<HTMLDivElement>(null);

  const currentBarber = barbers.find((b) => b.id === activeBarberId) || barbers[0];

  const handlePrintSlip = () => {
    soundFx.playClick();
    const printContent = payoutSlipRef.current?.innerHTML;
    if (!printContent) {
      window.print();
      return;
    }

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
            <script>
              window.onload = function() {
                window.focus();
                window.print();
                setTimeout(function() {
                  window.frameElement.parentNode.removeChild(window.frameElement);
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
      setSlipToast('🖨️ สั่งพิมพ์เอกสารเรียบร้อย');
      setTimeout(() => setSlipToast(null), 3000);
    } else {
      window.print();
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
            <p className="text-xs text-zinc-400">
              ดูคิวงาน ยอดค่าคอมมิชชั่น ({commRate}%) ยอดมัดจำ 50% และอัปเดตสถานะ
            </p>
          </div>
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

      {/* Selected Barber Header Banner with Commission Badge & Active/Closed Switch */}
      <div className="rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={currentBarber.avatarUrl}
                alt={currentBarber.name}
                className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md ${
                  currentBarber.isActive === false
                    ? 'border-zinc-700 grayscale'
                    : 'border-amber-500/60'
                }`}
              />
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                  currentBarber.isActive === false ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-base text-zinc-100">{currentBarber.name}</h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {currentBarber.badge}
                </span>
                {currentBarber.isActive === false && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    ปิดรับคิวชั่วคราว
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">{currentBarber.title}</p>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-0.5">
                <span>Station #{currentBarber.chairNumber}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  อัตราค่าคอม: {commRate}%
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Quick Walk-in Button for this Station */}
            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="text-xs px-2.5 py-2 sm:py-1.5 rounded-xl bg-purple-600/25 hover:bg-purple-600/35 text-purple-200 border border-purple-500/40 transition flex items-center justify-center space-x-1.5 font-bold shadow active:scale-95 cursor-pointer"
              title={`ออกบัตรคิว Walk-in ให้ลูกค้าหน้าร้าน (โต๊ะ #${currentBarber.chairNumber})`}
            >
              <Footprints className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">+ Walk-in</span>
            </button>

            {/* Quick Status Toggle Button */}
            <button
              type="button"
              onClick={() => toggleBarberActiveStatus(currentBarber.id)}
              className={`text-xs px-2.5 py-2 sm:py-1.5 rounded-xl border transition flex items-center justify-center space-x-1.5 font-bold shadow ${
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
              <span className="truncate">{currentBarber.isActive === false ? 'ปิดคิว' : 'เปิดคิว'}</span>
            </button>

            {/* Edit Barber Profile Button */}
            <button
              type="button"
              onClick={() => setShowEditBarberModal(true)}
              className="text-xs px-2.5 py-2 sm:py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center justify-center space-x-1 font-bold shadow active:scale-95"
              title="แก้ไขข้อมูลช่างตัดผม (ชื่อ, รูป, ตำแหน่ง, เก้าอี้, เวลา, ค่าคอม)"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>แก้ไขช่าง</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPayoutSlip(true)}
              className="text-xs px-2.5 py-2 sm:py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition flex items-center justify-center space-x-1 shadow"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">ใบสรุปค่าคอม</span>
            </button>
          </div>
        </div>

        {/* 4 Financial & Commission Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-zinc-800">
          <div className="p-2.5 sm:p-3 bg-zinc-950/80 rounded-2xl border border-emerald-500/30 text-center bg-gradient-to-b from-emerald-950/20 to-zinc-950 flex flex-col justify-between min-h-[74px]">
            <span className="text-[10px] text-emerald-400 font-bold block leading-tight">
              💰 ค่าคอมช่าง ({commRate}%)
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1">
              ฿{totalCommissionEarned.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between min-h-[74px]">
            <span className="text-[10px] text-zinc-400 block leading-tight">ส่วนแบ่งร้าน ({(100 - commRate)}%)</span>
            <span className="text-base sm:text-lg font-bold font-mono text-zinc-300 mt-1">
              ฿{totalShopShare.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between min-h-[74px]">
            <span className="text-[10px] text-zinc-400 block leading-tight">มัดจำ 50% รับแล้ว</span>
            <span className="text-base sm:text-lg font-bold font-mono text-blue-400 mt-1">
              ฿{totalDeposit50Collected.toLocaleString()}
            </span>
          </div>

          <div className="p-2.5 sm:p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-center flex flex-col justify-between min-h-[74px]">
            <span className="text-[10px] text-zinc-400 block leading-tight">รอรับชำระหน้าร้าน</span>
            <span className="text-base sm:text-lg font-bold font-mono text-amber-400 mt-1">
              ฿{totalRemainingDue.toLocaleString()}
            </span>
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

                  {/* Commission & Deposit split info */}
                  <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-emerald-950/30 p-2 rounded-xl border border-emerald-500/20">
                      <span className="text-zinc-400 block text-[10px]">ค่าคอมช่าง ({commRate}%):</span>
                      <span className="font-mono font-bold text-emerald-400">฿{bookingComm.toLocaleString()}</span>
                    </div>

                    <div className="bg-zinc-900 p-2 rounded-xl border border-zinc-800">
                      <span className="text-zinc-400 block text-[10px]">ส่วนแบ่งร้าน ({(100 - commRate)}%):</span>
                      <span className="font-mono font-bold text-zinc-300">฿{bookingShopShare.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[11px] text-zinc-400">
                    <span>
                      {b.paymentOption === 'no_deposit'
                        ? 'ชำระออนไลน์:'
                        : b.paymentOption === 'deposit_50'
                        ? 'มัดจำ 50% แล้ว:'
                        : 'จ่ายเต็ม 100%:'}{' '}
                      <strong className="text-emerald-400 font-mono">
                        {b.amountPaid === 0 ? '฿0 (ไม่มีมัดจำ)' : `฿${b.amountPaid}`}
                      </strong>
                    </span>
                    <span>
                      เก็บหน้าร้าน:{' '}
                      <strong className="text-amber-400 font-mono">฿{b.amountRemaining}</strong>
                    </span>
                  </div>
                </div>

                {/* Barber Action Push Controller */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        b.id,
                        'BARBER_PREPARING',
                        `ช่าง${currentBarber.nickname} กำลังเตรียมเก้าอี้และอุปกรณ์`
                      )
                    }
                    className="py-2 bg-amber-900/30 hover:bg-amber-900/60 text-amber-300 text-xs font-semibold rounded-xl border border-amber-700/50 transition flex items-center justify-center space-x-1"
                  >
                    <span>🪑 เตรียมโต๊ะ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(
                        b.id,
                        'IN_PROGRESS',
                        `ช่าง${currentBarber.nickname} เริ่มตัดผมให้คุณ ${b.customerName}`
                      )
                    }
                    className="py-2 bg-emerald-900/30 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-700/50 transition flex items-center justify-center space-x-1"
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
                    className="py-2 bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 text-xs font-semibold rounded-xl border border-blue-700/50 transition flex items-center justify-center space-x-1"
                  >
                    <span>✨ เสร็จสิ้น</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payout Slip Modal */}
      {showPayoutSlip && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn relative">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
              <h4 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
                <Percent className="w-4 h-4 text-amber-400" />
                <span>ใบสรุปค่าคอมมิชชั่นช่าง (Daily Commission Slip)</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPayoutSlip(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition"
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
      <WalkInModal
        defaultBarberId={currentBarber.id}
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
      />
    </div>
  );
};

