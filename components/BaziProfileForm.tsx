import React, { useMemo, useRef, useState } from 'react';
import { Calendar, CheckCircle, Database, Loader2, MapPin, Sparkles, Trash2 } from 'lucide-react';
import { BaziProfile, Gender, ResolvedBaziProfile } from '../types';
import { calculateBazi } from '../services/baziCalculator';
import { JIAZI, getDaYunDirection } from '../services/promptBuilder';
import CitySelector from './CitySelector';

interface BaziProfileFormProps {
  initialProfile: BaziProfile | null;
  onSubmit: (profile: BaziProfile, resolved: ResolvedBaziProfile) => void | Promise<void>;
  onClear?: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
  helperText?: string;
  storageMessage?: string | null;
}

interface ManualFields {
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

const EMPTY_MANUAL_FIELDS: ManualFields = {
  birthYear: '',
  yearPillar: '',
  monthPillar: '',
  dayPillar: '',
  hourPillar: '',
  startAge: '',
  firstDaYun: '',
};

const isPillar = (value: string) => JIAZI.includes(value.trim());

interface BirthDateParts {
  year: string;
  month: string;
  day: string;
}

const splitBirthDate = (value: string): BirthDateParts => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { year: match[1], month: match[2], day: match[3] } : { year: '', month: '', day: '' };
};

const toBirthDate = ({ year, month, day }: BirthDateParts) => {
  if (year.length !== 4 || month.length !== 2 || day.length !== 2) return '';
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);
  const leapYear = yearNumber % 4 === 0 && (yearNumber % 100 !== 0 || yearNumber % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthNumber - 1];
  if (yearNumber < 1 || !daysInMonth || dayNumber < 1 || dayNumber > daysInMonth) return '';
  return `${year}-${month}-${day}`;
};

const BaziProfileForm: React.FC<BaziProfileFormProps> = ({
  initialProfile,
  onSubmit,
  onClear,
  isSubmitting = false,
  submitLabel,
  helperText,
  storageMessage,
}) => {
  const [source, setSource] = useState<'auto' | 'manual'>(initialProfile?.source || 'auto');
  const [name, setName] = useState(initialProfile?.name || '');
  const [gender, setGender] = useState(initialProfile?.gender || Gender.MALE);
  const [birthDate, setBirthDate] = useState(initialProfile?.source === 'auto' ? initialProfile.birthDate : '');
  const [birthDateParts, setBirthDateParts] = useState<BirthDateParts>(() => (
    splitBirthDate(initialProfile?.source === 'auto' ? initialProfile.birthDate : '')
  ));
  const [birthTime, setBirthTime] = useState(initialProfile?.source === 'auto' ? initialProfile.birthTime : '');
  const [cityName, setCityName] = useState(initialProfile?.source === 'auto' ? initialProfile.cityName : '北京');
  const [longitude, setLongitude] = useState(initialProfile?.source === 'auto' ? initialProfile.longitude : 116.4);
  const [manual, setManual] = useState<ManualFields>(initialProfile?.source === 'manual' ? {
    birthYear: initialProfile.birthYear,
    yearPillar: initialProfile.yearPillar,
    monthPillar: initialProfile.monthPillar,
    dayPillar: initialProfile.dayPillar,
    hourPillar: initialProfile.hourPillar,
    startAge: initialProfile.startAge,
    firstDaYun: initialProfile.firstDaYun,
  } : EMPTY_MANUAL_FIELDS);
  const [error, setError] = useState<string | null>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);
  const monthInputRef = useRef<HTMLInputElement>(null);
  const dayInputRef = useRef<HTMLInputElement>(null);

  const handleBirthDatePartChange = (field: keyof BirthDateParts, rawValue: string) => {
    const maximumLength = field === 'year' ? 4 : 2;
    const value = rawValue.replace(/\D/g, '').slice(0, maximumLength);
    const next = { ...birthDateParts, [field]: value };
    setBirthDateParts(next);
    setBirthDate(toBirthDate(next));
    setError(null);
    if (value.length !== maximumLength) return;
    if (field === 'year') monthInputRef.current?.focus();
    if (field === 'month') dayInputRef.current?.focus();
  };

  const handleBirthDatePartKeyDown = (field: keyof BirthDateParts, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Backspace' || birthDateParts[field]) return;
    if (field === 'month') yearInputRef.current?.focus();
    if (field === 'day') monthInputRef.current?.focus();
  };

  const automaticCalculation = useMemo(() => {
    if (!birthDate || !birthTime) return { result: null, error: null };
    try {
      return {
        result: calculateBazi({ birthDate, birthTime, longitude, gender }),
        error: null,
      };
    } catch (calculationError: unknown) {
      return {
        result: null,
        error: calculationError instanceof Error ? calculationError.message : '排盘失败',
      };
    }
  }, [birthDate, birthTime, gender, longitude]);

  const handleManualChange = (field: keyof ManualFields, value: string) => {
    setManual(previous => ({ ...previous, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const updatedAt = new Date().toISOString();

    if (source === 'auto') {
      if (!birthDate || !birthTime || !cityName.trim() || !automaticCalculation.result) {
        setError(automaticCalculation.error || '请完整填写出生日期、时间和城市。');
        return;
      }
      const profile: BaziProfile = {
        version: 1,
        source: 'auto',
        name: name.trim(),
        gender,
        birthDate,
        birthTime,
        cityName: cityName.trim(),
        longitude,
        updatedAt,
      };
      const result = automaticCalculation.result;
      await onSubmit(profile, {
        profile,
        name: profile.name,
        gender,
        birthYear: birthDate.slice(0, 4),
        yearPillar: result.yearPillar,
        monthPillar: result.monthPillar,
        dayPillar: result.dayPillar,
        hourPillar: result.hourPillar,
        startAge: String(result.startAge),
        firstDaYun: result.firstDaYun,
      });
      return;
    }

    const birthYear = Number(manual.birthYear);
    const startAge = Number(manual.startAge);
    const pillarsValid = [manual.yearPillar, manual.monthPillar, manual.dayPillar, manual.hourPillar, manual.firstDaYun]
      .every(isPillar);
    if (!Number.isInteger(birthYear) || birthYear < 1 || birthYear > 9999 ||
      !Number.isInteger(startAge) || startAge < 1 || startAge > 100 || !pillarsValid) {
      setError('请检查出生年份、四柱、起运年龄和第一步大运，干支需为有效六十甲子。');
      return;
    }

    const profile: BaziProfile = {
      version: 1,
      source: 'manual',
      name: name.trim(),
      gender,
      ...manual,
      yearPillar: manual.yearPillar.trim(),
      monthPillar: manual.monthPillar.trim(),
      dayPillar: manual.dayPillar.trim(),
      hourPillar: manual.hourPillar.trim(),
      firstDaYun: manual.firstDaYun.trim(),
      updatedAt,
    };
    await onSubmit(profile, { profile, name: profile.name, gender, ...manual });
  };

  const direction = manual.yearPillar
    ? getDaYunDirection(manual.yearPillar, gender).text
    : '等待输入年柱';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-100 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-serif-sc text-gray-800">生辰档案</h2>
        <p className="text-sm text-gray-500 mt-1">输入一次并成功生成后，下次将在当前浏览器自动载入</p>
      </div>

      {initialProfile ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>已载入本机档案 · 更新于 {new Date(initialProfile.updatedAt).toLocaleString('zh-CN', { hour12: false })}</span>
          </div>
          {onClear ? (
            <button type="button" onClick={onClear} className="inline-flex items-center gap-1 font-bold text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />清除资料
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
        <button type="button" onClick={() => { setSource('auto'); setError(null); }} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${source === 'auto' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
          出生信息自动排盘
        </button>
        <button type="button" onClick={() => { setSource('manual'); setError(null); }} className={`rounded-lg px-3 py-2 text-sm font-bold transition ${source === 'manual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}>
          已有八字手工输入
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">姓名（可选）</label>
          <input value={name} onChange={event => setName(event.target.value)} placeholder="姓名" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">性别</label>
          <select value={gender} onChange={event => setGender(event.target.value as Gender)} className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            <option value={Gender.MALE}>乾造（男）</option>
            <option value={Gender.FEMALE}>坤造（女）</option>
          </select>
        </div>
      </div>

      {source === 'auto' ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-800"><Calendar className="w-4 h-4" />出生时间（北京时间）</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex w-full items-center rounded-lg border border-emerald-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500" aria-label="出生日期">
              <input ref={yearInputRef} type="text" inputMode="numeric" autoComplete="bday-year" value={birthDateParts.year} onChange={event => handleBirthDatePartChange('year', event.target.value)} onKeyDown={event => handleBirthDatePartKeyDown('year', event)} onFocus={event => event.currentTarget.select()} className="min-w-0 flex-[2] bg-transparent text-center outline-none" placeholder="YYYY" maxLength={4} aria-label="出生年份" />
              <span className="text-gray-400" aria-hidden="true">/</span>
              <input ref={monthInputRef} type="text" inputMode="numeric" autoComplete="bday-month" value={birthDateParts.month} onChange={event => handleBirthDatePartChange('month', event.target.value)} onKeyDown={event => handleBirthDatePartKeyDown('month', event)} onFocus={event => event.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-center outline-none" placeholder="MM" maxLength={2} aria-label="出生月份" />
              <span className="text-gray-400" aria-hidden="true">/</span>
              <input ref={dayInputRef} type="text" inputMode="numeric" autoComplete="bday-day" value={birthDateParts.day} onChange={event => handleBirthDatePartChange('day', event.target.value)} onKeyDown={event => handleBirthDatePartKeyDown('day', event)} onFocus={event => event.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-center outline-none" placeholder="DD" maxLength={2} aria-label="出生日期" />
            </div>
            <input type="time" value={birthTime} onChange={event => setBirthTime(event.target.value)} className="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white" aria-label="出生时间" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-600"><MapPin className="w-3 h-3" />出生地用于真太阳时校正</div>
          <CitySelector value={cityName} onChange={(nextLongitude, nextCityName) => { setLongitude(nextLongitude); setCityName(nextCityName); }} />
          {automaticCalculation.error ? <p className="text-xs text-red-600">{automaticCalculation.error}</p> : null}
          {automaticCalculation.result ? (
            <div className="rounded-lg bg-white px-4 py-3 text-sm text-emerald-800 border border-emerald-200">
              <div className="flex items-center gap-2 font-bold"><CheckCircle className="w-4 h-4" />已自动排盘</div>
              <p className="mt-1 font-serif-sc">{automaticCalculation.result.yearPillar}　{automaticCalculation.result.monthPillar}　{automaticCalculation.result.dayPillar}　{automaticCalculation.result.hourPillar}</p>
              <p className="mt-1 text-xs">起运 {automaticCalculation.result.startAge} 岁 · 第一步大运 {automaticCalculation.result.firstDaYun}</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">出生年份（公历）</label>
            <input type="number" value={manual.birthYear} onChange={event => handleManualChange('birthYear', event.target.value)} className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white" placeholder="如 1990" aria-label="出生年份" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'] as const).map((field, index) => (
              <div key={field}>
                <label className="block text-xs font-bold text-gray-600 mb-1">{['年柱', '月柱', '日柱', '时柱'][index]}</label>
                <input value={manual[field]} onChange={event => handleManualChange(field, event.target.value)} className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white text-center font-serif-sc font-bold" placeholder={['甲子', '乙丑', '丙寅', '丁卯'][index]} aria-label={['年柱', '月柱', '日柱', '时柱'][index]} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">起运年龄（虚岁）</label>
              <input type="number" value={manual.startAge} onChange={event => handleManualChange('startAge', event.target.value)} className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white" aria-label="起运年龄" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">第一步大运</label>
              <input value={manual.firstDaYun} onChange={event => handleManualChange('firstDaYun', event.target.value)} className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white text-center font-serif-sc font-bold" aria-label="第一步大运" />
            </div>
          </div>
          <p className="text-center text-xs text-amber-700">大运方向：<strong>{direction}</strong>；短周期分析按虚岁区间推算大运。</p>
        </div>
      )}

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
      {storageMessage ? <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{storageMessage}</p> : null}
      <p className="text-xs leading-relaxed text-gray-500">资料仅保存在当前浏览器；更换设备、无痕模式或清理网站数据后不会保留。生成分析时，排盘信息会发送给你配置的 AI 服务。</p>
      {helperText ? <p className="text-center text-sm text-gray-500">{helperText}</p> : null}
      <button type="submit" disabled={isSubmitting} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 font-bold text-white shadow-lg disabled:from-gray-400 disabled:to-gray-500">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {isSubmitting ? '正在生成…' : submitLabel}
      </button>
    </form>
  );
};

export default BaziProfileForm;
