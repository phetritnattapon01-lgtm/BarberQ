import React from 'react';
import {
  Award,
  X,
  History,
  TrendingUp,
  Gift,
  PlusCircle,
  Scissors,
  Calendar,
} from 'lucide-react';
import { CustomerLoyalty } from '../types';

interface LoyaltyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  loyalty: CustomerLoyalty | null;
}

export const LoyaltyHistoryModal: React.FC<LoyaltyHistoryModalProps> = ({
  isOpen,
  onClose,
  loyalty,
}) => {
  if (!isOpen || !loyalty) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ประวัติการสะสมและใช้แต้ม
              </h3>
              <p className="text-xs text-zinc-400">
                {loyalty.customerName} • {loyalty.displayPhone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 block">แต้มปัจจุบัน</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {loyalty.points}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 block">สะสมรวมทั้งหมด</span>
              <span className="text-xl font-black text-white font-mono">
                {loyalty.lifetimePoints}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[11px] text-zinc-500 block">แลกรางวัลแล้ว</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {loyalty.redeemedRewardsCount} ใบ
              </span>
            </div>
          </div>

          {/* History Timeline */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>รายการสะสม / แลกรับย้อนหลัง</span>
            </h4>

            {loyalty.history.length === 0 ? (
              <div className="p-6 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center text-zinc-500 text-xs">
                ยังไม่มีประวัติทำรายการ
              </div>
            ) : (
              <div className="space-y-2">
                {loyalty.history
                  .slice()
                  .reverse()
                  .map((item) => {
                    const isEarn = item.type === 'earn' || item.type === 'bonus';
                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isEarn
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isEarn ? (
                              <Scissors className="w-4 h-4" />
                            ) : (
                              <Gift className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-200">
                              {item.description}
                            </p>
                            <span className="text-[10px] text-zinc-500 flex items-center space-x-1 mt-0.5">
                              <Calendar className="w-2.5 h-2.5 mr-0.5" />
                              <span>{item.date}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-sm font-black font-mono ${
                              isEarn ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {item.points > 0 ? `+${item.points}` : item.points} แต้ม
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
