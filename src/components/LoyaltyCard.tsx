import React from 'react';
import {
  Award,
  Scissors,
  Gift,
  CheckCircle2,
  Sparkles,
  Star,
  ChevronRight,
  TrendingUp,
  History,
} from 'lucide-react';
import { CustomerLoyalty } from '../types';
import { useBooking } from '../context/BookingContext';

interface LoyaltyCardProps {
  loyalty: CustomerLoyalty;
  isRedeeming?: boolean;
  onToggleRedeem?: (checked: boolean) => void;
  showRedeemAction?: boolean;
  compact?: boolean;
  onViewHistory?: () => void;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  loyalty,
  isRedeeming = false,
  onToggleRedeem,
  showRedeemAction = true,
  compact = false,
  onViewHistory,
}) => {
  const { shopSettings } = useBooking();

  const pointsRequired = shopSettings.loyaltyPointsRequired || 10;
  const rewardDiscount = shopSettings.loyaltyRewardDiscount || 150;
  const points = loyalty.points;
  const canRedeem = points >= pointsRequired;
  const progressPercent = Math.min(100, Math.round((points / pointsRequired) * 100));
  const pointsRemaining = Math.max(0, pointsRequired - points);

  if (compact) {
    return (
      <div className="p-3 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-zinc-100">บัตรสะสมแต้ม</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.2 rounded-full border border-amber-500/30">
                  {points}/{pointsRequired} แต้ม
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {canRedeem
                  ? `🎉 แลกส่วนลด ฿${rewardDiscount} ได้แล้ว`
                  : `ขาดอีก ${pointsRemaining} แต้ม รับส่วนลด ฿${rewardDiscount}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < Math.min(5, Math.floor((points / pointsRequired) * 5))
                    ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-amber-500/30 overflow-hidden shadow-xl shadow-amber-950/10 transition-all">
      {/* Top Header Strip */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-b border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                BARBERQ LOYALTY CLUB
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                สะสมแต้ม
              </span>
            </div>
            <h4 className="text-sm font-bold text-white leading-tight">
              {loyalty.customerName || 'ลูกค้าประจำ'} ({loyalty.displayPhone})
            </h4>
          </div>
        </div>

        {onViewHistory && (
          <button
            type="button"
            onClick={onViewHistory}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center space-x-1 bg-zinc-900/80 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-amber-500/30 transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติแต้ม</span>
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Points & Progress Callout */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-amber-400 tracking-tight font-mono">
                {points}
              </span>
              <span className="text-sm font-bold text-zinc-400">
                / {pointsRequired} แต้ม
              </span>
            </div>
            <p className="text-xs text-zinc-300 mt-0.5 flex items-center space-x-1">
              {canRedeem ? (
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                  สะสมครบ {pointsRequired} แต้มแล้ว! พร้อมรับส่วนลดพิเศษ ฿{rewardDiscount}
                </span>
              ) : (
                <span>
                  ตัดผม 1 ครั้ง = 1 แต้ม (ขาดอีก{' '}
                  <strong className="text-amber-400">{pointsRemaining} แต้ม</strong>{' '}
                  รับส่วนลด ฿{rewardDiscount})
                </span>
              )}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-500 block">ตัดผมสะสม</span>
            <span className="text-xs font-bold text-zinc-300">
              {loyalty.totalVisits} ครั้ง • แลกแล้ว {loyalty.redeemedRewardsCount} ใบ
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden p-0.5 border border-zinc-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              canRedeem
                ? 'bg-gradient-to-r from-emerald-500 to-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-amber-500 to-amber-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 10 Visual Stamp Slots */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
            <span>ตราประทับสะสม (10 ช่อง)</span>
            <span className="text-amber-400 font-medium">
              {canRedeem ? 'ครบทุกช่องแล้ว! 🎊' : `ช่องที่ ${points + 1} คือการตัดครั้งนี้`}
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
            {Array.from({ length: pointsRequired }).map((_, idx) => {
              const stampNum = idx + 1;
              const isStamped = stampNum <= points;
              const isRewardSlot = stampNum === pointsRequired;

              return (
                <div
                  key={stampNum}
                  title={
                    isStamped
                      ? `แต้มที่ ${stampNum} (สะสมแล้ว)`
                      : isRewardSlot
                      ? `เป้าหมาย ${pointsRequired} แต้ม: รับส่วนลด ฿${rewardDiscount}`
                      : `แต้มที่ ${stampNum}`
                  }
                  className={`relative aspect-square rounded-xl flex flex-col items-center justify-center p-1 border transition-all duration-300 select-none ${
                    isStamped
                      ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/10 border-amber-500/70 shadow-sm shadow-amber-500/20 text-amber-300 scale-100'
                      : isRewardSlot
                      ? 'bg-zinc-900/90 border-dashed border-amber-500/60 text-amber-400'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:border-zinc-700'
                  }`}
                >
                  {isStamped ? (
                    <>
                      {isRewardSlot ? (
                        <Gift className="w-4 h-4 text-amber-300 animate-bounce" />
                      ) : (
                        <Scissors className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-[10px] font-black mt-0.5 text-amber-400">
                        {stampNum}
                      </span>
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-zinc-950 flex items-center justify-center text-zinc-950">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                    </>
                  ) : (
                    <>
                      {isRewardSlot ? (
                        <Gift className="w-4 h-4 text-amber-400/80 animate-pulse" />
                      ) : (
                        <span className="text-[11px] font-bold text-zinc-500 font-mono">
                          {stampNum}
                        </span>
                      )}
                      <span className="text-[9px] text-zinc-600 font-semibold">
                        {isRewardSlot ? 'ฟรี/ลด' : 'แต้ม'}
                      </span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Redeem Reward Action Box (When Points >= 10) */}
        {showRedeemAction && canRedeem && onToggleRedeem && (
          <div
            onClick={() => onToggleRedeem(!isRedeeming)}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
              isRedeeming
                ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
                : 'bg-amber-950/30 border-amber-500/60 hover:bg-amber-950/50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  isRedeeming
                    ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}
              >
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-white">
                    {isRedeeming ? '✅ เลือกใช้สิทธิ์แล้ว' : '🎁 ใช้สิทธิ์สะสมครบ 10 แต้ม'}
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                    ลดทันที ฿{rewardDiscount}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {isRedeeming
                    ? `หัก 10 แต้มเพื่อลดค่าบริการ ฿${rewardDiscount} ในการจองรอบนี้`
                    : `คลิกเพื่อใช้สิทธิ์ลด ฿${rewardDiscount} ในคิวนี้`}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isRedeeming}
                onChange={(e) => onToggleRedeem(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Small Note */}
        <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-800/80">
          <span>✨ เงื่อนไข: สิทธิ์สะสมแต้มผูกกับเบอร์โทรศัพท์ของลูกค้า</span>
          <span className="text-amber-400/80 font-medium">BarberQ Loyalty</span>
        </div>
      </div>
    </div>
  );
};
