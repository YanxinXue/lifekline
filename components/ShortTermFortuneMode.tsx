import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CalendarDays, CheckCircle, Copy, Loader2, Pencil, Sparkles, Upload } from 'lucide-react';
import { BaziProfile, DivinationApiConfig, FortunePeriodContext, FortunePeriodType, ResolvedBaziProfile, ShortTermFortuneResult as ResultType } from '../types';
import { hasUsableDivinationApiConfig } from '../services/fortuneService';
import { buildShortTermFortunePrompt, generateShortTermFortune, parseShortTermFortuneContent } from '../services/shortTermFortuneService';
import { generateFortunePeriodContext, getSolarMonthOptions, getTodayInShanghai, shiftPeriodReferenceDate } from '../services/fortunePeriodCalculator';
import { resolveBaziProfile } from '../services/baziProfileStorage';
import BaziProfileForm from './BaziProfileForm';
import ShortTermFortuneResult from './ShortTermFortuneResult';

interface ShortTermFortuneModeProps {
  type: FortunePeriodType;
  profile: BaziProfile | null;
  apiConfig: DivinationApiConfig;
  storageMessage: string | null;
  onSaveProfile: (profile: BaziProfile) => void;
  onClearProfile: () => void;
  onRequestConfig: () => void;
}

const ShortTermFortuneMode: React.FC<ShortTermFortuneModeProps> = ({
  type,
  profile,
  apiConfig,
  storageMessage,
  onSaveProfile,
  onClearProfile,
  onRequestConfig,
}) => {
  const [referenceDate, setReferenceDate] = useState(getTodayInShanghai);
  const [editingProfile, setEditingProfile] = useState(!profile);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultType | null>(null);
  const [manualPrompt, setManualPrompt] = useState('');
  const [manualJson, setManualJson] = useState('');
  const [manualContext, setManualContext] = useState<FortunePeriodContext | null>(null);
  const [manualResolved, setManualResolved] = useState<ResolvedBaziProfile | null>(null);
  const [copied, setCopied] = useState(false);

  const resolved = useMemo(() => {
    if (!profile) return null;
    try {
      return resolveBaziProfile(profile);
    } catch {
      return null;
    }
  }, [profile]);

  const context = useMemo(() => {
    if (!profile) return null;
    try {
      return generateFortunePeriodContext(profile, type, referenceDate);
    } catch {
      return null;
    }
  }, [profile, referenceDate, type]);

  const monthOptions = useMemo(() => (
    type === 'month' ? getSolarMonthOptions(Number(referenceDate.slice(0, 4))) : []
  ), [referenceDate, type]);

  const selectedMonthValue = type === 'month' && context
    ? monthOptions.find(option => option.startDateTime === context.startDateTime)?.value || referenceDate
    : referenceDate;

  const resetOutput = () => {
    setResult(null);
    setError(null);
    setManualPrompt('');
    setManualJson('');
    setManualContext(null);
    setManualResolved(null);
    setProgress('');
  };

  const showManualFlow = (nextResolved: ResolvedBaziProfile, nextContext: FortunePeriodContext) => {
    setManualResolved(nextResolved);
    setManualContext(nextContext);
    setManualPrompt(buildShortTermFortunePrompt(nextResolved, nextContext));
  };

  const generate = async (nextProfile: BaziProfile, nextResolved: ResolvedBaziProfile) => {
    resetOutput();
    onSaveProfile(nextProfile);
    setEditingProfile(false);
    const nextContext = generateFortunePeriodContext(nextProfile, type, referenceDate);

    if (!hasUsableDivinationApiConfig(apiConfig)) {
      showManualFlow(nextResolved, nextContext);
      return;
    }

    setIsGenerating(true);
    try {
      const nextResult = await generateShortTermFortune(nextResolved, nextContext, apiConfig, setProgress);
      setResult(nextResult);
    } catch (generationError: unknown) {
      setError(generationError instanceof Error ? generationError.message : '在线生成失败。');
      setManualResolved(nextResolved);
      setManualContext(nextContext);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromSavedProfile = async () => {
    if (!profile || !resolved) {
      setError('缓存档案无法重新排盘，请修改资料后再试。');
      setEditingProfile(true);
      return;
    }
    await generate(profile, resolved);
  };

  const handleShift = (direction: -1 | 1) => {
    if (!context) return;
    setReferenceDate(shiftPeriodReferenceDate(context, direction));
    resetOutput();
  };

  const handleManualImport = () => {
    if (!manualContext) return;
    try {
      setResult(parseShortTermFortuneContent(manualJson, manualContext));
      setError(null);
    } catch (importError: unknown) {
      setError(importError instanceof Error ? importError.message : 'JSON 解析失败。');
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(manualPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('复制失败，请手动选择提示词复制。');
    }
  };

  if (result) return <ShortTermFortuneResult result={result} onReset={resetOutput} />;

  if (editingProfile || !profile) {
    return (
      <BaziProfileForm
        key={profile ? `${profile.source}-${profile.updatedAt}` : 'empty-profile'}
        initialProfile={profile}
        onSubmit={generate}
        onClear={() => { onClearProfile(); setEditingProfile(true); resetOutput(); }}
        isSubmitting={isGenerating}
        submitLabel={`保存并生成${type === 'week' ? '周运' : '月运'}`}
        helperText={hasUsableDivinationApiConfig(apiConfig) ? '提交后将直接调用已配置的在线 AI' : '未配置在线 AI，提交后将进入复制提示词流程'}
        storageMessage={storageMessage}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">当前生辰档案</p>
            <h2 className="mt-1 text-xl font-serif-sc font-bold text-gray-900">{profile.name || '未命名用户'} · {profile.gender === 'Male' ? '乾造' : '坤造'}</h2>
            {resolved ? <p className="mt-2 text-sm font-serif-sc text-gray-600">{resolved.yearPillar}　{resolved.monthPillar}　{resolved.dayPillar}　{resolved.hourPillar}</p> : null}
            <p className="mt-2 text-xs text-emerald-700">已从当前浏览器载入 · {profile.source === 'auto' ? `${profile.cityName}，自动排盘` : '手工四柱'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditingProfile(true)} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"><Pencil className="w-4 h-4" />修改资料</button>
            <button type="button" onClick={() => { onClearProfile(); setEditingProfile(true); resetOutput(); }} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50">清除</button>
          </div>
        </div>
        {storageMessage ? <p className="mt-3 text-xs text-blue-700">{storageMessage}</p> : null}
      </section>

      <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-5 md:p-6">
        <div className="flex items-center gap-2 text-indigo-800 font-bold"><CalendarDays className="w-5 h-5" />选择{type === 'week' ? '周' : '节气月'}</div>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => handleShift(-1)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700"><ArrowLeft className="w-4 h-4" />上一{type === 'week' ? '周' : '月'}</button>
          {type === 'month' ? (
            <select
              value={selectedMonthValue}
              onChange={event => { setReferenceDate(event.target.value); resetOutput(); }}
              className="flex-1 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-center font-bold text-gray-800"
              aria-label="节气月选择"
            >
              {monthOptions.map(option => <option key={option.startDateTime} value={option.value}>{option.label}</option>)}
            </select>
          ) : (
            <input type="date" value={referenceDate} onChange={event => { setReferenceDate(event.target.value); resetOutput(); }} className="flex-1 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-center font-bold text-gray-800" aria-label="运势参考日期" />
          )}
          <button type="button" onClick={() => handleShift(1)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700">下一{type === 'week' ? '周' : '月'}<ArrowRight className="w-4 h-4" /></button>
          <button type="button" onClick={() => { setReferenceDate(getTodayInShanghai()); resetOutput(); }} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200">当前</button>
        </div>
        {context ? (
          <div className="mt-5 rounded-xl bg-white/80 p-4 text-sm text-gray-700">
            <p className="font-bold">{context.startDateTime} ～ {context.endDateTime}</p>
            <p className="mt-2">大运：{context.daYun}　流年：{context.liuNian}　流月：{context.liuYueSegments.map(segment => segment.ganZhi).join(' → ')}</p>
            <p className="mt-2 text-xs text-indigo-700">
              日主：{context.baziInteractions.dayMaster.value}{context.baziInteractions.dayMaster.element} ·
              月令：{context.baziInteractions.monthCommand.branch}（{context.baziInteractions.monthCommand.relationToDayMaster}）
            </p>
            <p className="mt-1 text-xs text-gray-500">已在本地计算十神、藏干、五行计数及原局与大运、流年、流月、流日的合冲刑害。</p>
            {context.liuYueSegments.length > 1 ? <p className="mt-1 text-xs text-amber-700">本周期跨越节气，已按节气前后分别计算流月。</p> : null}
            {context.daYunBasis === 'manual-age-range' ? <p className="mt-1 text-xs text-gray-500">手工档案的大运按虚岁区间推算。</p> : null}
          </div>
        ) : <p className="mt-4 text-sm text-red-600">周期数据计算失败，请修改生辰资料。</p>}
      </section>

      <button type="button" onClick={generateFromSavedProfile} disabled={isGenerating || !context} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-4 font-bold text-white shadow-lg disabled:from-gray-400 disabled:to-gray-500">
        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        {isGenerating ? progress || '正在生成…' : `生成${type === 'week' ? '本周' : '本月'}运势`}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <div className="flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" /><p>{error}</p></div>
          {manualResolved && manualContext && !manualPrompt ? <button type="button" onClick={() => showManualFlow(manualResolved, manualContext)} className="mt-3 font-bold text-indigo-700">改用复制提示词流程</button> : null}
        </div>
      ) : null}

      {!hasUsableDivinationApiConfig(apiConfig) && !manualPrompt ? (
        <button type="button" onClick={onRequestConfig} className="w-full rounded-lg border border-indigo-200 bg-white px-4 py-3 text-sm font-bold text-indigo-700">配置在线 AI</button>
      ) : null}

      {manualPrompt ? (
        <section className="rounded-2xl border border-blue-100 bg-white p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800">复制提示词到任意 AI</h3>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-xs text-gray-700">{manualPrompt}</pre>
          <button type="button" onClick={copyPrompt} className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white ${copied ? 'bg-emerald-500' : 'bg-indigo-600'}`}>
            {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? '已复制' : '复制完整提示词'}
          </button>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><Upload className="w-4 h-4" />粘贴 AI 返回的 JSON</label>
            <textarea value={manualJson} onChange={event => setManualJson(event.target.value)} className="mt-2 h-52 w-full resize-none rounded-xl border border-gray-300 p-3 font-mono text-xs" placeholder="粘贴 JSON 内容" />
          </div>
          <button type="button" onClick={handleManualImport} disabled={!manualJson.trim()} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:bg-gray-400">生成运势报告</button>
        </section>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-gray-400">传统命理解读仅供文化参考，不构成医疗、投资、法律或其他专业建议。</p>
    </div>
  );
};

export default ShortTermFortuneMode;
