import React, { useState } from 'react';
import { RefreshCw, Sparkles, AlertTriangle, Compass, ScrollText, Briefcase, Coins, Heart, Activity, Loader2 } from 'lucide-react';
import { FORTUNE_STICKS } from '../data/fortuneSticks';
import { generateFortuneInterpretation, hasUsableDivinationApiConfig } from '../services/fortuneService';
import { DivinationApiConfig, DivinationResult } from '../types';

interface DailyDivinationModeProps {
  apiConfig: DivinationApiConfig;
  mode: 'local' | 'online';
  onRequestConfig: () => void;
}

const DIVINATION_BROWSER_ID_KEY = 'lifekline_divination_browser_id';
let fallbackBrowserId = '';

const createBrowserId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(4);
    globalThis.crypto.getRandomValues(values);
    return Array.from(values, value => value.toString(36)).join('-');
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const getBrowserId = () => {
  if (typeof window === 'undefined') return 'server';

  try {
    const cachedId = window.localStorage.getItem(DIVINATION_BROWSER_ID_KEY);
    if (cachedId) return cachedId;

    const browserId = createBrowserId();
    window.localStorage.setItem(DIVINATION_BROWSER_ID_KEY, browserId);
    return browserId;
  } catch {
    if (!fallbackBrowserId) fallbackBrowserId = createBrowserId();
    return fallbackBrowserId;
  }
};

const getLocalDateSeed = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeQuestionSeed = (value: string) => value.trim().replace(/\s+/g, ' ') || '综合今日运势';

const hashSeed = (seed: string) => {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const pickSeededStick = (question: string) => {
  const seed = `${getLocalDateSeed()}|${getBrowserId()}|${normalizeQuestionSeed(question)}`;
  return FORTUNE_STICKS[hashSeed(seed) % FORTUNE_STICKS.length];
};

const getLevelColorClass = (fortuneLevel: string) => {
  if (fortuneLevel === '大吉') return 'bg-emerald-500 text-white';
  if (fortuneLevel === '吉') return 'bg-indigo-500 text-white';
  if (fortuneLevel === '中吉') return 'bg-amber-400 text-gray-900';
  if (fortuneLevel === '平') return 'bg-gray-200 text-gray-700';
  return 'bg-red-500 text-white';
};

const DailyDivinationMode: React.FC<DailyDivinationModeProps> = ({ apiConfig, mode, onRequestConfig }) => {
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [question, setQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const shouldShowAiSections = !aiLoading || mode !== 'online';

  const drawStick = async () => {
    const stick = pickSeededStick(question);
    const generatedAt = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    setResult({ stick, generatedAt });
    setAiError(null);

    if (mode !== 'online') return;

    if (!hasUsableDivinationApiConfig(apiConfig)) {
      onRequestConfig();
      return;
    }

    setAiLoading(true);
    try {
      const aiInterpretation = await generateFortuneInterpretation(stick, { question }, apiConfig);
      setResult(prev => {
        if (!prev || prev.stick.id !== stick.id || prev.generatedAt !== generatedAt) return prev;
        return { ...prev, aiInterpretation };
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI 解签失败';
      setAiError(message);
    } finally {
      setAiLoading(false);
    }
  };

  const returnToInput = () => {
    setResult(null);
    setAiError(null);
    setAiLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <p className="text-sm font-bold text-indigo-600 tracking-widest uppercase mb-3">Wong Tai Sin Fortune Stick</p>
        <h2 className="text-4xl md:text-5xl font-serif-sc font-bold text-gray-900 mb-4">黄大仙灵签</h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          从一百支灵签中随机抽取今日一签，查看吉凶等级、签诗、典故与分项提醒。
        </p>
      </div>

      {!result && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-serif-sc font-bold text-gray-900 mb-3">静心片刻，抽取今日灵签</h3>
          <p className="text-gray-500 max-w-xl mx-auto mb-8">
            当前为{mode === 'online' ? '在线 AI 解签模式' : '本地灵签模式'}，问题可填可不填。
          </p>
          <div className="max-w-xl mx-auto mb-6 text-left">
            <label className="block text-xs font-bold text-gray-600 mb-2">想问的问题（可选）</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="例如：最近是否适合换工作？不填写则按综合今日运势解读。"
              className="w-full h-28 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white"
            />
          </div>
          <button
            onClick={drawStick}
            disabled={aiLoading}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {aiLoading ? '解签中...' : '抽取今日灵签'}
          </button>
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gray-900 text-amber-50 px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-3">第 {result.stick.id} 签 · 生成时间 {result.generatedAt}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="w-20 h-28 rounded-xl bg-amber-50 text-gray-900 flex flex-col items-center justify-center shadow-lg border border-amber-200">
                    <span className="text-xs font-bold text-amber-700">灵签</span>
                    <span className="text-4xl font-serif-sc font-bold leading-none">{result.stick.id}</span>
                    <span className="text-xs text-gray-500 mt-1">/ 100</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-3xl md:text-4xl font-serif-sc font-bold tracking-wide">{result.stick.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getLevelColorClass(result.stick.fortuneLevel)}`}>
                        {result.stick.fortuneLevel}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-3 py-1 rounded-full bg-amber-50/10 border border-amber-50/20 text-xs font-bold text-amber-100">
                        原签等级：{result.stick.level}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-50/10 border border-amber-50/20 text-xs font-bold text-amber-100">
                        古人典故：{result.stick.story}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={returnToInput}
                disabled={aiLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-amber-50 disabled:bg-gray-200 transition-all font-bold text-sm self-start md:self-auto"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {aiLoading ? '解签中...' : '重新抽一签'}
              </button>
            </div>
          </div>

          {(question.trim() || mode === 'online' || aiError) && (
            <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-gray-700">
                  当前模式：{mode === 'online' ? '在线 AI 解签' : '本地灵签'}
                  {mode === 'online' && !result.aiInterpretation && aiLoading && ' · 正在生成个性化解读'}
                  {mode === 'online' && result.aiInterpretation && ' · 已生成个性化解读'}
                </p>
                {question.trim() && (
                  <p className="text-sm text-gray-600">所问问题：{question.trim()}</p>
                )}
                {aiError && (
                  <div className="flex items-start gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{aiError}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 border-b border-gray-100">
            <section className="px-6 py-6 md:px-8 lg:col-span-2 bg-white border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center justify-center gap-2 text-indigo-700 mb-4">
                <ScrollText className="w-5 h-5" />
                <h4 className="font-serif-sc font-bold text-xl">签诗</h4>
              </div>
              <div className="mx-auto max-w-sm border-y border-amber-200/80 py-3 md:py-4">
                <div className="space-y-1.5 text-center font-serif-sc text-lg md:text-xl leading-[1.7] tracking-[0.06em] md:tracking-[0.08em] text-gray-950">
                  {result.stick.poem.split('\n').map((line, index) => (
                    <p key={`${line}-${index}`} className="break-keep">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </section>

            <section className="px-6 py-6 md:px-8 lg:col-span-3 bg-white">
              <div className="flex items-center gap-2 text-emerald-700 mb-4">
                <Compass className="w-5 h-5" />
                <h4 className="font-serif-sc font-bold text-xl">总解</h4>
              </div>
              <p className="text-gray-700 leading-8 whitespace-pre-wrap">{result.stick.meaning}</p>
            </section>

            {shouldShowAiSections && (
                <section className="px-6 py-7 md:px-10 md:py-9 bg-white border-t border-gray-100 lg:col-span-5">
                  <div className="flex items-center gap-2 text-amber-700 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-serif-sc font-bold text-xl">今日建议</h4>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.aiInterpretation?.advice || result.stick.advice}</p>
                  <p className="text-red-600 leading-relaxed whitespace-pre-wrap mt-4 text-sm font-medium">{result.aiInterpretation?.caution || result.stick.caution}</p>
                </section>
            )}
          </div>

          {shouldShowAiSections && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <section className="p-6 border-b md:border-r lg:border-b-0 border-gray-100">
                  <div className="flex items-center gap-2 text-blue-700 mb-3">
                    <Briefcase className="w-4 h-4" />
                    <h4 className="font-bold">事业</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiInterpretation?.career || result.stick.career}</p>
                </section>
                <section className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
                  <div className="flex items-center gap-2 text-amber-700 mb-3">
                    <Coins className="w-4 h-4" />
                    <h4 className="font-bold">财运</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiInterpretation?.wealth || result.stick.wealth}</p>
                </section>
                <section className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
                  <div className="flex items-center gap-2 text-pink-700 mb-3">
                    <Heart className="w-4 h-4" />
                    <h4 className="font-bold">感情</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiInterpretation?.love || result.stick.love}</p>
                </section>
                <section className="p-6">
                  <div className="flex items-center gap-2 text-emerald-700 mb-3">
                    <Activity className="w-4 h-4" />
                    <h4 className="font-bold">健康</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.aiInterpretation?.health || result.stick.health}</p>
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyDivinationMode;
