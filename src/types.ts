export type BarberId = 'barber-top' | 'barber-bass' | 'barber-ake';

export interface Barber {
  id: BarberId;
  name: string;
  nickname: string;
  title: string;
  experienceYears: number;
  rating: number;
  reviewCount: number;
  specialty: string[];
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  chairNumber: number;
  availableDays: string[];
  workingHours: string;
  completedCuts: number;
  badge: string;
  accentColor: string;
  commissionRate: number; // Commission % e.g., 60 = 60%
  baseMonthlySalary?: number;
  isActive?: boolean;
}

export type ServiceCategory = 'haircut' | 'shave' | 'color_perm' | 'package';

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  durationMinutes: number;
  description: string;
  popular?: boolean;
  tag?: string;
  isActive?: boolean;
}

export type PaymentOption = 'no_deposit' | 'deposit_50' | 'full_100';
export type PaymentMethodType = 'promptpay' | 'credit_card' | 'cash';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'BARBER_PREPARING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Booking {
  id: string;
  queueNumber: string; // e.g., "BQ-042"
  customerName: string;
  customerPhone: string;
  customerNotes?: string;
  barberId: BarberId;
  barber: Barber;
  service: Service;
  additionalServices?: Service[];
  bookingDate: string; // YYYY-MM-DD
  bookingTimeSlot: string; // e.g., "14:00"
  durationMinutes: number;
  totalServicePrice: number;
  discountAmount: number;
  finalTotalPrice: number;
  paymentOption: PaymentOption;
  amountPaid: number; // 50% or 100%
  amountRemaining: number; // 50% or 0
  paymentMethod: PaymentMethodType;
  paymentRefNumber: string;
  paidAt: string;
  status: BookingStatus;
  statusUpdatedAt: string;
  commissionRate: number; // % commission for barber on this cut
  barberCommissionEarned: number; // ฿ calculated commission
  shopRevenueShare: number; // ฿ shop portion
  isWalkIn?: boolean;
  walkInTicketIssuedAt?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  isLoyaltyRewardApplied?: boolean;
  timeline: {
    status: BookingStatus;
    label: string;
    timestamp: string;
    note?: string;
  }[];
}

export interface CreateWalkInParams {
  customerName?: string;
  customerPhone?: string;
  barberId: BarberId | 'auto';
  serviceId: string;
  paymentMethod: PaymentMethodType;
  isPaidNow: boolean;
  customerNotes?: string;
}

export interface AppNotification {
  id: string;
  bookingId?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'status_change';
  timestamp: string;
  read: boolean;
}

export interface ShopSettings {
  shopName: string;
  branchName: string;
  taxId: string;
  phone: string;
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  depositPercentage: number; // e.g., 50
  promptPayNumber: string;
  promptPayName: string;
  promptPayQrImage?: string; // Base64 data URL or image URL for custom PromptPay QR
  autoConfirmDeposit: boolean;
  defaultCommissionRate: number; // e.g. 60
  currencySymbol: string;
  adminPin?: string; // 4-digit PIN for locking accounting and admin settings
  pinLockEnabled?: boolean;

  // Advance Queue Notification Settings (แจ้งเตือนคิวล่วงหน้า)
  advanceNotificationEnabled?: boolean;
  advanceNotificationMinutes?: number; // e.g., 15 (minutes before queue time)
  advanceNotificationType?: 'toast' | 'popup' | 'both';
  advanceNotificationSound?: boolean;

  // Loyalty Program Settings (ระบบสะสมแต้ม)
  loyaltyEnabled?: boolean;
  loyaltyPointsPerCut?: number; // default 1 (ตัด 1 ครั้งได้ 1 แต้ม)
  loyaltyPointsRequired?: number; // default 10 (ครบ 10 แต้ม)
  loyaltyRewardDiscount?: number; // default 150 (ส่วนลด ฿150)
  loyaltyRewardTitle?: string; // default "ส่วนลดพิเศษ ฿150 (ครบ 10 แต้ม)"
}

export interface LoyaltyHistoryItem {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  type: 'earn' | 'redeem' | 'bonus' | 'adjustment';
  points: number; // +1 or -10
  description: string;
  bookingId?: string;
}

export interface CustomerLoyalty {
  phone: string; // Normalized phone key
  displayPhone: string;
  customerName: string;
  points: number; // Current available points (0 - 10+)
  lifetimePoints: number; // Total points earned ever
  totalVisits: number; // Total completed cuts
  redeemedRewardsCount: number; // Times redeemed 10-point reward
  history: LoyaltyHistoryItem[];
  updatedAt: string;
}

export type ActiveTab = 'book' | 'live_queue' | 'barber_panel' | 'accounting' | 'history' | 'settings';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'service_cut' // รายได้ค่าตัดผม
  | 'deposit_online' // มัดจำออนไลน์ 50%
  | 'product_sale' // จำหน่ายแว็กซ์/เจล/แชมพู
  | 'tip_other' // ทิป/รายรับอื่นๆ
  | 'barber_commission' // จ่ายค่าคอมมิชชั่นช่าง
  | 'salon_supplies' // ซื้อน้ำยา/แชมพู/ใบมีดโกน
  | 'utilities' // ค่าน้ำ/ค่าไฟ/ค่าเน็ต
  | 'shop_rent' // ค่าเช่าสถานที่
  | 'maintenance' // ค่าซ่อมบำรุงปัตตาเลี่ยน/เก้าอี้
  | 'hospitality' // เครื่องดื่ม/ของต้อนรับลูกค้า
  | 'marketing' // ยิงแอด/การตลาด
  | 'other_expense'; // รายจ่ายเบ็ดเตล็ด

export interface TransactionItem {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  categoryLabel: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  description: string;
  barberId?: BarberId;
  barberName?: string;
  bookingId?: string;
  paymentMethod?: 'promptpay' | 'credit_card' | 'cash' | 'transfer';
  referenceNumber?: string;
  isAutoGenerated?: boolean;
  createdAt: string;
}

export type AccountingPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

