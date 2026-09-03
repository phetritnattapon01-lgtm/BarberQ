import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Scissors,
  Coffee,
  Zap,
  Building,
  Wrench,
  Megaphone,
  ShoppingBag,
  Receipt,
  FileText,
  Printer,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  PieChart,
  BarChart3,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  CreditCard,
  QrCode,
  Banknote,
  Users,
  Lock,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useBooking } from '../context/BookingContext';
import {
  TransactionItem,
  TransactionType,
  TransactionCategory,
  AccountingPeriod,
  BarberId,
} from '../types';

interface NewTxFormData {
  type: TransactionType;
  category: TransactionCategory;
  categoryLabel: string;
  amount: number | '';
  date: string;
  time: string;
  description: string;
  barberId: BarberId | '';
  paymentMethod: 'promptpay' | 'credit_card' | 'cash' | 'transfer';
  referenceNumber: string;
}

const CATEGORY_OPTIONS: {
  id: TransactionCategory;
  label: string;
  type: TransactionType;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  // Income
  { id: 'service_cut', label: 'บริการตัดผม/ดัด/ทำสี', type: 'income', icon: Scissors },
  { id: 'deposit_online', label: 'มัดจำออนไลน์ 50%', type: 'income', icon: QrCode },
  { id: 'product_sale', label: 'ขายผลิตภัณฑ์/แว็กซ์/แชมพู', type: 'income', icon: ShoppingBag },
  { id: 'tip_other', label: 'ทิป & รายรับอื่นๆ', type: 'income', icon: DollarSign },

  // Expenses
  { id: 'barber_commission', label: 'ค่าคอมมิชชั่นช่างตัดผม', type: 'expense', icon: Users },
  { id: 'salon_supplies', label: 'น้ำยา & อุปกรณ์สิ้นเปลือง', type: 'expense', icon: Scissors },
  { id: 'utilities', label: 'ค่าน้ำ ค่าไฟ ค่าเน็ต', type: 'expense', icon: Zap },
  { id: 'shop_rent', label: 'ค่าเช่าสถานที่/ล็อกร้าน', type: 'expense', icon: Building },
  { id: 'maintenance', label: 'ซ่อมบำรุงปัตตาเลี่ยน/เก้าอี้', type: 'expense', icon: Wrench },
  { id: 'hospitality', label: 'เครื่องดื่ม/ของรับรองลูกค้า', type: 'expense', icon: Coffee },
  { id: 'marketing', label: 'ยิงแอด & การตลาดโซเชียล', type: 'expense', icon: Megaphone },
  { id: 'other_expense', label: 'รายจ่ายเบ็ดเตล็ด', type: 'expense', icon: Receipt },
];

export const AccountingView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    resetTransactions,
    barbers,
    shopSettings,
    lockAdmin,
    setActiveTab,
  } = useBooking();

  // Period State
  const [period, setPeriod] = useState<AccountingPeriod>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Filter State
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'commission'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add_income' | 'add_expense'>('add_income');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportingImg, setIsExportingImg] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [reportToast, setReportToast] = useState<string | null>(null);
  const printReportRef = useRef<HTMLDivElement>(null);

  const handlePrintReport = () => {
    const content = printReportRef.current?.innerHTML;
    if (!content) {
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
            <title>รายงานงบการเงิน - ${shopSettings.shopName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #18181b; }
              .header { border-bottom: 2px solid #18181b; padding-bottom: 12px; display: flex; justify-content: space-between; }
              .summary-box { background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px; margin-top: 16px; }
              .net-profit { background: #09090b; color: #ffffff; border-radius: 12px; padding: 16px; margin-top: 16px; display: flex; justify-content: space-between; }
            </style>
          </head>
          <body>
            ${content}
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
      setReportToast('🖨️ สั่งพิมพ์รายงานเรียบร้อย');
      setTimeout(() => setReportToast(null), 3000);
    } else {
      window.print();
    }
  };

  const handleDownloadReportPNG = async () => {
    if (!printReportRef.current) return;
    setIsExportingImg(true);

    try {
      const canvas = await html2canvas(printReportRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `Financial-Report-${period}-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setReportToast('💾 บันทึกรูปรายงานการเงิน (PNG) สำเร็จแล้ว!');
      setTimeout(() => setReportToast(null), 3500);
    } catch (err) {
      console.error('Error generating report image:', err);
    } finally {
      setIsExportingImg(false);
    }
  };

  const handleCopyReportSummary = async () => {
    const text = `📊 สรุปงบการเงิน ${shopSettings.shopName} (${getPeriodLabel()})
---------------------------------------
รายรับทั้งหมด: ฿${metrics.totalIncome.toLocaleString()} (ตัดผม: ฿${metrics.serviceIncome.toLocaleString()} / ผลิตภัณฑ์: ฿${metrics.productIncome.toLocaleString()})
รายจ่ายทั้งหมด: ฿${metrics.totalExpense.toLocaleString()} (คอมมิชชั่นช่าง: ฿${metrics.commissionExpense.toLocaleString()})
กำไรสุทธิคงเหลือ: ฿${metrics.netProfit.toLocaleString()} (Profit Margin: ${metrics.profitMargin}%)
วันที่ออกรายงาน: ${new Date().toLocaleString('th-TH')}
---------------------------------------`;
    try {
      await navigator.clipboard.writeText(text);
      setReportCopied(true);
      setReportToast('📋 คัดลอกสรุปงบการเงินแล้ว');
      setTimeout(() => {
        setReportCopied(false);
        setReportToast(null);
      }, 3000);
    } catch {}
  };

  // Form State
  const [formData, setFormData] = useState<NewTxFormData>({
    type: 'income',
    category: 'service_cut',
    categoryLabel: 'บริการตัดผม/ดัด/ทำสี',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    description: '',
    barberId: '',
    paymentMethod: 'promptpay',
    referenceNumber: '',
  });

  // Calculate Date Ranges
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filtered Transactions by Time Period
  const periodFilteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (period === 'daily') {
        return tx.date === selectedDate;
      }

      if (period === 'weekly') {
        // Last 7 days from selectedDate or today
        const target = new Date(selectedDate);
        const txDate = new Date(tx.date);
        const diffDays = (target.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays < 7;
      }

      if (period === 'monthly') {
        // Match YYYY-MM
        return tx.date.startsWith(selectedMonth);
      }

      return true; // custom / all
    });
  }, [transactions, period, selectedDate, selectedMonth]);

  // Secondary Filter by Type, Category, and Search
  const displayTransactions = useMemo(() => {
    return periodFilteredTransactions.filter((tx) => {
      // Type Filter
      if (typeFilter === 'income' && tx.type !== 'income') return false;
      if (typeFilter === 'expense' && tx.type !== 'expense') return false;
      if (typeFilter === 'commission' && tx.category !== 'barber_commission') return false;

      // Category Filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(query);
        const matchCat = tx.categoryLabel?.toLowerCase().includes(query);
        const matchRef = tx.referenceNumber?.toLowerCase().includes(query);
        const matchBarber = tx.barberName?.toLowerCase().includes(query);
        if (!matchDesc && !matchCat && !matchRef && !matchBarber) return false;
      }

      return true;
    });
  }, [periodFilteredTransactions, typeFilter, categoryFilter, searchQuery]);

  // Aggregate Metrics for Selected Period
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let commissionExpense = 0;
    let serviceIncome = 0;
    let productIncome = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    // Barber specific commissions
    const barberCommMap: Record<string, { name: string; amount: number; count: number }> = {
      'barber-top': { name: 'ช่างท็อป (Top Master)', amount: 0, count: 0 },
      'barber-bass': { name: 'ช่างเบส (Bass Colorist)', amount: 0, count: 0 },
      'barber-ake': { name: 'ช่างเอก (Ake Classic)', amount: 0, count: 0 },
    };

    // Category breakdown
    const categoryTotals: Record<string, { label: string; amount: number; type: TransactionType }> = {};

    periodFilteredTransactions.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        incomeCount++;
        if (tx.category === 'service_cut' || tx.category === 'deposit_online') {
          serviceIncome += tx.amount;
        } else if (tx.category === 'product_sale') {
          productIncome += tx.amount;
        }
      } else {
        totalExpense += tx.amount;
        expenseCount++;
        if (tx.category === 'barber_commission') {
          commissionExpense += tx.amount;
          if (tx.barberId && barberCommMap[tx.barberId]) {
            barberCommMap[tx.barberId].amount += tx.amount;
            barberCommMap[tx.barberId].count += 1;
          }
        }
      }

      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = {
          label: tx.categoryLabel,
          amount: 0,
          type: tx.type,
        };
      }
      categoryTotals[tx.category].amount += tx.amount;
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
    const shopRetainedRate = totalIncome > 0 ? Math.round(((totalIncome - commissionExpense) / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      commissionExpense,
      serviceIncome,
      productIncome,
      incomeCount,
      expenseCount,
      barberCommMap,
      categoryTotals,
      shopRetainedRate,
    };
  }, [periodFilteredTransactions]);

  // Daily Trend Chart Data (for weekly and monthly view)
  const chartDays = useMemo(() => {
    const map: Record<string, { date: string; dayLabel: string; income: number; expense: number }> = {};

    if (period === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });
        map[dateStr] = { date: dateStr, dayLabel: `${dayName} ${d.getDate()}`, income: 0, expense: 0 };
      }
    } else if (period === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        map[dateStr] = { date: dateStr, dayLabel: `${day}`, income: 0, expense: 0 };
      }
    } else {
      // Daily: show single day
      map[selectedDate] = { date: selectedDate, dayLabel: 'วันนี้', income: 0, expense: 0 };
    }

    periodFilteredTransactions.forEach((tx) => {
      if (map[tx.date]) {
        if (tx.type === 'income') {
          map[tx.date].income += tx.amount;
        } else {
          map[tx.date].expense += tx.amount;
        }
      }
    });

    return Object.values(map);
  }, [period, selectedDate, selectedMonth, periodFilteredTransactions]);

  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(
      ...chartDays.map((d) => Math.max(d.income, d.expense)),
      1000
    );
    return maxVal;
  }, [chartDays]);

  // Open Modal Helpers
  const handleOpenAddModal = (mode: 'add_income' | 'add_expense') => {
    setModalMode(mode);
    const defaultCat = mode === 'add_income' ? 'service_cut' : 'salon_supplies';
    const catObj = CATEGORY_OPTIONS.find((c) => c.id === defaultCat);

    setFormData({
      type: mode === 'add_income' ? 'income' : 'expense',
      category: defaultCat,
      categoryLabel: catObj?.label || 'บันทึกรายการ',
      amount: '',
      date: selectedDate || todayStr,
      time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
      description: '',
      barberId: '',
      paymentMethod: 'promptpay',
      referenceNumber: `TX-${Date.now().toString().slice(-6)}`,
    });
    setIsModalOpen(true);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    const chosenBarber = barbers.find((b) => b.id === formData.barberId);

    addTransaction({
      type: formData.type,
      category: formData.category,
      categoryLabel: formData.categoryLabel,
      amount: Number(formData.amount),
      date: formData.date,
      time: formData.time,
      description: formData.description || formData.categoryLabel,
      barberId: formData.barberId ? (formData.barberId as BarberId) : undefined,
      barberName: chosenBarber?.name || chosenBarber?.nickname,
      paymentMethod: formData.paymentMethod,
      referenceNumber: formData.referenceNumber || `TX-${Date.now().toString().slice(-6)}`,
    });

    setIsModalOpen(false);
  };

  // Helper date formatter
  const getPeriodLabel = () => {
    if (period === 'daily') {
      const d = new Date(selectedDate);
      return `ประจำวัน ${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    if (period === 'weekly') {
      const endD = new Date(selectedDate);
      const startD = new Date(selectedDate);
      startD.setDate(startD.getDate() - 6);
      return `รายสัปดาห์ (${startD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${endD.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    if (period === 'monthly') {
      const [y, m] = selectedMonth.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return `ประจำเดือน ${d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}`;
    }
    return 'ข้อมูลบัญชีทั้งหมด';
  };

  const getCategoryIcon = (category: TransactionCategory) => {
    const item = CATEGORY_OPTIONS.find((c) => c.id === category);
    if (!item) return Receipt;
    return item.icon;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner & Control Bar */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <DollarSign className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  ระบบบัญชี รายรับ-รายจ่าย
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    REAL-TIME SYNC
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  สรุปผลประกอบการ ยอดตัดผม เงินมัดจำ ค่าคอมมิชชั่นช่าง และกำไรสุทธิ
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Add Income, Add Expense, Print P&L, Quick Lock */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal('add_income')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกรายรับ</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAddModal('add_expense')}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/40 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ บันทึกรายจ่าย</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-medium transition"
              title="พิมพ์รายงานสรุปงบการเงิน"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">พิมพ์งบการเงิน</span>
            </button>

            <button
              type="button"
              onClick={() => {
                lockAdmin();
                setActiveTab('book');
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition shadow"
              title="ล็อคระบบความปลอดภัยและกลับหน้าหลัก"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>ล็อคระบบ</span>
            </button>
          </div>
        </div>

        {/* Period Selector Tabs: Daily, Weekly, Monthly, All */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Equal 4-Column Grid on Mobile, perfectly balanced & no cut-off */}
          <div className="w-full sm:w-auto grid grid-cols-4 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setPeriod('daily')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                period === 'daily'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">รายวัน</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Daily)</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                period === 'weekly'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">สัปดาห์</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Weekly)</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                period === 'monthly'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">รายเดือน</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(Monthly)</span>
            </button>

            <button
              type="button"
              onClick={() => setPeriod('custom')}
              className={`py-2 px-1 sm:px-3 rounded-xl text-xs font-bold transition flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                period === 'custom'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-extrabold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] sm:text-xs whitespace-nowrap">ทั้งหมด</span>
              <span className="text-[10px] opacity-75 font-normal hidden sm:inline">(All)</span>
            </button>
          </div>

          {/* Date / Month Picker Navigation */}
          <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2">
            {period === 'daily' && (
              <div className="flex-1 sm:flex-none flex items-center justify-between space-x-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className="text-[10px] px-2 py-0.5 bg-zinc-800 text-amber-400 rounded-lg hover:bg-zinc-700 font-semibold shrink-0"
                >
                  วันนี้
                </button>
              </div>
            )}

            {period === 'weekly' && (
              <div className="flex-1 sm:flex-none flex items-center justify-between space-x-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <span className="text-xs text-zinc-400 shrink-0">ถึงวันที่:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {period === 'monthly' && (
              <div className="flex-1 sm:flex-none flex items-center justify-between space-x-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5">
                <span className="text-xs text-zinc-400 shrink-0">เลือกเดือน:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
                />
              </div>
            )}

            <button
              type="button"
              onClick={resetTransactions}
              title="รีเซ็ตเป็นข้อมูลตัวอย่างตั้งต้น"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white shrink-0 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Period Headline */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>ผลประกอบการ: <strong className="text-amber-400">{getPeriodLabel()}</strong></span>
        </h2>
        <span className="text-xs text-zinc-500">
          พบ {periodFilteredTransactions.length} รายการบันทึก
        </span>
      </div>

      {/* Main KPI Cards (4 Column Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Income */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              รายรับรวม (Income)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              ฿{metrics.totalIncome.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center space-x-2">
            <span>{metrics.incomeCount} รายการ</span>
            <span>•</span>
            <span className="text-emerald-500/90">ตัดผม/มัดจำ ฿{metrics.serviceIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              รายจ่ายรวม (Expense)
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
              ฿{metrics.totalExpense.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 flex items-center space-x-2">
            <span>{metrics.expenseCount} รายการ</span>
            <span>•</span>
            <span className="text-rose-400/90">คอมช่าง ฿{metrics.commissionExpense.toLocaleString()}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              กำไรสุทธิ (Net Profit)
            </span>
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                metrics.netProfit >= 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {metrics.profitMargin}% Margin
            </span>
          </div>
          <div className="mt-2.5">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight ${
                metrics.netProfit >= 0 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {metrics.netProfit >= 0 ? '+' : ''}฿{metrics.netProfit.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            หลังหักค่าคอมฯ ช่างและค่าใช้จ่ายร้าน
          </p>
        </div>

        {/* Barber Commission Outflow */}
        <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              จ่ายค่าคอม 3 ช่าง
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xl sm:text-2xl font-black text-indigo-400 tracking-tight">
              ฿{metrics.commissionExpense.toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-zinc-400">
            ส่วนแบ่งร้านคงเหลือ: <strong className="text-amber-400">{metrics.shopRetainedRate}%</strong>
          </p>
        </div>
      </div>

      {/* Visual Analytics Section (Chart & Barber Commission Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Bar Chart (Spans 2 Cols) */}
        <div className="lg:col-span-2 bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>เปรียบเทียบ รายรับ vs รายจ่าย</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                แสดงผลแนวโน้มการเงินตามช่วงเวลา {getPeriodLabel()}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                <span className="text-zinc-300">รายรับ</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />
                <span className="text-zinc-300">รายจ่าย</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-1.5 sm:gap-3 border-b border-zinc-800 pb-2">
              {chartDays.map((item, idx) => {
                const incomePercent = maxChartValue > 0 ? (item.income / maxChartValue) * 100 : 0;
                const expensePercent = maxChartValue > 0 ? (item.expense / maxChartValue) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-zinc-950 border border-zinc-700 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap z-20 shadow-xl pointer-events-none">
                      <span className="text-zinc-300 font-bold">{item.date}</span>
                      <span className="text-emerald-400">รับ: ฿{item.income.toLocaleString()}</span>
                      <span className="text-rose-400">จ่าย: ฿{item.expense.toLocaleString()}</span>
                    </div>

                    {/* Bars pair */}
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                      {/* Income Bar */}
                      <div
                        style={{ height: `${Math.max(incomePercent, 3)}%` }}
                        className="w-1/2 max-w-[14px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm transition-all duration-300 hover:brightness-125"
                      />
                      {/* Expense Bar */}
                      <div
                        style={{ height: `${Math.max(expensePercent, item.expense > 0 ? 3 : 0)}%` }}
                        className="w-1/2 max-w-[14px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm transition-all duration-300 hover:brightness-125"
                      />
                    </div>

                    {/* Day label */}
                    <span className="text-[10px] text-zinc-400 font-mono truncate w-full text-center">
                      {item.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Summary Row under chart */}
            <div className="mt-3 flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>ยอดสูงสุด: ฿{maxChartValue.toLocaleString()}</span>
              <span>
                กำไรรวมช่วงนี้:{' '}
                <strong className={metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  ฿{metrics.netProfit.toLocaleString()}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Barber Commission Summary Card (1 Col) */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-3.5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>สรุปค่าคอมมิชชั่นรายช่าง</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              ส่วนแบ่งผลงานของช่างประจำช่วงเวลานี้
            </p>
          </div>

          <div className="space-y-2.5">
            {barbers.map((barber) => {
              const bData = metrics.barberCommMap[barber.id] || { amount: 0, count: 0 };
              const percentOfTotalComm =
                metrics.commissionExpense > 0
                  ? Math.round((bData.amount / metrics.commissionExpense) * 100)
                  : 0;

              return (
                <div
                  key={barber.id}
                  className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={barber.avatarUrl}
                      alt={barber.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-700"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white">
                          {barber.nickname}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">
                          {barber.commissionRate}%
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {bData.count} งานตัดผม
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-amber-400">
                      ฿{bData.amount.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-zinc-500">
                      {percentOfTotalComm}% ของค่าคอมฯ รวม
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">
              รวมค่าคอมมิชชั่นจ่ายออก:
            </span>
            <span className="text-sm font-black text-amber-400">
              ฿{metrics.commissionExpense.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3">
          <PieChart className="w-4 h-4 text-amber-400" />
          <span>โครงสร้างหมวดหมู่รายรับ-รายจ่าย (Category Breakdown)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {(
            Object.entries(metrics.categoryTotals) as [
              string,
              { label: string; amount: number; type: TransactionType }
            ][]
          ).map(([catKey, catData]) => {
            const isIncome = catData.type === 'income';
            const Icon = getCategoryIcon(catKey as TransactionCategory);

            return (
              <div
                key={catKey}
                onClick={() => setCategoryFilter(categoryFilter === catKey ? 'all' : catKey)}
                className={`p-3 rounded-2xl border transition cursor-pointer ${
                  categoryFilter === catKey
                    ? 'bg-amber-500/15 border-amber-500/50'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isIncome
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {isIncome ? 'รายรับ' : 'รายจ่าย'}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-[11px] text-zinc-400 truncate">{catData.label}</p>
                  <p
                    className={`text-sm font-black mt-0.5 ${
                      isIncome ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ฿{catData.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction Ledger List / Search / Filters */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>สมุดบัญชีรายการเดินสะพัด (Transaction Ledger)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              แสดงรายการธุรกรรมรับ-จ่ายทั้งหมดตามเงื่อนไขที่เลือก ({displayTransactions.length} รายการ)
            </p>
          </div>

          {/* Type Filter Pills (Equal 4-Column Grid on Mobile) */}
          <div className="w-full sm:w-auto grid grid-cols-4 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl gap-1 text-center">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`py-1.5 px-1 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('income')}
              className={`py-1.5 px-1 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              รายรับ
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('expense')}
              className={`py-1.5 px-1 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === 'expense'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('commission')}
              className={`py-1.5 px-1 sm:px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                typeFilter === 'commission'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-400 hover:text-white'
              }`}
            >
              คอมช่าง
            </button>
          </div>
        </div>

        {/* Search & Reset Category Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาตามคำอธิบาย, เลขที่อ้างอิง, ชื่อช่าง หรือหมวดหมู่..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {categoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center space-x-1"
            >
              <span>ล้างตัวกรองหมวดหมู่</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Ledger Items Table / Card List */}
        <div className="space-y-2 pt-2">
          {displayTransactions.length === 0 ? (
            <div className="text-center py-12 bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-800">
              <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-300 font-semibold">ไม่พบรายการในช่วงเวลาหรือตัวกรองที่เลือก</p>
              <p className="text-xs text-zinc-500 mt-1">
                คลิกที่ปุ่ม "+ บันทึกรายรับ" หรือ "+ บันทึกรายจ่าย" เพื่อเพิ่มรายการใหม่
              </p>
            </div>
          ) : (
            displayTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const Icon = getCategoryIcon(tx.category);

              return (
                <div
                  key={tx.id}
                  className="bg-zinc-950/90 border border-zinc-800/90 hover:border-zinc-700/90 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-white">
                          {tx.categoryLabel}
                        </span>
                        {tx.isAutoGenerated && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 border border-amber-500/30">
                            AUTO SYNC
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 font-mono">
                          #{tx.referenceNumber}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-300 font-normal">
                        {tx.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 pt-0.5">
                        <span>📅 {tx.date} • {tx.time} น.</span>
                        {tx.barberName && (
                          <span className="text-amber-400/90 font-medium">
                            ✂️ {tx.barberName}
                          </span>
                        )}
                        {tx.paymentMethod && (
                          <span className="capitalize px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px]">
                            {tx.paymentMethod === 'promptpay'
                              ? 'PromptPay'
                              : tx.paymentMethod === 'credit_card'
                              ? 'Credit Card'
                              : tx.paymentMethod === 'cash'
                              ? 'เงินสด'
                              : 'โอนเงิน'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/80">
                    <div className="text-left sm:text-right">
                      <span
                        className={`text-base sm:text-lg font-black tracking-tight ${
                          isIncome ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}฿{tx.amount.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteTransaction(tx.id)}
                      title="ลบรายการ"
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Quick Add Income / Expense */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  modalMode === 'add_income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {modalMode === 'add_income' ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {modalMode === 'add_income' ? 'บันทึกรายรับใหม่' : 'บันทึกรายจ่ายใหม่'}
                </h3>
                <p className="text-xs text-zinc-400">
                  เพิ่มรายการเข้าสู่ระบบบัญชีร้านตัดผม
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitTransaction} className="space-y-3.5">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      type: 'income',
                      category: 'service_cut',
                      categoryLabel: 'บริการตัดผม/ดัด/ทำสี',
                    }));
                    setModalMode('add_income');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    formData.type === 'income'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🟢 รายรับ (Income)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      type: 'expense',
                      category: 'salon_supplies',
                      categoryLabel: 'น้ำยา & อุปกรณ์สิ้นเปลือง',
                    }));
                    setModalMode('add_expense');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition ${
                    formData.type === 'expense'
                      ? 'bg-rose-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  🔴 รายจ่าย (Expense)
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  จำนวนเงิน (บาท) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-black text-amber-400">
                    ฿
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    className="w-full pl-8 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-lg font-black text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const selCat = e.target.value as TransactionCategory;
                    const catObj = CATEGORY_OPTIONS.find((c) => c.id === selCat);
                    setFormData({
                      ...formData,
                      category: selCat,
                      categoryLabel: catObj?.label || 'รายการ',
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {CATEGORY_OPTIONS.filter((c) => c.type === formData.type).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  รายละเอียด / หมายเหตุ
                </label>
                <input
                  type="text"
                  placeholder="เช่น ซื้อน้ำยาไฮโดรเจน, ยอดตัดผมหน้าร้านรอบดึก"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    เวลา
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Barber & Payment Method */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    ช่างที่เกี่ยวข้อง (ถ้ามี)
                  </label>
                  <select
                    value={formData.barberId}
                    onChange={(e) =>
                      setFormData({ ...formData, barberId: e.target.value as BarberId | '' })
                    }
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nickname} ({b.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">
                    ช่องทางชำระ
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as NewTxFormData['paymentMethod'],
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="promptpay">PromptPay</option>
                    <option value="credit_card">บัตรเครดิต</option>
                    <option value="cash">เงินสด (Cash)</option>
                    <option value="transfer">โอนเงินธนาคาร</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold transition ${
                    formData.type === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  ยืนยันบันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Printable P&L Statement (งบการเงิน) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative font-sans">
            <button
              type="button"
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Document Header */}
            <div className="border-b-2 border-zinc-900 pb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950 uppercase">
                  {shopSettings.shopName}
                </h2>
                <p className="text-xs text-zinc-600">
                  {shopSettings.branchName} • โทร {shopSettings.phone}
                </p>
                <p className="text-[11px] text-zinc-500">
                  เลขประจำตัวผู้เสียภาษี: {shopSettings.taxId}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold px-2.5 py-1 bg-zinc-900 text-white rounded">
                  P&L STATEMENT
                </span>
                <p className="text-xs font-bold mt-1 text-zinc-800">
                  รายงานงบกำไร-ขาดทุน
                </p>
                <p className="text-[11px] text-zinc-500">{getPeriodLabel()}</p>
              </div>
            </div>

            {/* Summary Table */}
            <div className="my-6 space-y-4">
              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                <div className="flex justify-between text-sm font-bold text-emerald-700 pb-1 border-b border-zinc-200">
                  <span>1. รายรับทั้งหมด (Total Revenue)</span>
                  <span>฿{metrics.totalIncome.toLocaleString()}</span>
                </div>
                <div className="pl-4 pt-2 space-y-1 text-xs text-zinc-600">
                  <div className="flex justify-between">
                    <span>- บริการตัดผม & มัดจำออนไลน์ ({metrics.incomeCount} คิว)</span>
                    <span>฿{metrics.serviceIncome.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>- จำหน่ายผลิตภัณฑ์ใส่ผม/แว็กซ์</span>
                    <span>฿{metrics.productIncome.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
                <div className="flex justify-between text-sm font-bold text-rose-700 pb-1 border-b border-zinc-200">
                  <span>2. รายจ่ายทั้งหมด (Total Operating Expenses)</span>
                  <span>-฿{metrics.totalExpense.toLocaleString()}</span>
                </div>
                <div className="pl-4 pt-2 space-y-1 text-xs text-zinc-600">
                  <div className="flex justify-between text-indigo-700 font-semibold">
                    <span>- ส่วนแบ่งค่าคอมมิชชั่น 3 ช่าง (Barber Commission)</span>
                    <span>-฿{metrics.commissionExpense.toLocaleString()}</span>
                  </div>
                  {(
                    Object.entries(metrics.categoryTotals) as [
                      string,
                      { label: string; amount: number; type: TransactionType }
                    ][]
                  )
                    .filter(([k, v]) => v.type === 'expense' && k !== 'barber_commission')
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span>- {v.label}</span>
                        <span>-฿{v.amount.toLocaleString()}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Net Profit Callout */}
              <div className="bg-zinc-950 text-white rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    กำไรสุทธิคงเหลือ (Net Profit Margin: {metrics.profitMargin}%)
                  </span>
                  <p className="text-xs text-zinc-400">
                    ยอดเงินคงเหลือหลังหักส่วนแบ่งช่างและต้นทุนร้าน
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400">
                    ฿{metrics.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <span>ออกเอกสารเมื่อ: {new Date().toLocaleString('th-TH')}</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl flex items-center space-x-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>สั่งพิมพ์ / Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
