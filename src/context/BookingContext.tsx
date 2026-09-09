import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  Booking,
  BookingStatus,
  BarberId,
  Barber,
  AppNotification,
  PaymentOption,
  PaymentMethodType,
  Service,
  ActiveTab,
  ShopSettings,
  TransactionItem,
  TransactionType,
  TransactionCategory,
  CreateWalkInParams,
  CustomerLoyalty,
  LoyaltyHistoryItem,
} from '../types';
import { BARBERS } from '../data/barbers';
import { SERVICES } from '../data/services';
import { INITIAL_TRANSACTIONS } from '../data/transactions';
import {
  INITIAL_LOYALTY_CUSTOMERS,
  normalizePhone,
  formatPhone,
} from '../data/loyalty';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  subscribeToBookings,
  saveBookingToFirestore,
  deleteBookingFromFirestore,
  seedInitialBookings,
  subscribeToShopSettings,
  saveShopSettingsToFirestore,
  subscribeToLoyaltyRecords,
  saveLoyaltyRecordToFirestore,
  seedInitialLoyalty,
  subscribeToTransactions,
  saveTransactionToFirestore,
  deleteTransactionFromFirestore,
  seedInitialTransactions,
  subscribeToBarbers,
  saveBarberToFirestore,
  seedInitialBarbers,
} from '../services/firestoreService';
import firebaseConfig from '../../firebase-applet-config.json';

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: 'BarberQ Hair Studio',
  branchName: 'สาขาสยามสแควร์ ซอย 3',
  taxId: '0105567012889',
  phone: '02-123-4567',
  openTime: '10:00',
  closeTime: '20:30',
  slotDurationMinutes: 45,
  depositPercentage: 50,
  promptPayNumber: '089-123-4567',
  promptPayName: 'บจก. บาร์เบอร์คิว แฮร์สตูดิโอ (BarberQ Studio)',
  autoConfirmDeposit: true,
  defaultCommissionRate: 60,
  currencySymbol: '฿',
  adminPin: '8888',
  pinLockEnabled: true,
  advanceNotificationEnabled: true,
  advanceNotificationMinutes: 15,
  advanceNotificationType: 'both',
  advanceNotificationSound: true,

  // Loyalty Program Settings (สะสมแต้ม)
  loyaltyEnabled: true,
  loyaltyPointsPerCut: 1,
  loyaltyPointsRequired: 10,
  loyaltyRewardDiscount: 150,
  loyaltyRewardTitle: 'ส่วนลดพิเศษ ฿150 (ครบ 10 แต้ม)',
};

interface BookingContextType {
  bookings: Booking[];
  activeBooking: Booking | null;
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  activeTab: ActiveTab;
  barbers: Barber[];
  services: Service[];
  shopSettings: ShopSettings;
  transactions: TransactionItem[];
  selectedBarberId: BarberId | null;
  selectedService: Service | null;
  selectedDate: string;
  selectedTimeSlot: string;
  customerName: string;
  customerPhone: string;
  customerNotes: string;
  paymentOption: PaymentOption;
  paymentMethod: PaymentMethodType;
  discountCode: string;
  discountAmount: number;

  // Loyalty Program (ระบบสะสมแต้ม)
  loyaltyRecords: Record<string, CustomerLoyalty>;
  isRedeemingLoyalty: boolean;
  setIsRedeemingLoyalty: (redeem: boolean) => void;
  getCustomerLoyalty: (phone: string, customerName?: string) => CustomerLoyalty;
  awardLoyaltyPoints: (phone: string, points: number, description: string, bookingId?: string) => void;
  redeemLoyaltyReward: (phone: string, customerName?: string, bookingId?: string) => boolean;
  updateLoyaltyPointsManual: (phone: string, newPoints: number, note: string) => void;

  // PIN / Passcode Security State
  isAdminUnlocked: boolean;
  unlockAdminWithPin: (pin: string) => boolean;
  lockAdmin: () => void;
  updateAdminPin: (newPin: string) => void;
  togglePinLock: (enabled: boolean) => void;

  // Advance Queue Notification Alert State & Actions (แจ้งเตือนคิวล่วงหน้า 15 นาที)
  advanceAlertData: { booking: Booking; minutesLeft: number } | null;
  dismissAdvanceAlert: () => void;
  triggerAdvanceQueueAlert: (booking?: Booking, minutesLeft?: number) => void;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedBarberId: (id: BarberId | null) => void;
  setSelectedService: (service: Service | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTimeSlot: (slot: string) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setCustomerNotes: (notes: string) => void;
  setPaymentOption: (option: PaymentOption) => void;
  setPaymentMethod: (method: PaymentMethodType) => void;
  setSoundEnabled: (enabled: boolean) => void;
  applyDiscountCode: (code: string) => boolean;
  createBookingAndPay: () => Booking;
  createWalkInBooking: (params: CreateWalkInParams) => Booking;
  updateBookingStatus: (bookingId: string, newStatus: BookingStatus, customNote?: string) => void;
  cancelBooking: (bookingId: string) => void;
  deleteBooking: (bookingId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  setActiveBookingId: (bookingId: string) => void;
  simulateNextQueueEvent: () => void;

  // Accounting & Transaction Actions (รายรับ-รายจ่าย รายวัน/สัปดาห์/เดือน)
  addTransaction: (tx: Omit<TransactionItem, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<TransactionItem>) => void;
  resetTransactions: () => void;

  // Admin & Back-Office Settings Actions
  updateBarberCommissionRate: (barberId: BarberId, newRate: number) => void;
  updateBarberProfile: (barberId: BarberId, updates: Partial<Barber>) => void;
  toggleBarberActiveStatus: (barberId: BarberId) => void;
  updateService: (serviceId: string, updates: Partial<Service>) => void;
  addService: (newService: Omit<Service, 'id'>) => void;
  deleteService: (serviceId: string) => void;
  updateShopSettings: (settings: Partial<ShopSettings>) => void;
  resetAllSettings: () => void;
  firebaseStatus: 'connecting' | 'connected' | 'offline';
  firebaseProjectId: string;
}

const STORAGE_KEY_BOOKINGS = 'barberq_bookings_v3';
const STORAGE_KEY_NOTIFS = 'barberq_notifications_v3';
const STORAGE_KEY_BARBERS = 'barberq_barbers_v3';
const STORAGE_KEY_SERVICES = 'barberq_services_v3';
const STORAGE_KEY_SETTINGS = 'barberq_settings_v3';
const STORAGE_KEY_TRANSACTIONS = 'barberq_transactions_v3';
const STORAGE_KEY_LOYALTY = 'barberq_loyalty_v3';

const initialSampleBookings: Booking[] = [
  {
    id: 'bk-101',
    queueNumber: 'BQ-001',
    customerName: 'คุณธนกฤต (ต่อ)',
    customerPhone: '081-234-5678',
    barberId: 'barber-top',
    barber: BARBERS[0],
    service: SERVICES[1], // Fade Master (450)
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTimeSlot: '11:00',
    durationMinutes: 50,
    totalServicePrice: 450,
    discountAmount: 0,
    finalTotalPrice: 450,
    paymentOption: 'deposit_50',
    amountPaid: 225,
    amountRemaining: 225,
    paymentMethod: 'promptpay',
    paymentRefNumber: 'PP-20260902-8812',
    paidAt: '2026-09-02 10:45',
    status: 'IN_PROGRESS',
    statusUpdatedAt: '2026-09-02 11:02',
    commissionRate: 60,
    barberCommissionEarned: 270,
    shopRevenueShare: 180,
    timeline: [
      { status: 'CONFIRMED', label: 'มัดจำ 50% สำเร็จ (฿225)', timestamp: '10:45' },
      { status: 'BARBER_PREPARING', label: 'ช่างท็อปเตรียมอุปกรณ์พร้อม', timestamp: '10:55' },
      { status: 'IN_PROGRESS', label: 'กำลังเริ่มบริการ Skin Fade', timestamp: '11:02' },
    ],
  },
  {
    id: 'bk-102',
    queueNumber: 'BQ-002',
    customerName: 'คุณอิทธิกร (เป้)',
    customerPhone: '089-987-6543',
    barberId: 'barber-bass',
    barber: BARBERS[1],
    service: SERVICES[3], // Korean Perm (1200)
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTimeSlot: '13:00',
    durationMinutes: 90,
    totalServicePrice: 1200,
    discountAmount: 50,
    finalTotalPrice: 1150,
    paymentOption: 'deposit_50',
    amountPaid: 575,
    amountRemaining: 575,
    paymentMethod: 'credit_card',
    paymentRefNumber: 'CC-20260902-4419',
    paidAt: '2026-09-02 11:20',
    status: 'BARBER_PREPARING',
    statusUpdatedAt: '2026-09-02 12:45',
    commissionRate: 55,
    barberCommissionEarned: 633,
    shopRevenueShare: 517,
    timeline: [
      { status: 'CONFIRMED', label: 'มัดจำ 50% สำเร็จ (฿575)', timestamp: '11:20' },
      { status: 'BARBER_PREPARING', label: 'ช่างเบสผสมน้ำยาดัดเกาหลี', timestamp: '12:45' },
    ],
  },
  {
    id: 'bk-103',
    queueNumber: 'BQ-003',
    customerName: 'คุณวรุตม์ (เอก)',
    customerPhone: '086-555-1234',
    barberId: 'barber-ake',
    barber: BARBERS[2],
    service: SERVICES[5], // VIP Combo (850)
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTimeSlot: '14:00',
    durationMinutes: 80,
    totalServicePrice: 850,
    discountAmount: 0,
    finalTotalPrice: 850,
    paymentOption: 'full_100',
    amountPaid: 850,
    amountRemaining: 0,
    paymentMethod: 'promptpay',
    paymentRefNumber: 'PP-20260902-9903',
    paidAt: '2026-09-02 11:30',
    status: 'CONFIRMED',
    statusUpdatedAt: '2026-09-02 11:30',
    commissionRate: 65,
    barberCommissionEarned: 553,
    shopRevenueShare: 297,
    timeline: [
      { status: 'CONFIRMED', label: 'ชำระเต็มจำนวน 100% เรียบร้อย (฿850)', timestamp: '11:30' },
    ],
  },
];

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Barbers state
  const [barbers, setBarbers] = useState<Barber[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BARBERS);
      if (!saved) return BARBERS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return BARBERS;
      // Merge with default BARBERS to ensure all barbers have correct ID and details
      return BARBERS.map((defaultB) => {
        const found = parsed.find((p: Barber) => p.id === defaultB.id);
        return found ? { ...defaultB, ...found } : defaultB;
      });
    } catch {
      return BARBERS;
    }
  });

  // Services state
  const [services, setServices] = useState<Service[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SERVICES);
      if (!saved) return SERVICES;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return SERVICES;
      return parsed;
    } catch {
      return SERVICES;
    }
  });

  // Shop Settings state
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved ? { ...DEFAULT_SHOP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SHOP_SETTINGS;
    } catch {
      return DEFAULT_SHOP_SETTINGS;
    }
  });

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOOKINGS);
      if (!saved) return initialSampleBookings;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialSampleBookings;

      // Ensure every booking has valid barber, service, and timing fields
      return parsed.map((b: Partial<Booking>, index: number): Booking => {
        const matchingBarber =
          BARBERS.find((br) => br.id === b.barberId) ||
          BARBERS[index % BARBERS.length] ||
          BARBERS[0];
        const matchingService =
          SERVICES.find((s) => s.id === b.service?.id) || SERVICES[0];

        const totalServicePrice = b.totalServicePrice ?? matchingService.price ?? 400;
        const discountAmount = b.discountAmount ?? 0;
        const finalTotalPrice = b.finalTotalPrice ?? Math.max(0, totalServicePrice - discountAmount);

        return {
          id: b.id || `bk-${Date.now()}-${index}`,
          queueNumber: b.queueNumber || `BQ-${String(index + 1).padStart(3, '0')}`,
          customerName: b.customerName || 'ลูกค้าทั่วไป',
          customerPhone: b.customerPhone || '08x-xxx-xxxx',
          customerNotes: b.customerNotes || '',
          barberId: matchingBarber.id,
          barber: b.barber && b.barber.name ? { ...matchingBarber, ...b.barber } : matchingBarber,
          service: b.service && b.service.name ? { ...matchingService, ...b.service } : matchingService,
          bookingDate: b.bookingDate || new Date().toISOString().split('T')[0],
          bookingTimeSlot: b.bookingTimeSlot || '11:00',
          durationMinutes: b.durationMinutes || matchingService.durationMinutes || 45,
          totalServicePrice,
          discountAmount,
          finalTotalPrice,
          paymentOption: b.paymentOption || 'deposit_50',
          amountPaid: b.amountPaid ?? 0,
          amountRemaining: b.amountRemaining ?? finalTotalPrice,
          paymentMethod: b.paymentMethod || 'promptpay',
          paymentRefNumber: b.paymentRefNumber || `REF-${Date.now()}`,
          paidAt: b.paidAt || `${b.bookingDate || '2026-09-02'} 11:00`,
          status: b.status || 'CONFIRMED',
          statusUpdatedAt: b.statusUpdatedAt || '11:00',
          commissionRate: b.commissionRate ?? matchingBarber.commissionRate ?? 60,
          barberCommissionEarned: b.barberCommissionEarned ?? 0,
          shopRevenueShare: b.shopRevenueShare ?? 0,
          isWalkIn: b.isWalkIn ?? false,
          timeline: Array.isArray(b.timeline) && b.timeline.length > 0
            ? b.timeline
            : [{ status: 'CONFIRMED', label: 'สร้างคิวเรียบร้อย', timestamp: '11:00' }],
        };
      });
    } catch {
      return initialSampleBookings;
    }
  });

  // Transactions (Accounting / รายรับ - รายจ่าย)
  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [activeBookingId, setActiveBookingIdState] = useState<string>(() => {
    return bookings[0]?.id || '';
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'notif-1',
              title: '💈 ยินดีต้อนรับสู่ BarberQ',
              message: 'ระบบจองคิวมือถือพร้อมคำนวณค่าคอมมิชชั่นช่าง และหักมัดจำ 50% อัตโนมัติ',
              type: 'info',
              timestamp: 'เมื่อสักครู่',
              read: false,
            },
            {
              id: 'notif-2',
              bookingId: 'bk-101',
              title: '✂️ คิว BQ-001 กำลังเริ่มตัดแล้ว',
              message: 'ช่างท็อปเริ่มให้บริการ Skin Fade ให้คุณธนกฤต (ค่าคอม 60%: ฿270)',
              type: 'status_change',
              timestamp: '5 นาทีที่แล้ว',
              read: false,
            },
          ];
    } catch {
      return [];
    }
  });

  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('book');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // PIN Actions
  const unlockAdminWithPin = (pin: string): boolean => {
    const validPin = shopSettings.adminPin || '8888';
    if (pin === validPin) {
      setIsAdminUnlocked(true);
      return true;
    }
    return false;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
    soundFx.playNotification();
    addNotification('🔒 ล็อคระบบความปลอดภัยแล้ว', 'เข้าสู่โหมดป้องกันข้อมูลบัญชีและหลังบ้าน', 'info');
  };

  const updateAdminPin = (newPin: string) => {
    if (newPin.length === 4) {
      const updated = { ...shopSettings, adminPin: newPin };
      setShopSettings(updated);
      saveShopSettingsToFirestore(updated).catch(console.error);
      soundFx.playSuccess();
      addNotification('🔑 เปลี่ยนรหัส PIN สำเร็จ', `รหัส PIN ใหม่ 4 หลักได้รับการบันทึกแล้ว`, 'success');
    }
  };

  const togglePinLock = (enabled: boolean) => {
    const updated = { ...shopSettings, pinLockEnabled: enabled };
    setShopSettings(updated);
    saveShopSettingsToFirestore(updated).catch(console.error);
    soundFx.playSuccess();
    addNotification(
      enabled ? '🔒 เปิดใช้งานรหัสล็อคความปลอดภัย' : '🔓 ปิดใช้งานรหัสล็อคความปลอดภัย',
      enabled ? 'ระบบจะขอรหัส PIN ก่อนเข้าเมนูรายรับ-จ่าย และหลังบ้าน' : 'สามารถเข้าเมนูทั้งหมดได้โดยตรง',
      'info'
    );
  };

  // Form states
  const [selectedBarberId, setSelectedBarberId] = useState<BarberId | null>('barber-top');
  const [selectedService, setSelectedService] = useState<Service | null>(SERVICES[0]);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('14:00');
  const [customerName, setCustomerName] = useState('คุณณัฐพล เพ็ชรฤทธิ์');
  const [customerPhone, setCustomerPhone] = useState('089-123-4567');
  const [customerNotes, setCustomerNotes] = useState('ขอสไตล์โมเดิร์น สบายๆ ไม่สั้นเกินไปครับ');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('deposit_50');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('promptpay');
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BARBERS, JSON.stringify(barbers));
    } catch {
      // Ignored
    }
  }, [barbers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(services));
    } catch {
      // Ignored
    }
  }, [services]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(shopSettings));
    } catch {
      // Ignored
    }
  }, [shopSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
    } catch {
      // Ignored
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    } catch {
      // Ignored
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
    } catch {
      // Ignored
    }
  }, [notifications]);

  // Loyalty Program State & Persistence (ระบบสะสมแต้ม)
  const [loyaltyRecords, setLoyaltyRecords] = useState<Record<string, CustomerLoyalty>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOYALTY);
      if (!saved) return INITIAL_LOYALTY_CUSTOMERS;
      const parsed = JSON.parse(saved);
      return typeof parsed === 'object' && parsed !== null ? { ...INITIAL_LOYALTY_CUSTOMERS, ...parsed } : INITIAL_LOYALTY_CUSTOMERS;
    } catch {
      return INITIAL_LOYALTY_CUSTOMERS;
    }
  });

  const [isRedeemingLoyalty, setIsRedeemingLoyalty] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOYALTY, JSON.stringify(loyaltyRecords));
    } catch {
      // Ignored
    }
  }, [loyaltyRecords]);

  // Firebase Cloud Database (barberq-5995d) Real-time Sync & Status
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const firebaseProjectId = firebaseConfig.projectId || 'barberq-5995d';

  // Seed initial records to Firestore on startup & listen to real-time changes
  useEffect(() => {
    let isMounted = true;

    // Seed Firestore if database is fresh
    seedInitialBookings(initialSampleBookings);
    seedInitialLoyalty(INITIAL_LOYALTY_CUSTOMERS);
    seedInitialTransactions(INITIAL_TRANSACTIONS);
    seedInitialBarbers(BARBERS);

    // 1. Subscribe to Bookings
    const unsubBookings = subscribeToBookings(
      (remoteBookings) => {
        if (!isMounted) return;
        setFirebaseStatus('connected');
        if (remoteBookings && remoteBookings.length > 0) {
          setBookings(remoteBookings);
        }
      },
      () => {
        if (isMounted) setFirebaseStatus('offline');
      }
    );

    // 2. Subscribe to Shop Settings
    const unsubSettings = subscribeToShopSettings(
      (remoteSettings) => {
        if (!isMounted) return;
        if (remoteSettings && Object.keys(remoteSettings).length > 0) {
          setShopSettings((prev) => ({ ...prev, ...remoteSettings }));
        }
      }
    );

    // 3. Subscribe to Loyalty Points
    const unsubLoyalty = subscribeToLoyaltyRecords(
      (remoteLoyalty) => {
        if (!isMounted) return;
        if (remoteLoyalty && Object.keys(remoteLoyalty).length > 0) {
          setLoyaltyRecords((prev) => ({ ...prev, ...remoteLoyalty }));
        }
      }
    );

    // 4. Subscribe to Transactions
    const unsubTransactions = subscribeToTransactions(
      (remoteTxs) => {
        if (!isMounted) return;
        if (remoteTxs && remoteTxs.length > 0) {
          setTransactions(remoteTxs);
        }
      }
    );

    // 5. Subscribe to Barbers
    const unsubBarbers = subscribeToBarbers(
      (remoteBarbers) => {
        if (!isMounted) return;
        if (remoteBarbers && remoteBarbers.length > 0) {
          setBarbers(remoteBarbers);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubBookings();
      unsubSettings();
      unsubLoyalty();
      unsubTransactions();
      unsubBarbers();
    };
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundFx.soundEnabled = enabled;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const activeBooking = bookings.find((b) => b.id === activeBookingId) || bookings[0] || null;

  const setActiveBookingId = (id: string) => {
    setActiveBookingIdState(id);
  };

  const addNotification = (title: string, message: string, type: AppNotification['type'], bookingId?: string) => {
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      bookingId,
      title,
      message,
      type,
      timestamp: 'เมื่อสักครู่',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    soundFx.playNotification();
  };

  // Advance Queue Notification Alert State & Actions (แจ้งเตือนคิวล่วงหน้า 15 นาที)
  const [advanceAlertData, setAdvanceAlertData] = useState<{ booking: Booking; minutesLeft: number } | null>(null);
  const notifiedAdvanceIdsRef = useRef<Set<string>>(new Set());

  const dismissAdvanceAlert = () => {
    setAdvanceAlertData(null);
  };

  const triggerAdvanceQueueAlert = (customBooking?: Booking, customMinutesLeft?: number) => {
    const target =
      customBooking ||
      bookings.find(
        (b) =>
          b.status === 'CONFIRMED' ||
          b.status === 'BARBER_PREPARING'
      ) ||
      bookings[0];

    if (!target) return;

    const minutesLeft = customMinutesLeft ?? shopSettings.advanceNotificationMinutes ?? 15;
    setAdvanceAlertData({ booking: target, minutesLeft });

    if (soundEnabled && shopSettings.advanceNotificationSound !== false) {
      soundFx.playQueueAlert();
    }

    addNotification(
      `⏳ คิว ${target.queueNumber} ใกล้ถึงเวลาใน ${minutesLeft} นาที!`,
      `คุณ${target.customerName} มีนัดหมายบริการ ${target.service.name} กับ${target.barber.name} (${target.barber.nickname}) เวลา ${target.bookingTimeSlot} น.`,
      'warning',
      target.id
    );
  };

  // Background check for advance queue notifications (Every 10 seconds)
  useEffect(() => {
    if (shopSettings.advanceNotificationEnabled === false) return;

    const checkAdvanceQueues = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;
      const targetWindowMinutes = shopSettings.advanceNotificationMinutes ?? 15;

      const activeUpcoming = bookings.filter(
        (b) =>
          (b.status === 'CONFIRMED' || b.status === 'BARBER_PREPARING') &&
          !notifiedAdvanceIdsRef.current.has(b.id)
      );

      for (const booking of activeUpcoming) {
        if (!booking.bookingTimeSlot) continue;
        const [slotH, slotM] = booking.bookingTimeSlot.split(':').map(Number);
        if (isNaN(slotH) || isNaN(slotM)) continue;

        const slotTotalMinutes = slotH * 60 + slotM;
        const diffMinutes = slotTotalMinutes - currentTotalMinutes;

        // If within advance window (e.g. 1 to 15 minutes)
        if (diffMinutes > 0 && diffMinutes <= targetWindowMinutes) {
          notifiedAdvanceIdsRef.current.add(booking.id);
          triggerAdvanceQueueAlert(booking, diffMinutes);
          break; // alert one at a time
        }
      }
    };

    const interval = setInterval(checkAdvanceQueues, 10000);
    return () => clearInterval(interval);
  }, [bookings, shopSettings.advanceNotificationEnabled, shopSettings.advanceNotificationMinutes, soundEnabled, shopSettings.advanceNotificationSound]);

  const applyDiscountCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BARBER50' || clean === 'NEWCUSTOMER' || clean === 'VIP50') {
      setDiscountCode(clean);
      setDiscountAmount(50);
      soundFx.playSuccess();
      return true;
    }
    return false;
  };

  // Loyalty Program Core Helpers (ระบบสะสมแต้ม 1 ครั้ง = 1 แต้ม, ครบ 10 แต้ม = ส่วนลด ฿150)
  const getCustomerLoyalty = (phone: string, custName?: string): CustomerLoyalty => {
    const key = normalizePhone(phone);
    if (!key) {
      return {
        phone: '',
        displayPhone: phone,
        customerName: custName || 'ลูกค้าทั่วไป',
        points: 0,
        lifetimePoints: 0,
        totalVisits: 0,
        redeemedRewardsCount: 0,
        history: [],
        updatedAt: new Date().toISOString(),
      };
    }

    const existing = loyaltyRecords[key];
    if (existing) {
      if (custName && custName !== 'ลูกค้าทั่วไป' && existing.customerName !== custName) {
        return { ...existing, customerName: custName };
      }
      return existing;
    }

    return {
      phone: key,
      displayPhone: formatPhone(phone),
      customerName: custName || 'ลูกค้าทั่วไป',
      points: 0,
      lifetimePoints: 0,
      totalVisits: 0,
      redeemedRewardsCount: 0,
      history: [],
      updatedAt: new Date().toISOString(),
    };
  };

  const awardLoyaltyPoints = (
    phone: string,
    pointsToAward: number,
    description: string,
    bookingId?: string
  ) => {
    const key = normalizePhone(phone);
    if (!key) return;

    setLoyaltyRecords((prev) => {
      const current = prev[key] || {
        phone: key,
        displayPhone: formatPhone(phone),
        customerName: 'ลูกค้าประจำ',
        points: 0,
        lifetimePoints: 0,
        totalVisits: 0,
        redeemedRewardsCount: 0,
        history: [],
        updatedAt: new Date().toISOString(),
      };

      const nowStr = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const newHistoryItem = {
        id: `lh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: nowStr,
        type: 'earn' as const,
        points: pointsToAward,
        description,
        bookingId,
      };

      const updatedRecord: CustomerLoyalty = {
        ...current,
        points: current.points + pointsToAward,
        lifetimePoints: current.lifetimePoints + pointsToAward,
        totalVisits: current.totalVisits + 1,
        history: [...current.history, newHistoryItem],
        updatedAt: nowStr,
      };

      saveLoyaltyRecordToFirestore(key, updatedRecord).catch(console.error);

      return {
        ...prev,
        [key]: updatedRecord,
      };
    });
  };

  const redeemLoyaltyReward = (
    phone: string,
    custName?: string,
    bookingId?: string
  ): boolean => {
    const key = normalizePhone(phone);
    if (!key) return false;

    const current = loyaltyRecords[key];
    const pointsReq = shopSettings.loyaltyPointsRequired || 10;
    if (!current || current.points < pointsReq) return false;

    setLoyaltyRecords((prev) => {
      const target = prev[key] || current;
      const nowStr = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const newHistoryItem = {
        id: `lh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: nowStr,
        type: 'redeem' as const,
        points: -pointsReq,
        description: `ใช้ ${pointsReq} แต้ม แลกรับ${shopSettings.loyaltyRewardTitle || 'ส่วนลดพิเศษ ฿150'}`,
        bookingId,
      };

      const updatedRecord: CustomerLoyalty = {
        ...target,
        customerName: custName || target.customerName,
        points: target.points - pointsReq,
        redeemedRewardsCount: (target.redeemedRewardsCount || 0) + 1,
        history: [...target.history, newHistoryItem],
        updatedAt: nowStr,
      };

      saveLoyaltyRecordToFirestore(key, updatedRecord).catch(console.error);

      return {
        ...prev,
        [key]: updatedRecord,
      };
    });
    return true;
  };

  const updateLoyaltyPointsManual = (
    phone: string,
    newPoints: number,
    note: string
  ) => {
    const key = normalizePhone(phone);
    if (!key) return;

    setLoyaltyRecords((prev) => {
      const current = prev[key] || {
        phone: key,
        displayPhone: formatPhone(phone),
        customerName: 'ลูกค้าประจำ',
        points: 0,
        lifetimePoints: 0,
        totalVisits: 0,
        redeemedRewardsCount: 0,
        history: [],
        updatedAt: new Date().toISOString(),
      };

      const diff = newPoints - current.points;
      const nowStr = new Date().toLocaleDateString('th-TH') + ' ' + new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const actionType: 'bonus' | 'adjustment' = diff >= 0 ? 'bonus' : 'adjustment';
      const newHistoryItem: LoyaltyHistoryItem = {
        id: `lh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: nowStr,
        type: actionType,
        points: diff,
        description: note || `ปรับแก้แต้มโดยผู้จัดการร้าน (${newPoints} แต้ม)`,
      };

      const updatedRecord: CustomerLoyalty = {
        ...current,
        points: Math.max(0, newPoints),
        lifetimePoints: diff > 0 ? current.lifetimePoints + diff : current.lifetimePoints,
        history: [...current.history, newHistoryItem],
        updatedAt: nowStr,
      };

      saveLoyaltyRecordToFirestore(key, updatedRecord).catch(console.error);

      return {
        ...prev,
        [key]: updatedRecord,
      };
    });
  };

  const createBookingAndPay = (): Booking => {
    const barber = barbers.find((b) => b.id === selectedBarberId) || barbers[0];
    const service = selectedService || services[0];
    const totalPrice = service.price;

    // Loyalty points deduction check
    const pointsReq = shopSettings.loyaltyPointsRequired || 10;
    const loyaltyDiscountVal = shopSettings.loyaltyRewardDiscount || 150;
    const currentCustLoyalty = getCustomerLoyalty(customerPhone, customerName);
    const canApplyLoyalty = isRedeemingLoyalty && currentCustLoyalty.points >= pointsReq;
    const effectiveLoyaltyDiscount = canApplyLoyalty ? loyaltyDiscountVal : 0;

    const totalDiscount = discountAmount + effectiveLoyaltyDiscount;
    const finalPrice = Math.max(0, totalPrice - totalDiscount);

    const isNoDeposit = paymentOption === 'no_deposit';
    const isDeposit = paymentOption === 'deposit_50';
    const depositPct = shopSettings.depositPercentage ?? 50;
    const amountPaid = isNoDeposit ? 0 : isDeposit ? Math.round(finalPrice * (depositPct / 100)) : finalPrice;
    const amountRemaining = finalPrice - amountPaid;

    // Commission Calculation
    const commRate = barber.commissionRate ?? shopSettings.defaultCommissionRate;
    const barberCommissionEarned = Math.round((finalPrice * commRate) / 100);
    const shopRevenueShare = finalPrice - barberCommissionEarned;

    const nextNumber = bookings.length + 1;
    const queueNumber = `BQ-${nextNumber.toString().padStart(3, '0')}`;
    const bookingId = `bk-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const refNum = isNoDeposit
      ? `ND-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
      : paymentMethod === 'promptpay'
      ? `PP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`
      : `CC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      id: bookingId,
      queueNumber,
      customerName: customerName || 'ลูกค้าทั่วไป',
      customerPhone: customerPhone || '08x-xxx-xxxx',
      customerNotes,
      barberId: barber.id,
      barber,
      service,
      bookingDate: selectedDate,
      bookingTimeSlot: selectedTimeSlot,
      durationMinutes: service.durationMinutes,
      totalServicePrice: totalPrice,
      discountAmount: totalDiscount,
      finalTotalPrice: finalPrice,
      paymentOption,
      amountPaid,
      amountRemaining,
      paymentMethod,
      paymentRefNumber: refNum,
      paidAt: isNoDeposit ? `${selectedDate} (ชำระหน้าร้าน)` : `${selectedDate} ${nowTime}`,
      status: 'CONFIRMED',
      statusUpdatedAt: `${selectedDate} ${nowTime}`,
      commissionRate: commRate,
      barberCommissionEarned,
      shopRevenueShare,
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: canApplyLoyalty ? pointsReq : 0,
      isLoyaltyRewardApplied: canApplyLoyalty,
      timeline: [
        {
          status: 'CONFIRMED',
          label: isNoDeposit
            ? `จองคิวสำเร็จ (ไม่มีมัดจำ / ชำระหน้าร้าน ฿${amountRemaining.toLocaleString()})`
            : isDeposit
            ? `ชำระมัดจำ ${depositPct}% ล่วงหน้าสำเร็จ (฿${amountPaid.toLocaleString()})`
            : `ชำระเต็มจำนวน 100% เรียบร้อย (฿${amountPaid.toLocaleString()})`,
          timestamp: nowTime,
          note: canApplyLoyalty
            ? `🎉 ใช้สิทธิ์สะสมครบ ${pointsReq} แต้ม รับส่วนลดพิเศษ ฿${loyaltyDiscountVal}`
            : isNoDeposit
            ? `ชำระหน้าร้านเต็มจำนวนเมื่อตัดเสร็จ: ฿${amountRemaining.toLocaleString()}`
            : isDeposit
            ? `ยอดคงเหลือชำระหน้าร้าน: ฿${amountRemaining.toLocaleString()}`
            : 'ชำระครบถ้วนแล้ว',
        },
      ],
    };

    // If loyalty reward was applied, redeem the 10 points now
    if (canApplyLoyalty) {
      redeemLoyaltyReward(customerPhone, customerName, bookingId);
      setIsRedeemingLoyalty(false);
    }

    setBookings((prev) => [newBooking, ...prev]);
    setActiveBookingIdState(bookingId);
    saveBookingToFirestore(newBooking).catch(console.error);

    // Auto-record Income Transaction if upfront payment was made
    if (amountPaid > 0) {
      const autoIncomeTx: TransactionItem = {
        id: `tx-${Date.now()}`,
        type: 'income',
        category: isDeposit ? 'deposit_online' : 'service_cut',
        categoryLabel: isDeposit ? `เงินมัดจำออนไลน์ ${depositPct}%` : 'บริการตัดผม & เซ็ต (100%)',
        amount: amountPaid,
        date: selectedDate,
        time: nowTime,
        description: `คิว ${queueNumber} (${newBooking.customerName}) - บริการ ${service.name} โดย${barber.name}`,
        barberId: barber.id,
        barberName: barber.name,
        bookingId: bookingId,
        paymentMethod: paymentMethod,
        referenceNumber: refNum,
        isAutoGenerated: true,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [autoIncomeTx, ...prev]);
      saveTransactionToFirestore(autoIncomeTx).catch(console.error);
    }
    
    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#3b82f6', '#10b981', '#f43f5e'],
      });
    } catch {
      // Ignore
    }

    soundFx.playSuccess();
    addNotification(
      `🎉 จองคิว ${queueNumber} สำเร็จแล้ว!`,
      `${newBooking.customerName} จอง ${barber.nickname} เวลา ${selectedTimeSlot} น. (${isNoDeposit ? 'ไม่มีมัดจำ / ชำระหน้าร้าน' : `มัดจำ ฿${amountPaid}`} / คอมมิชชั่นช่าง ${commRate}%: ฿${barberCommissionEarned})`,
      'success',
      bookingId
    );

    return newBooking;
  };

  const createWalkInBooking = (params: CreateWalkInParams): Booking => {
    // Determine target barber: if 'auto', choose active barber with lowest non-completed bookings
    let targetBarber: Barber;
    if (params.barberId === 'auto') {
      const activeBarbers = barbers.filter((b) => b.isActive !== false);
      const candidates = activeBarbers.length > 0 ? activeBarbers : barbers;
      const counts = candidates.map((b) => {
        const queueCount = bookings.filter(
          (bk) =>
            bk.barberId === b.id &&
            bk.status !== 'COMPLETED' &&
            bk.status !== 'CANCELLED'
        ).length;
        return { barber: b, count: queueCount };
      });
      counts.sort((a, b) => a.count - b.count);
      targetBarber = counts[0].barber;
    } else {
      targetBarber = barbers.find((b) => b.id === params.barberId) || barbers[0];
    }

    const service = services.find((s) => s.id === params.serviceId) || services[0];
    const finalPrice = service.price;
    const isPaidNow = params.isPaidNow;
    const amountPaid = isPaidNow ? finalPrice : 0;
    const amountRemaining = isPaidNow ? 0 : finalPrice;

    // Commission Calculation
    const commRate = targetBarber.commissionRate ?? shopSettings.defaultCommissionRate;
    const barberCommissionEarned = Math.round((finalPrice * commRate) / 100);
    const shopRevenueShare = finalPrice - barberCommissionEarned;

    const nextNumber = bookings.length + 1;
    const queueNumber = `WK-${nextNumber.toString().padStart(3, '0')}`;
    const bookingId = `bk-walkin-${Date.now()}`;
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const refNum = `WK-${todayStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBooking: Booking = {
      id: bookingId,
      queueNumber,
      customerName: params.customerName?.trim() || `ลูกค้า Walk-in #${nextNumber}`,
      customerPhone: params.customerPhone?.trim() || 'หน้าร้าน',
      customerNotes: params.customerNotes,
      barberId: targetBarber.id,
      barber: targetBarber,
      service,
      bookingDate: todayStr,
      bookingTimeSlot: nowTime,
      durationMinutes: service.durationMinutes,
      totalServicePrice: finalPrice,
      discountAmount: 0,
      finalTotalPrice: finalPrice,
      paymentOption: isPaidNow ? 'full_100' : 'no_deposit',
      amountPaid,
      amountRemaining,
      paymentMethod: params.paymentMethod,
      paymentRefNumber: refNum,
      paidAt: isPaidNow ? `${todayStr} ${nowTime} (ชำระทันทีที่เคาน์เตอร์)` : `${todayStr} (รอชำระหลังบริการ)`,
      status: 'CONFIRMED',
      statusUpdatedAt: `${todayStr} ${nowTime}`,
      commissionRate: commRate,
      barberCommissionEarned,
      shopRevenueShare,
      isWalkIn: true,
      walkInTicketIssuedAt: `${todayStr} ${nowTime}`,
      timeline: [
        {
          status: 'CONFIRMED',
          label: isPaidNow
            ? `ออกบัตรคิว Walk-in (ชำระที่เคาน์เตอร์ ฿${amountPaid.toLocaleString()})`
            : `ออกบัตรคิว Walk-in ด่วน (รอชำระหลังตัด ฿${finalPrice.toLocaleString()})`,
          timestamp: nowTime,
          note: `ประเภท: Walk-in ลูกค้าหน้าร้าน • โต๊ะเก้าอี้ #${targetBarber.chairNumber}`,
        },
      ],
    };

    setBookings((prev) => [newBooking, ...prev]);
    setActiveBookingIdState(bookingId);
    saveBookingToFirestore(newBooking).catch(console.error);

    // If paid immediately at counter, record income transaction
    if (amountPaid > 0) {
      const autoIncomeTx: TransactionItem = {
        id: `tx-walkin-${Date.now()}`,
        type: 'income',
        category: 'service_cut',
        categoryLabel: 'บริการตัดผม Walk-in หน้าร้าน',
        amount: amountPaid,
        date: todayStr,
        time: nowTime,
        description: `คิว Walk-in ${queueNumber} (${newBooking.customerName}) - บริการ ${service.name} โดย${targetBarber.name}`,
        barberId: targetBarber.id,
        barberName: targetBarber.name,
        bookingId: bookingId,
        paymentMethod: params.paymentMethod,
        referenceNumber: refNum,
        isAutoGenerated: true,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [autoIncomeTx, ...prev]);
      saveTransactionToFirestore(autoIncomeTx).catch(console.error);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#8b5cf6', '#f59e0b', '#10b981'],
      });
    } catch {
      // Ignore
    }

    soundFx.playSuccess();
    addNotification(
      `🚶 ออกบัตรคิว Walk-in ${queueNumber} สำเร็จ!`,
      `${newBooking.customerName} เข้าคิว ${targetBarber.nickname} (เก้าอี้ #${targetBarber.chairNumber}) • ${isPaidNow ? 'ชำระแล้ว' : 'รอชำระหลังบริการ'}`,
      'success',
      bookingId
    );

    return newBooking;
  };

  const updateBookingStatus = (bookingId: string, newStatus: BookingStatus, customNote?: string) => {
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    
    let statusLabel = '';
    switch (newStatus) {
      case 'CONFIRMED':
        statusLabel = 'ยืนยันคิวเรียบร้อย';
        break;
      case 'BARBER_PREPARING':
        statusLabel = 'ช่างเตรียมเก้าอี้และอุปกรณ์พร้อม';
        break;
      case 'IN_PROGRESS':
        statusLabel = 'กำลังให้บริการตัดผม';
        break;
      case 'COMPLETED':
        statusLabel = 'ให้บริการเสร็จสิ้น ขอบคุณที่ใช้บริการ';
        break;
      case 'CANCELLED':
        statusLabel = 'ยกเลิกการจอง';
        break;
      default:
        statusLabel = 'อัปเดตสถานะ';
    }

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        const updatedTimeline = [
          ...b.timeline,
          {
            status: newStatus,
            label: customNote || statusLabel,
            timestamp: nowTime,
          },
        ];
        const updatedBooking: Booking = {
          ...b,
          status: newStatus,
          statusUpdatedAt: `${b.bookingDate} ${nowTime}`,
          timeline: updatedTimeline,
        };
        saveBookingToFirestore(updatedBooking).catch(console.error);
        return updatedBooking;
      })
    );

    const target = bookings.find((b) => b.id === bookingId);
    if (target) {
      // If completed and not already registered commission payout / remaining collection
      if (newStatus === 'COMPLETED' && target.status !== 'COMPLETED') {
        const newTxList: TransactionItem[] = [];
        
        // 1. If remaining balance was due at shop, record remaining income
        if (target.amountRemaining > 0) {
          const isNoDep = target.paymentOption === 'no_deposit';
          newTxList.push({
            id: `tx-${Date.now()}-rem`,
            type: 'income',
            category: 'service_cut',
            categoryLabel: isNoDep
              ? 'ชำระค่าบริการหน้าร้าน 100% (ไม่มีมัดจำ)'
              : 'ชำระส่วนที่เหลือหน้าร้าน 50%',
            amount: target.amountRemaining,
            date: target.bookingDate || new Date().toISOString().split('T')[0],
            time: nowTime,
            description: `รับชำระ${isNoDep ? 'ค่าบริการเต็มจำนวน' : 'ส่วนที่เหลือ'}คิว ${target.queueNumber} (${target.customerName})`,
            barberId: target.barberId,
            barberName: target.barber?.name || target.barber?.nickname,
            bookingId: target.id,
            paymentMethod: target.paymentMethod || 'promptpay',
            referenceNumber: `REC-${target.queueNumber}`,
            isAutoGenerated: true,
            createdAt: new Date().toISOString(),
          });
        }

        // 2. Record barber commission expense payout
        if (target.barberCommissionEarned > 0) {
          newTxList.push({
            id: `tx-${Date.now()}-comm`,
            type: 'expense',
            category: 'barber_commission',
            categoryLabel: `ค่าคอมมิชชั่นช่าง (${target.commissionRate || 60}%)`,
            amount: target.barberCommissionEarned,
            date: target.bookingDate || new Date().toISOString().split('T')[0],
            time: nowTime,
            description: `จ่ายค่าคอมมิชชั่น ${target.barber?.nickname || target.barberId} จากคิว ${target.queueNumber}`,
            barberId: target.barberId,
            barberName: target.barber?.name || target.barber?.nickname,
            bookingId: target.id,
            paymentMethod: 'transfer',
            referenceNumber: `COMM-${target.queueNumber}`,
            isAutoGenerated: true,
            createdAt: new Date().toISOString(),
          });
        }

        if (newTxList.length > 0) {
          setTransactions((prev) => [...newTxList, ...prev]);
          newTxList.forEach((tx) => saveTransactionToFirestore(tx).catch(console.error));
        }

        // 3. Award Loyalty Points (ทุกการตัดผม 1 ครั้ง = 1 แต้ม)
        if (!target.loyaltyPointsEarned) {
          const ptsPerCut = shopSettings.loyaltyPointsPerCut || 1;
          awardLoyaltyPoints(
            target.customerPhone,
            ptsPerCut,
            `สะสม ${ptsPerCut} แต้มจากการตัดผมคิว ${target.queueNumber} (${target.service.name})`,
            target.id
          );

          // Update booking loyaltyPointsEarned
          setBookings((prev) =>
            prev.map((item) =>
              item.id === target.id ? { ...item, loyaltyPointsEarned: ptsPerCut } : item
            )
          );

          // Confetti celebration
          try {
            confetti({
              particleCount: 60,
              spread: 60,
              origin: { y: 0.65 },
              colors: ['#f59e0b', '#10b981', '#fbbf24', '#ffffff'],
            });
          } catch {
            // Ignored
          }

          soundFx.playSuccess();
          addNotification(
            `⭐ คุณ ${target.customerName} ได้รับ +${ptsPerCut} แต้มสะสม!`,
            `สะสมแต้มสำเร็จจากการตัดผมคิว ${target.queueNumber} (ครบ 10 แต้มรับส่วนลดพิเศษ ฿${shopSettings.loyaltyRewardDiscount || 150})`,
            'success',
            bookingId
          );
        }
      }

      addNotification(
        `✂️ อัปเดตคิว ${target.queueNumber}: ${statusLabel}`,
        `ช่าง ${target.barber.nickname} - ${customNote || statusLabel}`,
        'status_change',
        bookingId
      );
    }
  };

  // Accounting & Transaction Methods
  const addTransaction = (txData: Omit<TransactionItem, 'id' | 'createdAt'>) => {
    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      ...txData,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    saveTransactionToFirestore(newTx).catch(console.error);
    soundFx.playSuccess();
    addNotification(
      `💵 บันทึก${txData.type === 'income' ? 'รายรับ' : 'รายจ่าย'}สำเร็จ`,
      `${txData.categoryLabel}: ฿${txData.amount.toLocaleString()} (${txData.description})`,
      'info'
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    deleteTransactionFromFirestore(id).catch(console.error);
    soundFx.playNotification();
  };

  const updateTransaction = (id: string, updates: Partial<TransactionItem>) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          saveTransactionToFirestore(updated).catch(console.error);
          return updated;
        }
        return t;
      })
    );
    soundFx.playSuccess();
  };

  const resetTransactions = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    soundFx.playNotification();
  };

  const cancelBooking = (bookingId: string) => {
    updateBookingStatus(bookingId, 'CANCELLED', 'ลูกค้ายกเลิกการจองคิว');
    soundFx.playNotification();
  };

  const deleteBooking = (bookingId: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    deleteBookingFromFirestore(bookingId).catch(console.error);
    soundFx.playNotification();
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Quick simulation helper to progress the current active booking through stages
  const simulateNextQueueEvent = () => {
    if (!activeBooking) return;
    const flow: BookingStatus[] = ['CONFIRMED', 'BARBER_PREPARING', 'IN_PROGRESS', 'COMPLETED'];
    const currentIndex = flow.indexOf(activeBooking.status);
    let nextStatus: BookingStatus = 'CONFIRMED';
    let note = '';
    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
      nextStatus = flow[currentIndex + 1];
    } else {
      nextStatus = 'CONFIRMED';
      note = 'เริ่มจำลองรอบคิวใหม่';
    }
    soundFx.playNotification();
    updateBookingStatus(activeBooking.id, nextStatus, note);
  };

  // Admin & Settings Methods
  const updateBarberCommissionRate = (barberId: BarberId, newRate: number) => {
    setBarbers((prev) =>
      prev.map((barber) => {
        if (barber.id === barberId) {
          const updated = { ...barber, commissionRate: newRate };
          saveBarberToFirestore(updated).catch(console.error);
          return updated;
        }
        return barber;
      })
    );
    // Also update future calculations in bookings if needed or add alert
    soundFx.playSuccess();
    addNotification(
      '⚙️ ปรับอัตราค่าคอมมิชชั่นช่างเรียบร้อย',
      `ตั้งค่าคอมมิชชั่นของช่างเป็น ${newRate}%`,
      'info'
    );
  };

  const updateBarberProfile = (barberId: BarberId, updates: Partial<Barber>) => {
    setBarbers((prev) =>
      prev.map((b) => {
        if (b.id === barberId) {
          const updated = { ...b, ...updates };
          saveBarberToFirestore(updated).catch(console.error);
          return updated;
        }
        return b;
      })
    );
    soundFx.playSuccess();
  };

  const toggleBarberActiveStatus = (barberId: BarberId) => {
    const current = barbers.find((b) => b.id === barberId);
    const newStatus = current?.isActive === false ? true : false;

    setBarbers((prev) =>
      prev.map((b) => {
        if (b.id === barberId) {
          const updated = { ...b, isActive: newStatus };
          saveBarberToFirestore(updated).catch(console.error);
          return updated;
        }
        return b;
      })
    );

    // If current barber in booking form is closed, switch to first available active barber
    if (!newStatus && selectedBarberId === barberId) {
      const remainingActive = barbers.filter((b) => b.id !== barberId && b.isActive !== false);
      if (remainingActive.length > 0) {
        setSelectedBarberId(remainingActive[0].id);
      }
    }

    soundFx.playSuccess();
    addNotification(
      newStatus ? `🟢 เปิดรับคิว: ${current?.nickname}` : `🔴 ปิดรับคิว: ${current?.nickname}`,
      newStatus
        ? `ช่าง ${current?.name} พร้อมเปิดรับคิวลูกค้าตามปกติ`
        : `ช่าง ${current?.name} ปิดรับคิวชั่วคราว (พักงาน/ลาหยุด/งดรับคิว)`,
      'info'
    );
  };

  const updateService = (serviceId: string, updates: Partial<Service>) => {
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, ...updates } : s))
    );
    soundFx.playSuccess();
  };

  const addService = (newServiceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      id: `srv-${Date.now()}`,
      ...newServiceData,
    };
    setServices((prev) => [...prev, newService]);
    soundFx.playSuccess();
  };

  const deleteService = (serviceId: string) => {
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    soundFx.playNotification();
  };

  const updateShopSettings = (settingsUpdates: Partial<ShopSettings>) => {
    const updated = { ...shopSettings, ...settingsUpdates };
    setShopSettings(updated);
    saveShopSettingsToFirestore(updated).catch(console.error);
    soundFx.playSuccess();
    addNotification(
      '💾 บันทึกการตั้งค่าร้านค้าสำเร็จ',
      'ข้อมูลร้านและระบบหลังบ้านได้รับการอัปเดตเรียบร้อย',
      'info'
    );
  };

  const resetAllSettings = () => {
    setBarbers(BARBERS);
    setServices(SERVICES);
    setShopSettings(DEFAULT_SHOP_SETTINGS);
    setBookings(initialSampleBookings);
    soundFx.playNotification();
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        activeBooking,
        notifications,
        unreadCount,
        soundEnabled,
        activeTab,
        barbers,
        services,
        shopSettings,
        transactions,
        selectedBarberId,
        selectedService,
        selectedDate,
        selectedTimeSlot,
        customerName,
        customerPhone,
        customerNotes,
        paymentOption,
        paymentMethod,
        discountCode,
        discountAmount,
        loyaltyRecords,
        isRedeemingLoyalty,
        setIsRedeemingLoyalty,
        getCustomerLoyalty,
        awardLoyaltyPoints,
        redeemLoyaltyReward,
        updateLoyaltyPointsManual,
        isAdminUnlocked,
        unlockAdminWithPin,
        lockAdmin,
        updateAdminPin,
        togglePinLock,
        advanceAlertData,
        dismissAdvanceAlert,
        triggerAdvanceQueueAlert,
        setActiveTab,
        setSelectedBarberId,
        setSelectedService,
        setSelectedDate,
        setSelectedTimeSlot,
        setCustomerName,
        setCustomerPhone,
        setCustomerNotes,
        setPaymentOption,
        setPaymentMethod,
        setSoundEnabled,
        applyDiscountCode,
        createBookingAndPay,
        createWalkInBooking,
        updateBookingStatus,
        cancelBooking,
        deleteBooking,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        setActiveBookingId,
        simulateNextQueueEvent,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        resetTransactions,
        updateBarberCommissionRate,
        updateBarberProfile,
        toggleBarberActiveStatus,
        updateService,
        addService,
        deleteService,
        updateShopSettings,
        resetAllSettings,
        firebaseStatus,
        firebaseProjectId,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

