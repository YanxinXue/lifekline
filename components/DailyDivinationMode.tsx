import React, { useState } from 'react';
import { RefreshCw, Sparkles, AlertTriangle, Compass, ScrollText, Briefcase, Coins, Heart, Activity } from 'lucide-react';
import { FORTUNE_STICKS } from '../data/fortuneSticks';
import { DivinationResult } from '../types';

const pickRandomStick = (previousId?: number) => {
  if (FORTUNE_STICKS.length <= 1) return FORTUNE_STICKS[0];

  let next = FORTUNE_STICKS[Math.floor(Math.random() * FORTUNE_STICKS.length)];
  while (next.id === previousId) {
    next = FORTUNE_STICKS[Math.floor(Math.random() * FORTUNE_STICKS.length)];
  }
  return next;
};

const getLevelColorClass = (fortuneLevel: string) => {
  if (fortuneLevel === '大吉') return 'bg-emerald-500 text-white';
  if (fortuneLevel === '吉') return 'bg-indigo-500 text-white';
  if (fortuneLevel === '中吉') return 'bg-amber-400 text-gray-900';
  if (fortuneLevel === '平') return 'bg-gray-200 text-gray-700';
  return 'bg-red-500 text-white';
};

const DailyDivinationMode: React.FC = () => {
  const [result, setResult] = useState<DivinationResult | null>(null);

  const drawStick = () => {
    setResult({
      stick: pickRandomStick(result?.stick.id),
      generatedAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    });
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
            当前为文化娱乐版黄大仙灵签，每次点击都会重新抽取一支签。
          </p>
          <button
            onClick={drawStick}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
            <Sparkles className="w-5 h-5" />
            抽取今日灵签
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
                onClick={drawStick}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg hover:bg-amber-50 transition-all font-bold text-sm self-start md:self-auto"
              >
                <RefreshCw className="w-4 h-4" />
                重新抽一签
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-gray-100">
            <section className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center gap-2 text-indigo-700 mb-4">
                <ScrollText className="w-5 h-5" />
                <h4 className="font-serif-sc font-bold text-xl">签诗</h4>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-serif-sc text-lg">{result.stick.poem}</p>
            </section>

            <section className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center gap-2 text-emerald-700 mb-4">
                <Compass className="w-5 h-5" />
                <h4 className="font-serif-sc font-bold text-xl">总解</h4>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.stick.meaning}</p>
            </section>

            <section className="p-6 md:p-8">
              <div className="flex items-center gap-2 text-amber-700 mb-4">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-serif-sc font-bold text-xl">今日建议</h4>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{result.stick.advice}</p>
              <p className="text-red-600 leading-relaxed whitespace-pre-wrap mt-4 text-sm font-medium">{result.stick.caution}</p>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <section className="p-6 border-b md:border-r lg:border-b-0 border-gray-100">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <Briefcase className="w-4 h-4" />
                <h4 className="font-bold">事业</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{result.stick.career}</p>
            </section>
            <section className="p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
              <div className="flex items-center gap-2 text-amber-700 mb-3">
                <Coins className="w-4 h-4" />
                <h4 className="font-bold">财运</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{result.stick.wealth}</p>
            </section>
            <section className="p-6 border-b md:border-b-0 md:border-r border-gray-100">
              <div className="flex items-center gap-2 text-pink-700 mb-3">
                <Heart className="w-4 h-4" />
                <h4 className="font-bold">感情</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{result.stick.love}</p>
            </section>
            <section className="p-6">
              <div className="flex items-center gap-2 text-emerald-700 mb-3">
                <Activity className="w-4 h-4" />
                <h4 className="font-bold">健康</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{result.stick.health}</p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyDivinationMode;
