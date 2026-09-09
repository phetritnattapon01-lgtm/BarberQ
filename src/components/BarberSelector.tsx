import React, { useState } from 'react';
import { Star, CheckCircle, Award, Sparkles, Clock, ChevronRight, Info, Ban, AlertCircle } from 'lucide-react';
import { Barber, BarberId } from '../types';
import { soundFx } from '../utils/audio';
import { useBooking } from '../context/BookingContext';

interface BarberSelectorProps {
  selectedBarberId: BarberId | null;
  onSelectBarber: (id: BarberId) => void;
}

export const BarberSelector: React.FC<BarberSelectorProps> = ({
  selectedBarberId,
  onSelectBarber,
}) => {
  const { barbers } = useBooking();
  const [activeModalBarber, setActiveModalBarber] = useState<Barber | null>(null);
  const [closedBarberAlert, setClosedBarberAlert] = useState<string | null>(null);

  const handleSelect = (barber: Barber) => {
    if (barber.isActive === false) {
      soundFx.playNotification();
      setClosedBarberAlert(`ช่าง ${barber.name} ปิดรับคิวชั่วคราว (พักงาน/ลาหยุด) กรุณาเลือกช่างท่านอื่น`);
      setTimeout(() => setClosedBarberAlert(null), 4000);
      return;
    }
    setClosedBarberAlert(null);
    soundFx.playClick();
    onSelectBarber(barber.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span>เลือกช่างตัดผมประจำตัว (มี 3 ช่างมืออาชีพ)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            ช่างแต่ละท่านมีความเชี่ยวชาญและสไตล์เฉพาะตัว
          </p>
        </div>
      </div>

      {/* Alert banner if customer clicked a closed barber */}
      {closedBarberAlert && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center space-x-2 text-rose-300 text-xs animate-shake">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{closedBarberAlert}</span>
        </div>
      )}

      {/* 3 Barbers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {barbers.map((barber) => {
          const isSelected = selectedBarberId === barber.id;
          const isClosed = barber.isActive === false;

          return (
            <div
              key={barber.id}
              onClick={() => handleSelect(barber)}
              className={`relative rounded-2xl p-3.5 sm:p-4 transition-all duration-200 overflow-hidden border flex flex-col justify-between h-full ${
                isClosed
                  ? 'bg-zinc-950/70 border-zinc-800/80 opacity-60 grayscale-[35%] cursor-not-allowed hover:border-rose-500/40'
                  : isSelected
                  ? 'bg-zinc-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/50 cursor-pointer'
                  : 'bg-zinc-900/40 hover:bg-zinc-900/70 border-zinc-800 text-zinc-300 cursor-pointer'
              }`}
            >
              {/* Closed Barber Top Banner */}
              {isClosed && (
                <div className="absolute top-0 left-0 right-0 bg-rose-950/90 border-b border-rose-500/30 text-rose-300 text-xs font-semibold py-1 px-3 flex items-center justify-between z-10">
                  <span className="flex items-center space-x-1.5">
                    <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>ปิดรับคิวชั่วคราว (พักงาน/ลา)</span>
                  </span>
                </div>
              )}

              {/* Selected Check Badge */}
              {!isClosed && isSelected && (
                <div className="absolute top-3 right-3 z-10 bg-amber-500 text-zinc-950 p-1 rounded-full shadow-md animate-scaleIn">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}

              {/* Badge Tag */}
              <div className={`flex items-center space-x-2 mb-3 ${isClosed ? 'mt-5' : ''}`}>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-zinc-800 text-amber-400 border border-zinc-700/60 leading-normal">
                  เก้าอี้ #{barber.chairNumber}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 leading-normal">
                  {barber.badge}
                </span>
              </div>

              {/* Barber Profile Header */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={barber.avatarUrl}
                    alt={barber.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-700/80 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 rounded-full flex items-center space-x-0.5 text-xs text-amber-400 font-semibold tabular-nums">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span>{barber.rating}</span>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-zinc-100 truncate">
                    {barber.nickname}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{barber.title}</p>
                  <p className="text-xs text-zinc-400 mt-1 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>เข้างาน: {barber.workingHours} น.</span>
                  </p>
                </div>
              </div>

              {/* Bio summary */}
              <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                {barber.bio}
              </p>

              {/* Specialty Chips */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-zinc-800/60">
                {barber.specialty.slice(0, 3).map((spec, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 leading-normal font-normal"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {/* Details button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveModalBarber(barber);
                }}
                className="mt-3 w-full py-2 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs rounded-xl flex items-center justify-center space-x-1.5 transition border border-zinc-700/30"
              >
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>ดูผลงานและประวัติช่าง</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Barber Detail Modal */}
      {activeModalBarber && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="relative h-36">
              <img
                src={activeModalBarber.coverUrl}
                alt={activeModalBarber.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveModalBarber(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-900/80 text-zinc-300 hover:text-white flex items-center justify-center backdrop-blur-md"
              >
                ✕
              </button>
            </div>

            <div className="p-5 pt-0 -mt-10 relative">
              <div className="flex items-end justify-between">
                <img
                  src={activeModalBarber.avatarUrl}
                  alt={activeModalBarber.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-zinc-900 shadow-xl"
                />
                <div className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{activeModalBarber.rating} ({activeModalBarber.reviewCount} รีวิว)</span>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-base sm:text-lg font-bold text-zinc-100">{activeModalBarber.name}</h3>
                <p className="text-xs text-amber-400 font-medium">{activeModalBarber.title}</p>
              </div>

              <p className="text-xs text-zinc-300 mt-2.5 leading-relaxed">
                {activeModalBarber.bio}
              </p>

              <div className="grid grid-cols-2 gap-2.5 my-4 p-3.5 bg-zinc-950/70 rounded-2xl border border-zinc-800 text-xs">
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">ประสบการณ์</span>
                  <span className="font-semibold text-zinc-200 text-sm tabular-nums">{activeModalBarber.experienceYears} ปี</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">ตัดผมสำเร็จแล้ว</span>
                  <span className="font-semibold text-zinc-200 text-sm tabular-nums">{activeModalBarber.completedCuts.toLocaleString()} หัว</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">ประจำเก้าอี้</span>
                  <span className="font-semibold text-amber-400 text-sm">Station #{activeModalBarber.chairNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-xs mb-0.5">เวลาปฏิบัติงาน</span>
                  <span className="font-semibold text-zinc-200 text-sm">{activeModalBarber.workingHours} น.</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-zinc-300 block mb-2">ความเชี่ยวชาญพิเศษ</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalBarber.specialty.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 bg-zinc-800 text-amber-300 rounded-lg border border-zinc-700 font-medium"
                    >
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelect(activeModalBarber.id);
                    setActiveModalBarber(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg"
                >
                  เลือกช่างคนนี้ (Book {activeModalBarber.nickname})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
