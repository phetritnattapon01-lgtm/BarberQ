import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Camera,
  Check,
  Save,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  Percent,
  Armchair,
  User,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { Barber, BarberId } from '../types';
import { soundFx } from '../utils/audio';
import { useBooking } from '../context/BookingContext';

interface EditBarberModalProps {
  barber: Barber | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (barberId: BarberId, updates: Partial<Barber>) => void;
}

const BADGE_PRESETS = [
  '🏆 ช่างยอดนิยม',
  '✨ สไตล์โมเดิร์น',
  '💈 วินเทจมาสเตอร์',
  '🔥 คิวยอดฮิต',
  '⭐ ช่างมือโปร',
  '✂️ ผู้เชี่ยวชาญ',
];

const AVATAR_PRESETS = [
  {
    label: 'ช่างวินเทจ',
    url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ช่างเกาหลี',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'ช่างคลาสสิก',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&auto=format&fit=crop&q=80',
  },
  {
    label: 'สไตล์โมเดิร์น',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  },
];

export const EditBarberModal: React.FC<EditBarberModalProps> = ({
  barber,
  isOpen,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { shopSettings } = useBooking();
  const defaultWorkingHours = `${shopSettings?.openTime || '10:00'} - ${shopSettings?.closeTime || '20:30'}`;

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [chairNumber, setChairNumber] = useState(1);
  const [workingHours, setWorkingHours] = useState(defaultWorkingHours);
  const [commissionRate, setCommissionRate] = useState(60);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [specialtyText, setSpecialtyText] = useState('');
  const [bio, setBio] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync state whenever barber changes
  useEffect(() => {
    if (barber) {
      setName(barber.name || '');
      setNickname(barber.nickname || '');
      setTitle(barber.title || '');
      setBadge(barber.badge || '🏆 ช่างยอดนิยม');
      setChairNumber(barber.chairNumber || 1);
      setWorkingHours(barber.workingHours || defaultWorkingHours);
      setCommissionRate(barber.commissionRate ?? 60);
      setAvatarUrl(barber.avatarUrl || '');
      setExperienceYears(barber.experienceYears || 5);
      setSpecialtyText((barber.specialty || []).join(', '));
      setBio(barber.bio || '');
      setIsActive(barber.isActive !== false);
      setUploadError(null);
    }
  }, [barber, defaultWorkingHours]);

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

  if (!isOpen || !barber) return null;

  // Handle local image file upload and convert to base64
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    // Limit to 4MB
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('ขนาดรูปภาพต้องไม่เกิน 4MB');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
        soundFx.playClick();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const specialties = specialtyText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates: Partial<Barber> = {
      name: name.trim() || barber.name,
      nickname: nickname.trim() || barber.nickname,
      title: title.trim() || barber.title,
      badge: badge.trim() || barber.badge,
      chairNumber: Number(chairNumber) || 1,
      workingHours: workingHours.trim() || defaultWorkingHours,
      commissionRate: Math.min(100, Math.max(0, Number(commissionRate))),
      avatarUrl: avatarUrl.trim() || barber.avatarUrl,
      experienceYears: Number(experienceYears) || 1,
      specialty: specialties.length > 0 ? specialties : barber.specialty,
      bio: bio.trim(),
      isActive,
    };

    onSave(barber.id, updates);
    soundFx.playSuccess();
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cursor-default relative w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center space-x-2">
                <span>แก้ไขข้อมูลช่าง</span>
                <span className="text-amber-400 font-mono text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                  {barber.nickname}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                แก้ไขชื่อ, ตำแหน่ง, เก้าอี้, เวลาทำงาน, อัตราค่าคอม และรูปโปรไฟล์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-90 flex items-center justify-center transition cursor-pointer shrink-0 z-10"
            title="ปิดหน้าต่าง"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Form */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Live Card Preview Box */}
          <div className="bg-zinc-950 rounded-2xl border border-amber-500/30 p-3.5 sm:p-4 relative overflow-hidden shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ตัวอย่างการแสดงผลหน้าร้าน (Live Preview)</span>
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {isActive ? '🟢 เปิดรับคิว' : '🔴 ปิดรับคิวชั่วคราว'}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl || barber.avatarUrl}
                  alt={name || barber.name}
                  className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-md ${
                    !isActive ? 'border-zinc-700 grayscale' : 'border-amber-500/60'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = barber.avatarUrl;
                  }}
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                    !isActive ? 'bg-rose-500' : 'bg-emerald-400'
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h4 className="font-bold text-sm text-zinc-100 truncate">
                    {name || 'ชื่อช่าง'}
                  </h4>
                  {badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {title || 'ตำแหน่งความชำนาญ'}
                </p>
                <div className="flex items-center space-x-2 text-[11px] text-zinc-400 mt-1 flex-wrap gap-y-0.5">
                  <span className="text-amber-400 font-mono font-medium">เก้าอี้ #{chairNumber}</span>
                  <span>•</span>
                  <span>เวลา: {workingHours} น.</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono font-bold">คอมมิชชั่น {commissionRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Avatar Upload & Management */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-zinc-200 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>รูปโปรไฟล์ช่าง (Profile Picture)</span>
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">อัปโหลดรูปจากมือถือได้</span>
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition shadow-md cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>เลือกรูปจากเครื่อง / ถ่ายภาพ</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1 w-full">
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="หรือระบุ URL รูปภาพ (https://...)"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {uploadError && (
              <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
            )}

            {/* Quick Preset Avatars */}
            <div className="flex items-center space-x-2 pt-1 overflow-x-auto pb-1">
              <span className="text-[11px] text-zinc-400 shrink-0">รูปตัวอย่าง:</span>
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition shrink-0 flex items-center space-x-1 ${
                    avatarUrl === preset.url
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Personal & Identity Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-200 block mb-1">
                ชื่อ-นามสกุลจริง
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น กิตติศักดิ์ วรเดช (ช่างท็อป)"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-200 block mb-1">
                ชื่อเรียกสั้น / ชื่อเล่น
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น ช่างท็อป"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-200 block mb-1">
                ตำแหน่ง / สไตล์ความชำนาญ (Title)
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น Master Fade & Vintage Specialist"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-200 block mb-1 flex items-center justify-between">
                <span>ป้ายกำกับ / ฉายา (Badge)</span>
                <span className="text-[11px] text-zinc-400 font-normal">คลิกเลือกด่วนได้</span>
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="เช่น 🏆 ช่างยอดนิยม"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-medium mb-1.5"
              />
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                {BADGE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBadge(p)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                      badge === p
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Station, Hours & Commission */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-800">
            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1 mb-1">
                <Armchair className="w-3.5 h-3.5 text-amber-400" />
                <span>เก้าอี้ประจำโต๊ะ</span>
              </label>
              <select
                value={chairNumber}
                onChange={(e) => setChairNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>เก้าอี้ #1 (Station 1)</option>
                <option value={2}>เก้าอี้ #2 (Station 2)</option>
                <option value={3}>เก้าอี้ #3 (Station 3)</option>
                <option value={4}>เก้าอี้ #4 (Station 4)</option>
                <option value={5}>เก้าอี้ #5 (Station 5)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center space-x-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>เวลาปฏิบัติงาน</span>
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder={defaultWorkingHours}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-200 flex items-center justify-between mb-1">
                <span className="flex items-center space-x-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ค่าคอมช่าง</span>
                </span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{commissionRate}%</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min={20}
                  max={90}
                  step={5}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-14 px-1.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-emerald-400 text-center"
                />
              </div>
              <span className="text-[10px] text-zinc-400 block mt-1">
                ส่วนแบ่งร้าน: {100 - commissionRate}%
              </span>
            </div>
          </div>

          {/* Section 4: Specialty & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-zinc-200 block mb-1">
                ประสบการณ์ (ปี)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-zinc-200 block mb-1">
                ความเชี่ยวชาญพิเศษ (คั่นด้วยจุลภาค ,)
              </label>
              <input
                type="text"
                value={specialtyText}
                onChange={(e) => setSpecialtyText(e.target.value)}
                placeholder="เช่น Skin Fade, Vintage Pompadour, ตกแต่งหนวดเครา"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 5: Status Active Toggle */}
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-zinc-200 block">
                สถานะพร้อมให้บริการคิวตัดผม
              </span>
              <span className="text-[11px] text-zinc-400">
                {isActive
                  ? 'ช่างพร้อมรับคิว ลูกค้าสามารถกดจองได้ตามปกติ'
                  : 'ปิดรับคิวชั่วคราว ลูกค้าจะไม่สามารถเลือกจองช่างท่านนี้ได้'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-500'}`}
              />
              <span>{isActive ? '🟢 เปิดรับคิว' : '🔴 ปิดรับคิว (ลา/พัก)'}</span>
            </button>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-lg shadow-amber-500/25 flex items-center space-x-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
