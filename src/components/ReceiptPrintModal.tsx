import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  X,
  Share2,
  Scissors,
  QrCode,
  Sparkles,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { Booking } from '../types';
import { soundFx } from '../utils/audio';
import html2canvas from 'html2canvas-pro';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [printSuccessMsg, setPrintSuccessMsg] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const isNoDeposit = booking.paymentOption === 'no_deposit';
  const isDeposit50 = booking.paymentOption === 'deposit_50';

  // Format Receipt Text for Copying to LINE / Chat
  const receiptText = `🧾 ใบเสร็จรับเงินอิเล็กทรอนิกส์ - BARBERQ
--------------------------------
คิวที่: ${booking.queueNumber}
ชื่อลูกค้า: ${booking.customerName}
เบอร์โทร: ${booking.customerPhone}
วันที่จอง: ${booking.bookingDate} เวลา ${booking.bookingTimeSlot} น.
ช่าง: ${booking.barber.name} (เก้าอี้ #${booking.barber.chairNumber})
บริการ: ${booking.service.name} (฿${booking.totalServicePrice.toLocaleString()})
${booking.discountAmount > 0 ? `ส่วนลด: -฿${booking.discountAmount.toLocaleString()}\n` : ''}ยอดรวมทั้งสิ้น: ฿${booking.finalTotalPrice.toLocaleString()}
ชำระแล้ว: ฿${booking.amountPaid.toLocaleString()} (${isNoDeposit ? 'จ่ายหน้าร้าน' : isDeposit50 ? 'มัดจำ 50%' : 'ชำระเต็ม'})
คงเหลือจ่ายหน้าร้าน: ฿${booking.amountRemaining.toLocaleString()}
รหัสอ้างอิง: ${booking.paymentRefNumber}
--------------------------------
ขอบพระคุณที่ใช้บริการ BarberQ Hair Studio`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
      soundFx.playSuccess();
      setCopied(true);
      setPrintSuccessMsg('คัดลอกข้อความใบเสร็จเรียบร้อยแล้ว');
      setTimeout(() => {
        setCopied(false);
        setPrintSuccessMsg(null);
      }, 3000);
    } catch {
      // fallback
    }
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setIsGeneratingImg(true);
    soundFx.playClick();

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imageUri = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUri;
      link.download = `Receipt-${booking.queueNumber}-${booking.bookingDate}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      soundFx.playSuccess();
      setPrintSuccessMsg('บันทึกรูปใบเสร็จ (PNG) สำเร็จแล้ว!');
      setTimeout(() => setPrintSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Error generating receipt image:', err);
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handlePrint = () => {
    soundFx.playClick();

    const printContent = receiptRef.current?.innerHTML;
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
              <title>ใบเสร็จรับเงิน ${booking.queueNumber}</title>
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
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 8px 0; }
                .flex-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                .qr-box { margin: 10px auto; text-align: center; }
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

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cursor-default w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto space-y-4"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-4 right-4 w-10 h-10 text-zinc-300 hover:text-white rounded-full bg-zinc-800 hover:bg-zinc-700 active:scale-90 border border-zinc-700/60 shadow-md transition flex items-center justify-center cursor-pointer z-20"
          title="ปิดหน้าต่างใบเสร็จ"
          aria-label="ปิด"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-zinc-100">พิมพ์ใบเสร็จรับเงิน (Receipt)</h3>
            <p className="text-xs text-zinc-400">คิว #{booking.queueNumber} - {booking.customerName}</p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>สั่งพิมพ์สลิป</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGeneratingImg}
            className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-semibold text-xs flex items-center justify-center space-x-1.5 border border-zinc-700 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{isGeneratingImg ? 'กำลังเซฟ...' : 'บันทึกรูป PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="p-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-semibold text-xs flex items-center justify-center space-x-1.5 border border-zinc-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'ก็อปปี้สลิป'}</span>
          </button>
        </div>

        {/* Notification feedback */}
        {printSuccessMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center space-x-1.5 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{printSuccessMsg}</span>
          </div>
        )}

        {/* Thermal Slip Preview Box (White Thermal Paper look) */}
        <div className="bg-zinc-950/60 p-2 rounded-2xl border border-zinc-800 flex justify-center overflow-hidden">
          <div
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white text-zinc-900 p-5 rounded-lg shadow-inner font-mono text-[11px] leading-relaxed select-text"
          >
            {/* Store Brand */}
            <div className="text-center pb-2 border-b border-dashed border-zinc-400">
              <div className="flex justify-center items-center space-x-1 mb-1">
                <Scissors className="w-4 h-4 text-zinc-800" />
                <span className="font-black text-sm tracking-tight text-zinc-950">BARBERQ HAIR STUDIO</span>
              </div>
              <p className="text-[10px] text-zinc-600 font-sans">สาขาสยามสแควร์ วัน • โทร 02-123-4567</p>
              <p className="text-[9px] text-zinc-500 font-sans">เลขประจำตัวผู้เสียภาษี: 0105567012889 (สำนักงานใหญ่)</p>
            </div>

            {/* Queue & Ref header */}
            <div className="py-2.5 border-b border-dashed border-zinc-400 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-zinc-700">ลำดับคิว / QUEUE:</span>
                <span className="text-base font-black text-zinc-950 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-300">
                  {booking.queueNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">รหัสอ้างอิง (Ref):</span>
                <span className="font-bold text-zinc-800">{booking.paymentRefNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">วันที่พิมพ์:</span>
                <span>{booking.paidAt || new Date().toLocaleString('th-TH')}</span>
              </div>
            </div>

            {/* Customer & Barber info */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-1 text-zinc-800">
              <div className="flex justify-between">
                <span className="text-zinc-600">ลูกค้า:</span>
                <span className="font-bold font-sans">{booking.customerName} ({booking.customerPhone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">วันเวลานัด:</span>
                <span className="font-bold">{booking.bookingDate} {booking.bookingTimeSlot} น.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600">ช่างตัดผม:</span>
                <span className="font-bold font-sans">{booking.barber.name} (เก้าอี้ #{booking.barber.chairNumber})</span>
              </div>
            </div>

            {/* Items table */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-1.5">
              <div className="flex justify-between font-bold text-zinc-950">
                <span>รายการบริการ</span>
                <span>จำนวนเงิน</span>
              </div>
              <div className="flex justify-between font-sans text-zinc-800">
                <span>1. {booking.service.name} ({booking.service.durationMinutes} นาที)</span>
                <span className="font-mono">฿{booking.totalServicePrice.toFixed(2)}</span>
              </div>
              {booking.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>ส่วนลดโปรโมชั่น ({booking.discountCode})</span>
                  <span>-฿{booking.discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="py-2 space-y-1 text-zinc-900">
              <div className="flex justify-between text-xs font-bold">
                <span>ยอดสุทธิ (Total):</span>
                <span className="text-sm font-black">฿{booking.finalTotalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-zinc-800">
                <span>
                  {isNoDeposit ? 'ชำระออนไลน์:' : isDeposit50 ? 'ชำระมัดจำ 50%:' : 'ชำระแล้ว:'}
                </span>
                <span>฿{booking.amountPaid.toFixed(2)}</span>
              </div>
              {booking.amountRemaining > 0 && (
                <div className="flex justify-between text-zinc-700">
                  <span>
                    {isNoDeposit ? 'ยอดชำระที่หน้าร้าน (100%):' : 'คงเหลือชำระหน้าร้าน:'}
                  </span>
                  <span className="font-bold">฿{booking.amountRemaining.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] text-zinc-600 pt-1">
                <span>ช่องทางชำระเงิน:</span>
                <span className="font-bold">
                  {isNoDeposit
                    ? 'ชำระหน้าร้าน (CASH / QR)'
                    : booking.paymentMethod === 'promptpay'
                    ? 'PROMPTPAY QR 50%'
                    : 'CREDIT / DEBIT CARD'}
                </span>
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="text-center pt-3 border-t border-dashed border-zinc-400 font-sans space-y-1">
              <p className="font-bold text-[11px] text-zinc-800">*** ขอบพระคุณที่ใช้บริการ ***</p>
              <p className="text-[9px] text-zinc-500">กรุณาแสดงใบเสร็จนี้เมื่อมาถึงร้าน</p>
              <div className="pt-2 flex flex-col items-center">
                <div className="w-32 h-6 border-b-2 border-t-2 border-zinc-800 flex items-center justify-around px-1 font-mono tracking-widest text-[10px]">
                  ||||| | | |||| ||| ||
                </div>
                <span className="text-[8px] text-zinc-500 mt-0.5 font-mono">{booking.paymentRefNumber}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Close */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
