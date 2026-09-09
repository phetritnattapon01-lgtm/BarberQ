import { CustomerLoyalty } from '../types';

export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const formatPhone = (phone: string): string => {
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return phone;
};

export const INITIAL_LOYALTY_CUSTOMERS: Record<string, CustomerLoyalty> = {
  '0891234567': {
    phone: '0891234567',
    displayPhone: '089-123-4567',
    customerName: 'ณัฐพล (นัท)',
    points: 9,
    lifetimePoints: 9,
    totalVisits: 9,
    redeemedRewardsCount: 0,
    history: [
      {
        id: 'lh-1',
        date: '2026-08-20 14:30',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม (ตัดผม Fade & Undercut)',
      },
      {
        id: 'lh-2',
        date: '2026-09-02 11:00',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม (เซ็ตผม & ตัดแต่งเครา)',
      },
    ],
    updatedAt: '2026-09-02 11:45',
  },
  '0812345678': {
    phone: '0812345678',
    displayPhone: '081-234-5678',
    customerName: 'สมชาย ใจดี',
    points: 10,
    lifetimePoints: 10,
    totalVisits: 10,
    redeemedRewardsCount: 0,
    history: [
      {
        id: 'lh-3',
        date: '2026-08-15 16:00',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม (Classic Gentlemen Cut)',
      },
      {
        id: 'lh-4',
        date: '2026-09-01 15:30',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม ครบ 10 แต้ม พร้อมแลกรับสิทธิ์ส่วนลดพิเศษ',
      },
    ],
    updatedAt: '2026-09-01 16:15',
  },
  '0823456789': {
    phone: '0823456789',
    displayPhone: '082-345-6789',
    customerName: 'วิศรุต (กอล์ฟ)',
    points: 4,
    lifetimePoints: 4,
    totalVisits: 4,
    redeemedRewardsCount: 0,
    history: [
      {
        id: 'lh-5',
        date: '2026-08-28 13:00',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม (สระ-ตัด-เซ็ตพรีเมียม)',
      },
    ],
    updatedAt: '2026-08-28 13:45',
  },
  '0869998877': {
    phone: '0869998877',
    displayPhone: '086-999-8877',
    customerName: 'ธนภัทร',
    points: 2,
    lifetimePoints: 12,
    totalVisits: 12,
    redeemedRewardsCount: 1,
    history: [
      {
        id: 'lh-6',
        date: '2026-08-10 17:00',
        type: 'redeem',
        points: -10,
        description: 'แลกรับส่วนลดพิเศษ ฿150 (ครบ 10 แต้ม)',
      },
      {
        id: 'lh-7',
        date: '2026-08-25 15:00',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม (ตัดผมสไตล์เกาหลี)',
      },
      {
        id: 'lh-8',
        date: '2026-09-05 14:00',
        type: 'earn',
        points: 1,
        description: 'สะสม 1 แต้ม (สระเซ็ตผม)',
      },
    ],
    updatedAt: '2026-09-05 14:45',
  },
};
