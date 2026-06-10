import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Info,
  Loader2,
  Moon,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { generateAlmanacDay, generateAlmanacInterpretation, formatDateInputValue } from '../services/almanacService';
import { hasUsableDivinationApiConfig } from '../services/fortuneService';
import { AlmanacInterpretation, DivinationApiConfig } from '../types';

interface AlmanacModeProps {
  apiConfig: DivinationApiConfig;
  onRequestConfig: () => void;
}

const DetailItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
    <p className="text-sm font-bold text-gray-900 leading-relaxed">{value}</p>
  </div>
);

const TagList: React.FC<{ items: string[]; tone: 'good' | 'bad' | 'neutral' }> = ({ items, tone }) => {
  const toneClass = tone === 'good'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
    : tone === 'bad'
      ? 'bg-red-50 text-red-700 border-red-100'
      : 'bg-indigo-50 text-indigo-700 border-indigo-100';

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={`px-3 py-1.5 rounded-full border text-sm font-bold ${toneClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
};

const InterpretationCard: React.FC<{ interpretation: AlmanacInterpretation }> = ({ interpretation }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <p className="text-xs font-bold text-indigo-600 mb-1">总体判断</p>
      <p className="text-gray-800 leading-relaxed">{interpretation.summary}</p>
    </div>
    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
      <p className="text-xs font-bold text-emerald-700 mb-1">相对适合点</p>
      <p className="text-gray-800 leading-relaxed">{interpretation.suitable}</p>
    </div>
    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
      <p className="text-xs font-bold text-red-700 mb-1">需要注意的点</p>
      <p className="text-gray-800 leading-relaxed">{interpretation.risk}</p>
    </div>
    <div className="md:col-span-2 rounded-xl border border-amber-100 bg-amber-50 p-4">
      <p className="text-xs font-bold text-amber-700 mb-1">实际行动建议</p>
      <p className="text-gray-800 leading-relaxed">{interpretation.suggestion}</p>
    </div>
  </div>
);

const AlmanacMode: React.FC<AlmanacModeProps> = ({ apiConfig, onRequestConfig }) => {
  const [selectedDate, setSelectedDate] = useState(() => formatDateInputValue(new Date()));
  const [matter, setMatter] = useState('');
  const [interpretation, setInterpretation] = useState<AlmanacInterpretation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const almanac = useMemo(() => generateAlmanacDay(selectedDate), [selectedDate]);
  const isOnlineConfigured = hasUsableDivinationApiConfig(apiConfig);

  const handleDateChange = (dateText: string) => {
    setSelectedDate(dateText);
    setInterpretation(null);
    setAiError(null);
  };

  const handleTodayClick = () => {
    handleDateChange(formatDateInputValue(new Date()));
  };

  const handleGenerateInterpretation = async () => {
    if (!isOnlineConfigured) {
      onRequestConfig();
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setInterpretation(null);

    try {
      const nextInterpretation = await generateAlmanacInterpretation(almanac, { matter }, apiConfig);
      setInterpretation(nextInterpretation);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI 黄历解读失败';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in space-y-8">
      <div className="text-center">
        <p className="text-sm font-bold text-amber-600 tracking-widest uppercase mb-3">Chinese Almanac</p>
        <h2 className="text-4xl md:text-5xl font-serif-sc font-bold text-gray-900 mb-4">今日黄历</h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          基于本地农历规则计算宜忌、干支、冲煞与星宿，可结合具体事项生成克制解读。
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gray-900 text-amber-50 px-6 py-7 md:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-2">计算时间 {almanac.generatedAt}</p>
              <div className="flex items-center gap-3 mb-3">
                <CalendarDays className="w-7 h-7 text-amber-300" />
                <h3 className="text-3xl md:text-4xl font-serif-sc font-bold">{almanac.solarDate}</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-amber-50/10 border border-amber-50/20 text-amber-100">
                  {almanac.weekday}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50/10 border border-amber-50/20 text-amber-100">
                  农历 {almanac.lunarDate}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50/10 border border-amber-50/20 text-amber-100">
                  {almanac.zodiac}年
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="px-4 py-2.5 rounded-lg bg-white text-gray-900 border border-amber-100 focus:ring-2 focus:ring-amber-400 outline-none font-bold"
              />
              <button
                type="button"
                onClick={handleTodayClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 text-gray-900 hover:bg-white transition-all font-bold"
              >
                <Clock className="w-4 h-4" />
                回到今日
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xl font-serif-sc font-bold text-gray-900">宜</h4>
              </div>
              <TagList items={almanac.suitable} tone="good" />
            </section>

            <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-600" />
                <h4 className="text-xl font-serif-sc font-bold text-gray-900">忌</h4>
              </div>
              <TagList items={almanac.avoid} tone="bad" />
            </section>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DetailItem label="年干支" value={`${almanac.yearGanZhi}年`} />
            <DetailItem label="月干支" value={`${almanac.monthGanZhi}月`} />
            <DetailItem label="日干支" value={`${almanac.dayGanZhi}日`} />
            <DetailItem label="冲煞" value={`${almanac.clash} · 煞${almanac.sha}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h4 className="font-serif-sc font-bold text-lg text-gray-900">吉神</h4>
              </div>
              <TagList items={almanac.luckyGods} tone="neutral" />
            </section>

            <section className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-5 h-5 text-indigo-600" />
                <h4 className="font-serif-sc font-bold text-lg text-gray-900">星宿</h4>
              </div>
              <p className="text-gray-800 font-bold leading-relaxed">{almanac.star}</p>
            </section>

            <section className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h4 className="font-serif-sc font-bold text-lg text-gray-900">彭祖百忌</h4>
              </div>
              <div className="space-y-2">
                {almanac.pengZu.map(item => (
                  <p key={item} className="text-sm text-gray-700 leading-relaxed">{item}</p>
                ))}
              </div>
            </section>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">
              黄历为传统民俗参考，不代表确定预测；医疗、投资、法律、合同、生产安全等事项应以专业意见和现实条件为准。
            </p>
          </div>
        </div>
      </div>

      <section className="bg-white border border-gray-100 rounded-2xl shadow-xl p-6 md:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-2">AI Reference</p>
            <h3 className="text-2xl font-serif-sc font-bold text-gray-900">事项解读</h3>
            <p className="text-gray-500 text-sm mt-2">AI 只解释当前页面的黄历信息，不生成或覆盖黄历事实。</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">想看的事项（可选）</label>
          <textarea
            value={matter}
            onChange={e => setMatter(e.target.value)}
            placeholder="例如：今天适不适合签合同？是否适合搬家？不填写则按今日综合行动参考解读。"
            className="w-full h-28 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerateInterpretation}
          disabled={aiLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold rounded-xl shadow-lg transition-all"
        >
          {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {aiLoading ? '解读中...' : isOnlineConfigured ? '生成事项解读' : '配置后生成解读'}
        </button>

        {aiError && (
          <div className="flex items-start gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{aiError}</p>
          </div>
        )}

        {interpretation && <InterpretationCard interpretation={interpretation} />}
      </section>
    </div>
  );
};

export default AlmanacMode;
