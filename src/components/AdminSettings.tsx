import React, { useState, useEffect } from 'react';
import {
  Settings,
  Percent,
  DollarSign,
  Users,
  Scissors,
  Store,
  Save,
  RotateCcw,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Clock,
  ShieldCheck,
  QrCode,
  Printer,
  Sparkles,
  Award,
  Power,
  Ban,
  UserCheck,
  UserX,
  Lock,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  X,
  Bell,
  Volume2,
  Database,
  Cloud,
} from 'lucide-react';
import { useBooking, DEFAULT_SHOP_SETTINGS } from '../context/BookingContext';
import { BarberId, Barber, Service, ServiceCategory, ShopSettings } from '../types';
import { soundFx } from '../utils/audio';
import { EditBarberModal } from './EditBarberModal';

export const AdminSettings: React.FC = () => {
  const {
    barbers,
    services,
    shopSettings,
    bookings,
    setActiveTab,
    updateBarberCommissionRate,
    updateBarberProfile,
    toggleBarberActiveStatus,
    updateService,
    addService,
    deleteService,
    updateShopSettings,
    resetAllSettings,
    lockAdmin,
    updateAdminPin,
    togglePinLock,
    triggerAdvanceQueueAlert,
    firebaseStatus,
    firebaseProjectId,
    loyaltyRecords,
    transactions,
  } = useBooking();

  const [activeSubTab, setActiveSubTab] = useState<'commission' | 'barbers' | 'services' | 'shop' | 'summary'>('commission');

  // Local state for editing shop settings
  const [localSettings, setLocalSettings] = useState<ShopSettings>(shopSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPinCode, setShowPinCode] = useState(true);
  const [pinInput, setPinInput] = useState<string>(shopSettings.adminPin || '8888');
  const [pinSaveMsg, setPinSaveMsg] = useState<string | null>(null);
  const [pinErrorMsg, setPinErrorMsg] = useState<string | null>(null);

  // Sync state when shopSettings updates
  useEffect(() => {
    setLocalSettings(shopSettings);
    setPinInput(shopSettings.adminPin || '8888');
  }, [shopSettings]);

  // New service modal/state
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<ServiceCategory>('haircut');
  const [newServicePrice, setNewServicePrice] = useState<number>(450);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(45);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Delete & Reset Confirm Modals
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [serviceActionToast, setServiceActionToast] = useState<string | null>(null);

  // Editing service & barber state
  const [barberToEdit, setBarberToEdit] = useState<Barber | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);

  // Commission payout calculator & summary
  const totalRevenue = bookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + b.finalTotalPrice : sum), 0);
  const totalCommissionPaid = bookings.reduce(
    (sum, b) => (b.status !== 'CANCELLED' ? sum + (b.barberCommissionEarned || Math.round((b.finalTotalPrice * (b.barber.commissionRate || 60)) / 100)) : sum),
    0
  );
  const totalShopShare = totalRevenue - totalCommissionPaid;
  const totalDepositCollected = bookings.reduce((sum, b) => (b.status !== 'CANCELLED' ? sum + b.amountPaid : sum), 0);

  const handleSaveShopSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCommissionSliderChange = (barberId: BarberId, newRate: number) => {
    updateBarberCommissionRate(barberId, newRate);
  };

  const handleAddNewService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    addService({
      name: newServiceName.trim(),
      category: newServiceCategory,
      price: Number(newServicePrice) || 300,
      durationMinutes: Number(newServiceDuration) || 30,
      description: newServiceDesc.trim() || 'บริการดูแลเส้นผมและจัดแต่งทรงผมพรีเมียม',
      isActive: true,
    });

    setNewServiceName('');
    setNewServiceDesc('');
    setShowAddServiceModal(false);
  };

  const handleSaveEditService = (serviceId: string) => {
    updateService(serviceId, {
      price: Number(editPrice),
      durationMinutes: Number(editDuration),
    });
    setEditingServiceId(null);
  };

  return (
    <div className="space-y-5 pb-24 animate-fadeIn">
      {/* Back-office Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Top Header: Title + Admin Badge + Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 whitespace-nowrap">
                  ระบบตั้งค่าหลังบ้าน (Back-Office)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30 font-mono tracking-wider shrink-0">
                  ADMIN
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                จัดการค่าคอมมิชชั่นช่าง (%), รายการบริการ, ข้อมูลช่าง 3 ท่าน และสัดส่วนเงินมัดจำ
              </p>
            </div>
          </div>

          {/* Action Buttons: 2 Equal-width balanced buttons */}
          <div className="grid grid-cols-2 gap-2 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                lockAdmin();
                setActiveTab('book');
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
              title="ล็อคระบบทันทีเพื่อความปลอดภัย"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>ล็อคระบบ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setShowResetConfirmModal(true);
              }}
              className="min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
              title="คืนค่าการตั้งค่าเริ่มต้น"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>คืนค่าเริ่มต้น</span>
            </button>
          </div>
        </div>

        {/* Firebase Cloud Firestore Live Status Card */}
        <div id="firebase-cloud-status-card" className="p-3 bg-zinc-950/80 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Database className="w-4 h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs font-bold text-zinc-100">Firebase Firestore</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1.5 ${
                  firebaseStatus === 'connected'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${firebaseStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>{firebaseStatus === 'connected' ? 'เชื่อมต่อฐานข้อมูลคลาวด์เรียลไทม์แล้ว' : 'กำลังเชื่อมต่อคลาวด์...'}</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                โปรเจกต์: <span className="font-mono text-amber-300/90 font-medium">{firebaseProjectId}</span> • ซิงค์คิวจอง ({bookings.length}), แต้มสะสม ({Object.keys(loyaltyRecords).length}), รายการบัญชี ({transactions.length})
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-zinc-400 shrink-0 self-start sm:self-center">
            <Cloud className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span className="font-mono text-[10px] bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800 text-zinc-300">firebase.google.com</span>
          </div>
        </div>

        {/* Sub-navigation Tabs (2 cols on mobile/tablet, 4 cols on desktop - clean, no overlap) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('commission')}
            className={`w-full min-w-0 min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95 ${
              activeSubTab === 'commission'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-950/70 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Percent className="w-4 h-4 shrink-0" />
            <span className="truncate">ค่าคอมมิชชั่น</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('barbers')}
            className={`w-full min-w-0 min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95 ${
              activeSubTab === 'barbers'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-950/70 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">ข้อมูลช่าง 3 ท่าน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('services')}
            className={`w-full min-w-0 min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95 ${
              activeSubTab === 'services'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-950/70 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Scissors className="w-4 h-4 shrink-0" />
            <span className="truncate">บริการ & ราคา</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('shop')}
            className={`w-full min-w-0 min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95 ${
              activeSubTab === 'shop'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                : 'bg-zinc-950/70 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span className="truncate">ร้านค้า & มัดจำ</span>
          </button>
        </div>

        {/* Quick Shortcut to Accounting Ledger */}
        <div className="mt-3 p-3 sm:p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-amber-300 leading-snug">
                ดูรายงานรายรับ-รายจ่าย ละเอียด
              </div>
              <div className="text-[11px] text-amber-400/80 mt-0.5">
                สรุปยอดขาย รายวัน / รายสัปดาห์ / รายเดือน แบบแยกหมวดหมู่
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('accounting')}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition shrink-0 flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap active:scale-95"
          >
            <span>เปิดสมุดบัญชี</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BARBER COMMISSION MANAGEMENT (ค่าคอมมิชชั่น % ช่าง) */}
      {activeSubTab === 'commission' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Revenue & Commission Analytics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between min-h-[96px]">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">ยอดขายรวมทั้งหมด</span>
                <span className="text-lg font-extrabold font-mono text-zinc-100">
                  ฿{totalRevenue.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 block mt-1">จากคิวสำเร็จและกำลังตัด</span>
            </div>

            <div className="p-3.5 bg-zinc-900 border border-emerald-500/30 rounded-2xl bg-gradient-to-b from-emerald-950/20 to-zinc-900 flex flex-col justify-between min-h-[96px]">
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold block mb-1">
                  ยอดจ่ายค่าคอมช่างรวม
                </span>
                <span className="text-lg font-extrabold font-mono text-emerald-400">
                  ฿{totalCommissionPaid.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">
                เฉลี่ย {(totalRevenue > 0 ? (totalCommissionPaid / totalRevenue) * 100 : 60).toFixed(0)}% ของยอดขาย
              </span>
            </div>

            <div className="p-3.5 bg-zinc-900 border border-amber-500/30 rounded-2xl bg-gradient-to-b from-amber-950/20 to-zinc-900 flex flex-col justify-between min-h-[96px]">
              <div>
                <span className="text-[11px] text-amber-400 font-semibold block mb-1">
                  ส่วนแบ่งกำไรร้านค้า
                </span>
                <span className="text-lg font-extrabold font-mono text-amber-400">
                  ฿{totalShopShare.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">
                เข้าบัญชีร้านหลังหักคอม
              </span>
            </div>

            <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between min-h-[96px]">
              <div>
                <span className="text-[11px] text-zinc-400 block mb-1">เงินมัดจำ 50% สะสม</span>
                <span className="text-lg font-extrabold font-mono text-blue-400">
                  ฿{totalDepositCollected.toLocaleString()}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 block mt-1">ได้รับผ่าน PromptPay/Card</span>
            </div>
          </div>

          {/* 3 Barbers Individual Commission Rates Settings */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                  <Percent className="w-4 h-4 text-amber-400" />
                  <span>ตั้งค่าอัตราค่าคอมมิชชั่นรายบุคคล (3 ช่างประจำสถานี)</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  ปรับสัดส่วนเปอร์เซ็นต์ส่วนแบ่งรายได้ให้กับช่างแต่ละท่านแบบเรียลไทม์
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {barbers.map((barber) => {
                const barberBookings = bookings.filter(
                  (b) => b.barberId === barber.id && b.status !== 'CANCELLED'
                );
                const barberRevenue = barberBookings.reduce((s, b) => s + b.finalTotalPrice, 0);
                const barberCommEarned = Math.round((barberRevenue * (barber.commissionRate || 60)) / 100);
                const shopPortion = barberRevenue - barberCommEarned;

                return (
                  <div
                    key={barber.id}
                    className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/90 space-y-3.5 relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Barber Info */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={barber.avatarUrl}
                        alt={barber.nickname}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-500/40 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-sm text-zinc-100 truncate">{barber.name}</h5>
                          <span className="text-[10px] text-amber-400 font-mono shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            โต๊ะ #{barber.chairNumber}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{barber.title}</p>
                      </div>
                    </div>

                    {/* Commission % Slider Controller */}
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2.5">
                      <div className="flex justify-between items-center flex-wrap gap-1">
                        <span className="text-xs font-semibold text-zinc-300">อัตราค่าคอมช่าง:</span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-base font-extrabold font-mono text-emerald-400">
                            {barber.commissionRate || 60}%
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">
                            (ร้าน {100 - (barber.commissionRate || 60)}%)
                          </span>
                        </div>
                      </div>

                      {/* Slider Input */}
                      <div className="space-y-1.5">
                        <input
                          type="range"
                          min="30"
                          max="90"
                          step="5"
                          value={barber.commissionRate || 60}
                          onChange={(e) => handleCommissionSliderChange(barber.id, Number(e.target.value))}
                          className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-400 font-mono px-0.5">
                          <span>30%</span>
                          <span>50%</span>
                          <span className="text-amber-400 font-bold">60%</span>
                          <span>70%</span>
                          <span>90%</span>
                        </div>
                      </div>

                      {/* Quick Presets: 5 equal buttons */}
                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {[50, 55, 60, 65, 70].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => handleCommissionSliderChange(barber.id, rate)}
                            className={`py-1.5 rounded-lg text-xs font-mono font-bold transition border text-center cursor-pointer active:scale-95 ${
                              barber.commissionRate === rate
                                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Financial Breakdown for this barber */}
                    <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800/80 text-xs space-y-1.5">
                      <div className="flex justify-between text-zinc-400 text-[11px]">
                        <span>ยอดผลงานรวม ({barberBookings.length} คิว):</span>
                        <span className="font-mono text-zinc-200">฿{barberRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 text-[11px] font-bold">
                        <span>ค่าคอมที่ช่างได้รับ:</span>
                        <span className="font-mono">฿{barberCommEarned.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-400/90 text-[11px]">
                        <span>ส่วนแบ่งร้าน:</span>
                        <span className="font-mono">฿{shopPortion.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Commission Calculation Rules & Payout Policy */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
            <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>กติกาการคำนวณค่าคอมมิชชั่นและการจ่ายเงิน (Commission Rules)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-200 block">1. ฐานการคำนวณ</span>
                <p className="text-zinc-400 text-[11px]">
                  คำนวณจากยอดสุทธิ (Net Revenue) หลังหักคูปองส่วนลดโปรโมชั่นร้าน
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-200 block">2. การเคลียร์ยอดมัดจำ 50%</span>
                <p className="text-zinc-400 text-[11px]">
                  ยอดมัดจำเข้าบัญชีร้านทันที และระบบจะคำนวณส่วนต่างจ่ายให้ช่างตอนปิดรอบคิวงาน
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1">
                <span className="font-bold text-zinc-200 block">3. ทิปลูกค้า</span>
                <p className="text-zinc-400 text-[11px]">
                  ทิปที่ลูกค้ามอบให้ ช่างจะได้รับ 100% เต็มจำนวนโดยไม่หักค่าธรรมเนียม
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BARBERS PROFILE & STATION MANAGEMENT */}
      {activeSubTab === 'barbers' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>จัดการข้อมูลช่างตัดผม 3 ท่าน (3 Master Barbers)</span>
              </h4>
              <p className="text-xs text-zinc-400">
                แก้ไขเก้าอี้ประจำสถานี เวลาปฏิบัติงาน และสถานะพร้อมให้บริการ
              </p>
            </div>

            <div className="space-y-3">
              {barbers.map((barber) => {
                const isClosed = barber.isActive === false;

                return (
                  <div
                    key={barber.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isClosed
                        ? 'bg-zinc-950/60 border-zinc-800/80 opacity-80'
                        : 'bg-zinc-950 rounded-2xl border-zinc-800 shadow-sm'
                    }`}
                  >
                    {/* Barber Details */}
                    <div className="flex items-start sm:items-center space-x-3.5 sm:space-x-4 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={barber.avatarUrl}
                          alt={barber.name}
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 transition shrink-0 ${
                            isClosed
                              ? 'border-zinc-700 grayscale contrast-75'
                              : 'border-amber-500/50'
                          }`}
                        />
                        {isClosed && (
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <Ban className="w-5 h-5 text-rose-400" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm sm:text-base text-zinc-100">{barber.name}</h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap shrink-0">
                            {barber.badge}
                          </span>
                          {isClosed && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 whitespace-nowrap shrink-0">
                              งดรับคิว
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400">{barber.title}</p>

                        {/* Metadata Pills (Clean badges, no wrapping dots) */}
                        <div className="flex items-center gap-1.5 text-[11px] pt-1 flex-wrap">
                          <span className="bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 text-amber-400 font-mono font-medium whitespace-nowrap">
                            โต๊ะ #{barber.chairNumber}
                          </span>
                          <span className="bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800 text-zinc-300 whitespace-nowrap">
                            เวลา {barber.workingHours} น.
                          </span>
                          <span className="bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 text-emerald-400 font-mono font-bold whitespace-nowrap">
                            ค่าคอมมิชชั่น {barber.commissionRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: On mobile/tablet 2 equal buttons (50% / 50%), on desktop equal flex items */}
                    <div className="grid grid-cols-2 lg:flex lg:items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-800/80 shrink-0">
                      {/* Edit Barber Profile Button */}
                      <button
                        type="button"
                        onClick={() => setBarberToEdit(barber)}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                        title="คลิกเพื่อแก้ไขข้อมูลช่างทั้งหมด (ชื่อ, รูป, ตำแหน่ง, เก้าอี้, เวลา, ค่าคอม)"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>แก้ไขข้อมูล</span>
                      </button>

                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleBarberActiveStatus(barber.id)}
                        className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm border cursor-pointer active:scale-95 whitespace-nowrap ${
                          isClosed
                            ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                        }`}
                        title={isClosed ? 'คลิกเพื่อเปิดรับคิว' : 'คลิกเพื่อปิดรับคิวชั่วคราว'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isClosed ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'
                          }`}
                        />
                        <span>{isClosed ? 'เปิดรับคิว' : 'ปิดรับคิว'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICE CATALOG MANAGEMENT */}
      {activeSubTab === 'services' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  <span>จัดการรายการบริการและราคา (Services & Pricing Catalog)</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  เพิ่ม แก้ไขราคา หรือปรับระยะเวลาบริการตัดผม/ดูแลทรงผม
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddServiceModal(true)}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มบริการใหม่</span>
              </button>
            </div>

            {/* Services List Table */}
            <div className="space-y-2.5">
              {services.map((service) => {
                const isEditing = editingServiceId === service.id;

                return (
                  <div
                    key={service.id}
                    className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-zinc-100">{service.name}</span>
                        {service.popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                            ยอดนิยม
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase font-mono">
                          {service.category}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{service.description}</p>
                    </div>

                    {isEditing ? (
                      <div className="flex items-center space-x-2 bg-zinc-900 p-2 rounded-xl border border-zinc-700">
                        <div>
                          <label className="text-[10px] text-zinc-500 block">ราคา (฿)</label>
                          <input
                            type="number"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-amber-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 block">นาที</label>
                          <input
                            type="number"
                            value={editDuration}
                            onChange={(e) => setEditDuration(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-200"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSaveEditService(service.id)}
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition"
                        >
                          บันทึก
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingServiceId(null)}
                          className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs rounded-lg transition"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 justify-between sm:justify-end">
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-amber-400 block">
                            ฿{service.price.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-zinc-500 flex items-center space-x-1">
                            <Clock className="w-3 h-3 inline" />
                            <span>{service.durationMinutes} นาที</span>
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingServiceId(service.id);
                              setEditPrice(service.price);
                              setEditDuration(service.durationMinutes);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
                            title="แก้ไขราคา/เวลา"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              soundFx.playClick();
                              setServiceToDelete(service);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/70 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/40 transition"
                            title="ลบบริการนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add New Service Modal */}
          {showAddServiceModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 w-full max-w-md space-y-4 shadow-2xl animate-scaleIn">
                <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                  <h4 className="font-bold text-base text-zinc-100 flex items-center space-x-2">
                    <Scissors className="w-4 h-4 text-amber-400" />
                    <span>เพิ่มรายการบริการใหม่</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddServiceModal(false)}
                    className="text-zinc-500 hover:text-zinc-200 text-sm"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddNewService} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">ชื่อบริการ</label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น Classic Two-Tone Color, สปาดีท็อกซ์หนังศีรษะ"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">หมวดหมู่</label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => setNewServiceCategory(e.target.value as ServiceCategory)}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none"
                      >
                        <option value="haircut">ตัดผม & เซ็ต</option>
                        <option value="shave">โกนหนวด & เครา</option>
                        <option value="color_perm">ดัด & ทำสี</option>
                        <option value="package">VIP แพ็กเกจ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">ราคา (บาท)</label>
                      <input
                        type="number"
                        required
                        min="50"
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">ระยะเวลา (นาที)</label>
                    <input
                      type="number"
                      required
                      min="15"
                      step="5"
                      value={newServiceDuration}
                      onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">คำอธิบายบริการ</label>
                    <textarea
                      rows={2}
                      placeholder="ระบุรายละเอียดบริการ..."
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md"
                    >
                      เพิ่มบริการ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl transition"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SHOP SETTINGS & 50% DEPOSIT RULES */}
      {activeSubTab === 'shop' && (
        <form onSubmit={handleSaveShopSettings} className="space-y-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-zinc-100 flex items-center space-x-1.5">
                  <Store className="w-4 h-4 text-amber-400" />
                  <span>ตั้งค่าข้อมูลร้านค้า & ระบบหักมัดจำ (Shop & Deposit Rules)</span>
                </h4>
                <p className="text-xs text-zinc-400">
                  ปรับแต่งข้อมูลร้าน เบอร์พร้อมเพย์ และสัดส่วนเงินมัดจำล่วงหน้า
                </p>
              </div>

              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1 animate-fadeIn">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>บันทึกสำเร็จ</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">ชื่อร้านตัดผม</label>
                <input
                  type="text"
                  value={localSettings.shopName}
                  onChange={(e) => setLocalSettings({ ...localSettings, shopName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">สาขา</label>
                <input
                  type="text"
                  value={localSettings.branchName}
                  onChange={(e) => setLocalSettings({ ...localSettings, branchName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  สัดส่วนเงินมัดจำล่วงหน้า (%)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 0, label: 'ไม่มีมัดจำ' },
                    { value: 50, label: '50%' },
                    { value: 70, label: '70%' },
                    { value: 100, label: '100%' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, depositPercentage: opt.value })}
                      className={`py-2 px-1.5 rounded-xl text-xs font-bold transition border truncate text-center cursor-pointer ${
                        localSettings.depositPercentage === opt.value
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow'
                          : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  อัตราค่าคอมมิชชั่นเริ่มต้นร้าน (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={localSettings.defaultCommissionRate}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, defaultCommissionRate: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  เบอร์พร้อมเพย์รับเงินมัดจำ (PromptPay ID)
                </label>
                <input
                  type="text"
                  value={localSettings.promptPayNumber}
                  onChange={(e) => setLocalSettings({ ...localSettings, promptPayNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">ชื่อบัญชีร้านค้า</label>
                <input
                  type="text"
                  value={localSettings.promptPayName}
                  onChange={(e) => setLocalSettings({ ...localSettings, promptPayName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none"
                />
              </div>

              {/* Custom PromptPay QR Code Upload Section */}
              <div className="sm:col-span-2 p-4 bg-zinc-950/80 rounded-2xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                    <QrCode className="w-4 h-4 text-amber-400" />
                    <span>รูปภาพ QR Code พร้อมเพย์ร้านค้า (Custom PromptPay QR)</span>
                  </label>
                  <span className="text-[10px] text-zinc-400">สำหรับให้ลูกค้าสแกนจ่ายเงิน</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  {/* QR Preview Box */}
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 bg-white rounded-2xl p-2.5 border-2 border-amber-500/40 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-black/40 group overflow-hidden">
                    {localSettings.promptPayQrImage ? (
                      <>
                        <img
                          src={localSettings.promptPayQrImage}
                          alt="Custom PromptPay QR"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setLocalSettings({ ...localSettings, promptPayQrImage: '' });
                          }}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-rose-400 font-bold text-xs transition duration-200"
                          title="ลบรูป QR นี้"
                        >
                          <Trash2 className="w-5 h-5 mb-1" />
                          <span>ลบรูปภาพ</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-2 text-zinc-500 flex flex-col items-center justify-center">
                        <QrCode className="w-8 h-8 text-zinc-400 mb-1" />
                        <span className="text-[10px] font-medium text-zinc-600">ใช้ QR เริ่มต้น</span>
                        <span className="text-[9px] text-zinc-400">(ของระบบ)</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <p className="text-xs text-zinc-300">
                      คุณสามารถอัปโหลดรูปภาพ QR Code พร้อมเพย์ของบัญชีร้าน (จากแอปธนาคารของคุณ) เพื่อให้ลูกค้าสแกนจ่ายมัดจำได้โดยตรง
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>เลือกรูป QR จากเครื่อง</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                if (base64) {
                                  setLocalSettings({ ...localSettings, promptPayQrImage: base64 });
                                  soundFx.playSuccess();
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {localSettings.promptPayQrImage && (
                        <button
                          type="button"
                          onClick={() => {
                            soundFx.playClick();
                            setLocalSettings({ ...localSettings, promptPayQrImage: '' });
                          }}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl flex items-center space-x-1 border border-zinc-700 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                          <span>ใช้ QR จำลองระบบ</span>
                        </button>
                      )}
                    </div>

                    {/* Or URL input */}
                    <div className="pt-1">
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        หรือใส่ลิงก์รูปภาพ QR Code (Image URL):
                      </label>
                      <input
                        type="url"
                        placeholder="https://example.com/promptpay-qr.png"
                        value={localSettings.promptPayQrImage || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, promptPayQrImage: e.target.value })}
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:border-amber-500 outline-none font-mono placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>เวลาเปิด - ปิดร้าน (Shop Operating Hours)</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {localSettings.openTime || '10:00'} - {localSettings.closeTime || '20:30'} น.
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">เวลาเปิดร้าน</span>
                    <input
                      type="time"
                      value={localSettings.openTime}
                      onChange={(e) => setLocalSettings({ ...localSettings, openTime: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">เวลาปิดร้าน</span>
                    <input
                      type="time"
                      value={localSettings.closeTime}
                      onChange={(e) => setLocalSettings({ ...localSettings, closeTime: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-zinc-500">เลือกเร็ว:</span>
                  {[
                    { open: '10:00', close: '20:30', label: '10:00 - 20:30 (ค่าเริ่มต้น)' },
                    { open: '09:00', close: '21:00', label: '09:00 - 21:00' },
                    { open: '10:00', close: '22:00', label: '10:00 - 22:00' },
                    { open: '08:30', close: '20:00', label: '08:30 - 20:00' },
                  ].map((preset) => (
                    <button
                      key={`${preset.open}-${preset.close}`}
                      type="button"
                      onClick={() => {
                        setLocalSettings({ ...localSettings, openTime: preset.open, closeTime: preset.close });
                        soundFx.playClick();
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition font-mono ${
                        localSettings.openTime === preset.open && localSettings.closeTime === preset.close
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  💡 การตั้งค่านี้นำไปแสดงบน <strong>ระบบคิวสดหน้าร้าน (Live Queue)</strong>, หัวเว็บ และคำนวณรอบการจองคิวออนไลน์ทันที
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">เบอร์โทรศัพท์ร้าน</label>
                <input
                  type="text"
                  value={localSettings.phone}
                  onChange={(e) => setLocalSettings({ ...localSettings, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500 outline-none font-mono"
                />
              </div>
            </div>

            {/* PIN Passcode Security Card */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-4 shadow-lg shadow-black/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-zinc-100 flex items-center space-x-2">
                      <span>รหัสความปลอดภัย (Security PIN Lock)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        4 หลัก
                      </span>
                    </h5>
                    <p className="text-xs text-zinc-400">
                      ล็อคป้องกันไม่ให้ลูกค้าหรือบุคคลภายนอกเข้าถึงข้อมูลหน้า <strong>"3 ช่าง"</strong>, <strong>"รายรับ-จ่าย"</strong> และ <strong>"หลังบ้าน"</strong>
                    </p>
                  </div>
                </div>

                {/* Toggle PIN Lock Enable/Disable */}
                <button
                  type="button"
                  onClick={() => {
                    const nextState = shopSettings.pinLockEnabled === false ? true : false;
                    togglePinLock(nextState);
                    setLocalSettings((prev) => ({ ...prev, pinLockEnabled: nextState }));
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border shrink-0 ${
                    shopSettings.pinLockEnabled !== false
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>{shopSettings.pinLockEnabled !== false ? '🟢 เปิดใช้งานล็อค PIN' : '⚪ ปิดการล็อค PIN'}</span>
                </button>
              </div>

              {shopSettings.pinLockEnabled !== false && (
                <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                  {/* Success / Error Feedback Alert */}
                  {pinSaveMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold">{pinSaveMsg}</span>
                    </div>
                  )}

                  {pinErrorMsg && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="font-bold">{pinErrorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                    {/* Input Field & Instant Save */}
                    <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 flex flex-col justify-between space-y-4 h-full">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-400" />
                            <span>ตั้งรหัส PIN ใหม่ (4 หลัก)</span>
                          </label>
                          <span className="text-[11px] text-zinc-400 bg-zinc-950 px-2.5 py-0.5 rounded-lg border border-zinc-800">
                            รหัสปัจจุบัน: <strong className="font-mono text-amber-400">{shopSettings.adminPin || '8888'}</strong>
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type={showPinCode ? 'text' : 'password'}
                            maxLength={4}
                            placeholder="ระบุรหัส 4 หลัก"
                            value={pinInput}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setPinInput(val);
                              setPinErrorMsg(null);
                              setPinSaveMsg(null);
                            }}
                            className="w-full px-4 py-2.5 pr-10 bg-zinc-950 border border-zinc-700 focus:border-amber-500 rounded-xl text-base text-zinc-100 outline-none font-mono tracking-widest font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPinCode(!showPinCode)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 cursor-pointer"
                            title={showPinCode ? 'ซ่อนรหัส' : 'แสดงรหัส'}
                          >
                            {showPinCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Quick helpers */}
                        <div className="flex items-center justify-between text-[11px] px-0.5">
                          <span className="text-zinc-400 font-mono">
                            {pinInput.length}/4 หลัก
                          </span>
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPinInput('8888');
                                updateAdminPin('8888');
                                setLocalSettings((prev) => ({ ...prev, adminPin: '8888' }));
                                setPinSaveMsg('✅ รีเซ็ตกลับเป็นรหัสเริ่มต้น (8888) แล้ว');
                                setTimeout(() => setPinSaveMsg(null), 3000);
                              }}
                              className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                            >
                              ใช้รหัส 8888 (ค่าเริ่มต้น)
                            </button>
                            <span className="text-zinc-700">|</span>
                            <button
                              type="button"
                              onClick={() => setPinInput('')}
                              className="text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                            >
                              ล้างค่า
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Full-width Save PIN Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (pinInput.length !== 4) {
                            soundFx.playNotification();
                            setPinErrorMsg('กรุณากรอกรหัส PIN ให้ครบ 4 หลัก (เฉพาะตัวเลข 0-9)');
                            return;
                          }
                          updateAdminPin(pinInput);
                          setLocalSettings((prev) => ({ ...prev, adminPin: pinInput }));
                          setPinSaveMsg(`✅ บันทึกรหัส PIN ใหม่ (${pinInput}) เรียบร้อยแล้ว!`);
                          setPinErrorMsg(null);
                          setTimeout(() => setPinSaveMsg(null), 4000);
                        }}
                        className="w-full min-h-[42px] py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                      >
                        <Save className="w-4 h-4 shrink-0" />
                        <span>บันทึกรหัส PIN</span>
                      </button>
                    </div>

                    {/* Security Instruction Info */}
                    <div className="bg-zinc-900/60 p-4 sm:p-5 rounded-2xl border border-zinc-800/80 flex flex-col justify-between space-y-4 h-full">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 font-bold text-amber-400 text-xs">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>คำแนะนำความปลอดภัย</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          เมื่อตั้งรหัส PIN แล้ว ระบบจะขอรหัสผ่านทุกครั้งก่อนเปิดเมนู <strong>"รายรับ-จ่าย"</strong> และ <strong>"หลังบ้าน"</strong> เพื่อป้องกันข้อมูลสำคัญของร้าน
                        </p>
                      </div>

                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            lockAdmin();
                            setActiveTab('book');
                          }}
                          className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-[0.98]"
                        >
                          <Lock className="w-4 h-4 shrink-0" />
                          <span>ทดสอบล็อคระบบทันที</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advance Queue Notification Settings Card (แจ้งเตือนคิวล่วงหน้า) */}
            <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-zinc-950 border border-amber-500/40 space-y-4 shadow-lg shadow-black/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-zinc-100 flex items-center space-x-2">
                      <span>แจ้งเตือนคิวล่วงหน้า (Advance Queue Notification)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                        {localSettings.advanceNotificationMinutes ?? 15} นาที
                      </span>
                    </h5>
                    <p className="text-xs text-zinc-400">
                      ส่งการแจ้งเตือนแบบ <strong>Pop-up</strong> หรือ <strong>Toast</strong> เมื่อถึงคิวลูกค้าที่จองไว้ภายในเวลาที่กำหนด
                    </p>
                  </div>
                </div>

                {/* Toggle Enable / Disable */}
                <button
                  type="button"
                  onClick={() => {
                    const nextState = localSettings.advanceNotificationEnabled === false ? true : false;
                    setLocalSettings((prev) => ({ ...prev, advanceNotificationEnabled: nextState }));
                    updateShopSettings({ advanceNotificationEnabled: nextState });
                    soundFx.playClick();
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 border shrink-0 cursor-pointer ${
                    localSettings.advanceNotificationEnabled !== false
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  <span>{localSettings.advanceNotificationEnabled !== false ? '🟢 เปิดใช้งานแจ้งเตือน' : '⚪ ปิดการแจ้งเตือน'}</span>
                </button>
              </div>

              {localSettings.advanceNotificationEnabled !== false && (
                <div className="space-y-4 pt-3 border-t border-zinc-800/80">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Time setting */}
                    <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
                      <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>แจ้งเตือนก่อนถึงเวลานัดหมาย</span>
                      </label>

                      {/* Quick preset chips */}
                      <div className="flex flex-wrap gap-2">
                        {[10, 15, 20, 30].map((mins) => {
                          const isSelected = (localSettings.advanceNotificationMinutes ?? 15) === mins;
                          return (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                setLocalSettings((prev) => ({ ...prev, advanceNotificationMinutes: mins }));
                                soundFx.playClick();
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-sm'
                                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
                              }`}
                            >
                              {mins} นาที {mins === 15 && '(แนะนำ)'}
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-zinc-400">
                        ระบบจะคำนวณและแจ้งเตือนเมื่อเวลาปัจจุบันเหลืออีก <strong>{localSettings.advanceNotificationMinutes ?? 15} นาที</strong> ก่อนถึงเวลาเริ่มให้บริการ
                      </p>
                    </div>

                    {/* Display Type Setting */}
                    <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 space-y-3">
                      <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>รูปแบบการแจ้งเตือน (Display Type)</span>
                      </label>

                      <div className="space-y-2">
                        {[
                          { id: 'both', title: 'ทั้งสองแบบ (Pop-up + Toast)', desc: 'แสดงหน้าต่าง Pop-up และแถบลอย (แนะนำ)' },
                          { id: 'popup', title: 'เฉพาะ Pop-up กลางจอ', desc: 'หน้าต่างแจ้งเตือนแสดงรายละเอียดคิวครบถ้วน' },
                          { id: 'toast', title: 'เฉพาะ Toast แถบลอยมุมบน', desc: 'แถบเตือนกะทัดรัด ไม่บังหน้าจอหลัก' },
                        ].map((opt) => {
                          const currentType = localSettings.advanceNotificationType || 'both';
                          const isSelected = currentType === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => {
                                setLocalSettings((prev) => ({
                                  ...prev,
                                  advanceNotificationType: opt.id as 'toast' | 'popup' | 'both',
                                }));
                                soundFx.playClick();
                              }}
                              className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-500/10 border-amber-500/50 text-zinc-100'
                                  : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                              }`}
                            >
                              <div>
                                <span className="text-xs font-bold block">{opt.title}</span>
                                <span className="text-[11px] text-zinc-400">{opt.desc}</span>
                              </div>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? 'border-amber-400 bg-amber-400' : 'border-zinc-600'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sound & Instant Test Trigger */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-zinc-300">
                      <input
                        type="checkbox"
                        checked={localSettings.advanceNotificationSound !== false}
                        onChange={(e) =>
                          setLocalSettings((prev) => ({ ...prev, advanceNotificationSound: e.target.checked }))
                        }
                        className="w-4 h-4 rounded text-amber-500 accent-amber-500 bg-zinc-950 border-zinc-700 focus:ring-amber-500"
                      />
                      <Volume2 className="w-4 h-4 text-amber-400" />
                      <span>เปิดเสียงแจ้งเตือนกระดิ่ง (Dual-tone Chime)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        triggerAdvanceQueueAlert(undefined, localSettings.advanceNotificationMinutes || 15);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-95 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>ทดสอบส่งการแจ้งเตือนทันที (15 นาที)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่าร้านค้า</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Custom Confirmation Modal: Delete Service */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl animate-scaleIn text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-zinc-100">ยืนยันการลบบริการ?</h4>
              <p className="text-xs text-zinc-400">
                คุณต้องการลบ <strong className="text-amber-400">"{serviceToDelete.name}"</strong> (฿{serviceToDelete.price.toLocaleString()}) ออกจากระบบหรือไม่?
              </p>
              {services.length <= 1 && (
                <p className="text-[11px] text-rose-400 pt-1 font-semibold">
                  ⚠️ ต้องมีบริการอย่างน้อย 1 รายการในระบบ
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={services.length <= 1}
                onClick={() => {
                  if (services.length > 1) {
                    deleteService(serviceToDelete.id);
                    setServiceActionToast(`ลบบริการ "${serviceToDelete.name}" สำเร็จ`);
                    setTimeout(() => setServiceActionToast(null), 3000);
                  }
                  setServiceToDelete(null);
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition disabled:opacity-40"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Barber Profile Modal */}
      <EditBarberModal
        barber={barberToEdit}
        isOpen={!!barberToEdit}
        onClose={() => setBarberToEdit(null)}
        onSave={(barberId, updates) => {
          updateBarberProfile(barberId, updates);
          setServiceActionToast(`บันทึกข้อมูล ${updates.nickname || 'ช่าง'} เรียบร้อยแล้ว ✨`);
          setTimeout(() => setServiceActionToast(null), 3500);
        }}
      />

      {/* Custom Confirmation Modal: Reset All Settings */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-sm space-y-4 shadow-2xl animate-scaleIn text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-base text-zinc-100">คืนค่าเริ่มต้นระบบทั้งหมด?</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                การกระทำนี้จะรีเซ็ตข้อมูลบริการ ช่างตัดผม ค่าคอมมิชชั่น และการตั้งค่าร้านค้ากลับเป็นค่าเริ่มต้นจากโรงงาน
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllSettings();
                  setShowResetConfirmModal(false);
                  setServiceActionToast('คืนค่าเริ่มต้นระบบทั้งหมดเรียบร้อยแล้ว');
                  setTimeout(() => setServiceActionToast(null), 3500);
                }}
                className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 transition"
              >
                ยืนยันรีเซ็ต
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {serviceActionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-zinc-950 font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 animate-fadeIn border border-emerald-400">
          <CheckCircle className="w-4 h-4" />
          <span>{serviceActionToast}</span>
        </div>
      )}
    </div>
  );
};
