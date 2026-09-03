import React, { useState } from 'react';
import {
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  Scissors,
  Share2,
  ChevronRight,
  Sparkles,
  QrCode,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { Booking } from '../types';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { soundFx } from '../utils/audio';

export const HistoryReceiptModal: React.FC = () => {
  const { bookings } = useBooking();
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(bookings[0] || null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenPrintModal = () => {
    soundFx.playClick();
    setIsPrintModalOpen(true);
  };

  const handleQuickCopy = async (booking: Booking) => {
    soundFx.playClick();
    const text = `🧾 ใบเสร็จรับเงิน BarberQ - คิว #${booking.queueNumber} (${booking.customerName}) ยอดรวม ฿${booking.finalTotalPrice.toLocaleString()} ชำระแล้ว ฿${booking.amountPaid.toLocaleString()}`;
    try {
      await navigator.clipboard.writeText(text);
      soundFx.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>ประวัติการจองและใบเสร็จรับเงิน (E-Receipts)</span>
          </h3>
          <p className="text-xs text-zinc-400">
            เอกสารยืนยันการชำระเงินมัดจำ 50% และบัตรคิวอิเล็กทรอนิกส์
          </p>
        </div>
      </div>

      {/* Bookings List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bookings.map((booking) => {
          const isSelected = selectedReceipt?.id === booking.id;
          const isNoDeposit = booking.paymentOption === 'no_deposit';
          const isDeposit = booking.paymentOption === 'deposit_50';

          return (
            <div
              key={booking.id}
              onClick={() => setSelectedReceipt(booking)}
              className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 border-amber-500 ring-2 ring-amber-500/40 shadow-xl'
                  : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-mono font-black text-sm">
                    {booking.queueNumber}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100">{booking.customerName}</h4>
                    <p className="text-xs text-zinc-400">{booking.service.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400 block">
                    ฿{isNoDeposit ? booking.finalTotalPrice.toLocaleString() : booking.amountPaid.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {isNoDeposit ? 'ไม่มีมัดจำ (จ่ายหน้าร้าน)' : isDeposit ? 'มัดจำ 50%' : 'จ่ายเต็ม'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span>ช่าง: {booking.barber.nickname} • {booking.bookingDate} {booking.bookingTimeSlot} น.</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedReceipt(booking);
                    setIsPrintModalOpen(true);
                    soundFx.playClick();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center space-x-1 transition shadow-sm"
                >
                  <Printer className="w-3 h-3" />
                  <span>พิมพ์สลิป</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed E-Receipt Modal / View */}
      {selectedReceipt && (
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase font-mono">OFFICIAL RECEIPT / TAX INVOICE</span>
              <h4 className="text-base font-bold text-zinc-100">ใบเสร็จรับเงินอิเล็กทรอนิกส์ #{selectedReceipt.queueNumber}</h4>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenPrintModal}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบเสร็จ / บันทึกรูป</span>
              </button>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 font-mono text-xs space-y-3">
            <div className="text-center pb-3 border-b border-dashed border-zinc-700">
              <h5 className="font-bold text-sm text-zinc-100">BARBERQ HAIR STUDIO</h5>
              <p className="text-[10px] text-zinc-400 font-sans">สาขาสยามสแควร์ เลขผู้เสียภาษี 0105567012889</p>
              <p className="text-[10px] text-zinc-500 font-sans">โทร 02-123-4567 • www.barberq.studio</p>
            </div>

            <div className="space-y-1 text-zinc-300">
              <div className="flex justify-between">
                <span>คิวที่ / Queue:</span>
                <span className="font-bold text-amber-400">{selectedReceipt.queueNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>เลขที่อ้างอิง:</span>
                <span>{selectedReceipt.paymentRefNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่ชำระ:</span>
                <span>{selectedReceipt.paidAt}</span>
              </div>
              <div className="flex justify-between">
                <span>ชื่อลูกค้า:</span>
                <span className="font-sans">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>ช่างผู้ให้บริการ:</span>
                <span className="font-sans">{selectedReceipt.barber.name} (เก้าอี้ #{selectedReceipt.barber.chairNumber})</span>
              </div>
            </div>

            <div className="py-2 border-t border-b border-dashed border-zinc-700 space-y-1.5">
              <div className="flex justify-between text-zinc-200 font-sans">
                <span>1. {selectedReceipt.service.name}</span>
                <span className="font-mono">฿{selectedReceipt.totalServicePrice.toFixed(2)}</span>
              </div>
              {selectedReceipt.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>ส่วนลดโปรโมชั่น</span>
                  <span>-฿{selectedReceipt.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="space-y-1 text-zinc-200">
              <div className="flex justify-between">
                <span>ยอดรวมทั้งสิ้น (Total):</span>
                <span className="font-bold text-white">฿{selectedReceipt.finalTotalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>
                  {selectedReceipt.paymentOption === 'no_deposit'
                    ? 'ชำระออนไลน์ตอนนี้ (Paid Online):'
                    : selectedReceipt.paymentOption === 'deposit_50'
                    ? 'ชำระมัดจำ 50% (Paid Now):'
                    : 'ชำระเต็มจำนวน (Paid):'}
                </span>
                <span>฿{selectedReceipt.amountPaid.toFixed(2)}</span>
              </div>
              {selectedReceipt.amountRemaining > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>
                    {selectedReceipt.paymentOption === 'no_deposit'
                      ? 'ยอดชำระที่หน้าร้าน (Pay at Shop 100%):'
                      : 'คงเหลือชำระหน้าร้าน (Remaining 50%):'}
                  </span>
                  <span className="font-bold text-amber-300 font-mono">฿{selectedReceipt.amountRemaining.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] text-zinc-500 pt-1">
                <span>ช่องทางชำระเงิน:</span>
                <span>
                  {selectedReceipt.paymentOption === 'no_deposit'
                    ? 'ชำระที่หน้าร้าน (PAY AT SHOP)'
                    : selectedReceipt.paymentMethod === 'promptpay'
                    ? 'PROMPTPAY QR'
                    : 'CREDIT / DEBIT CARD'}
                </span>
              </div>
            </div>

            <div className="text-center pt-3 border-t border-dashed border-zinc-700 font-sans text-[11px] text-zinc-400">
              <p>*** ขอบพระคุณที่ไว้วางใจใช้บริการ BarberQ ***</p>
              <p className="text-[10px] text-zinc-500 mt-1">กรุณาแสดงหลักฐานนี้แก่พนักงานต้อนรับเมื่อถึงร้าน</p>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        booking={selectedReceipt}
      />
    </div>
  );
};
