import React, { useState } from 'react';
import { Scissors, Sparkles, Check, Clock, Shield, Tag } from 'lucide-react';
import { Service, ServiceCategory } from '../types';
import { soundFx } from '../utils/audio';
import { useBooking } from '../context/BookingContext';

interface ServiceSelectorProps {
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  selectedService,
  onSelectService,
}) => {
  const { services } = useBooking();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');

  const categories: { id: ServiceCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'haircut', label: '✂️ ตัดผม & เซ็ต' },
    { id: 'shave', label: '🪒 โกนหนวด & เครา' },
    { id: 'color_perm', label: '🎨 ดัด & ทำสี' },
    { id: 'package', label: '👑 VIP แพ็กเกจ' },
  ];

  const filteredServices = services.filter((s) => {
    if (s.isActive === false) return false;
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  const handleSelect = (s: Service) => {
    soundFx.playClick();
    onSelectService(s);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center space-x-1.5">
          <Scissors className="w-4 h-4 text-amber-400" />
          <span>เลือกรายการบริการตัดผม / ดูแลทรงผม</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          บริการระดับพรีเมียม รวมสระไดร์และเซ็ตผมด้วยโพเมดนำเข้า
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
              activeCategory === cat.id
                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services List */}
      <div className="space-y-2.5">
        {filteredServices.map((service) => {
          const isSelected = selectedService?.id === service.id;

          return (
            <div
              key={service.id}
              onClick={() => handleSelect(service)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start justify-between relative overflow-hidden ${
                isSelected
                  ? 'bg-zinc-900 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800 text-zinc-300'
              }`}
            >
              <div className="flex-1 pr-3">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-sm text-zinc-100">{service.name}</h4>
                  {service.tag && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 leading-normal">
                      {service.tag}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-center space-x-3 mt-2 text-xs text-zinc-400">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>ใช้เวลา ~{service.durationMinutes} นาที</span>
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-400 font-medium">
                    มัดจำ 50% เพียง ฿{(service.price / 2).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-2">
                <span className="text-lg font-bold text-amber-400 tabular-nums">
                  ฿{service.price.toLocaleString()}
                </span>
                <div
                  className={`mt-2 w-7 h-7 rounded-xl border flex items-center justify-center transition ${
                    isSelected
                      ? 'bg-amber-500 border-amber-400 text-zinc-950 font-bold shadow-md'
                      : 'border-zinc-700 bg-zinc-800 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
