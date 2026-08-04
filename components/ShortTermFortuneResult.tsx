import React from 'react';
import { AlertTriangle, BriefcaseBusiness, Heart, HeartPulse, Lightbulb, ShieldAlert, Sparkles, WalletCards } from 'lucide-react';
import { FortuneDimension, ShortTermFortuneResult as ResultType } from '../types';

interface ShortTermFortuneResultProps {
  result: ResultType;
  onReset: () => void;
}

const TREND_LABELS: Record<ResultType['trend'], string> = {
  up: '趋势上升',
  stable: '整体平稳',
  volatile: '波动较多',
  cautious: '宜谨慎',
};

const DimensionCard: React.FC<{
  title: string;
  dimension: FortuneDimension;
  icon: React.ReactNode;
  color: string;
}> = ({ title, dimension, icon, color }) => (
  <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <div className={`flex items-center gap-2 font-bold ${color}`}>{icon}{title}</div>
      <span className="text-xl font-black text-gray-800">{dimension.score}</span>
    </div>
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${dimension.score}%` }} />
    </div>
    <p className="mt-4 text-sm leading-relaxed text-gray-700">{dimension.summary}</p>
    <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">建议：{dimension.advice}</p>
  </article>
);

const ShortTermFortuneResult: React.FC<ShortTermFortuneResultProps> = ({ result, onReset }) => {
  const periodName = result.period.type === 'week' ? '本周运势' : '本月运势';
  const interactions = result.period.baziInteractions;
  const periodRelations = [
    ...interactions.natalRelations,
    ...interactions.daYun.relations,
    ...interactions.liuNian.relations,
    ...interactions.liuYueSegments.flatMap(segment => segment.relations),
  ];
  const relationDetails = Array.from(new Set(periodRelations.map(relation => relation.detail))).slice(0, 12);
  return (
    <div className="w-full max-w-5xl space-y-6 animate-fade-in">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 md:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <p className="text-sm text-indigo-200">{periodName}</p>
            <h2 className="mt-1 text-2xl md:text-3xl font-serif-sc font-bold">{result.period.startDateTime.slice(0, 16)} ～ {result.period.endDateTime.slice(0, 16)}</h2>
            <p className="mt-3 text-sm text-indigo-100">大运 {result.period.daYun} · 流年 {result.period.liuNian} · {result.period.liuYueSegments.map(item => item.ganZhi).join(' / ')}月</p>
            {result.period.daYunBasis === 'manual-age-range' ? <p className="mt-1 text-xs text-amber-200">手工档案的大运按虚岁区间推算</p> : null}
          </div>
          <div className="flex items-end gap-3">
            <div className="text-right">
              <p className="text-xs text-indigo-200">趋势指数</p>
              <p className="text-5xl font-black">{result.overallScore}</p>
            </div>
            <span className="mb-1 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">{TREND_LABELS[result.trend]}</span>
          </div>
        </div>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-100">{result.summary}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <DimensionCard title="事业" dimension={result.career} icon={<BriefcaseBusiness className="w-5 h-5" />} color="text-indigo-600" />
        <DimensionCard title="财运" dimension={result.wealth} icon={<WalletCards className="w-5 h-5" />} color="text-emerald-600" />
        <DimensionCard title="感情" dimension={result.relationship} icon={<Heart className="w-5 h-5" />} color="text-rose-600" />
        <DimensionCard title="健康" dimension={result.health} icon={<HeartPulse className="w-5 h-5" />} color="text-amber-600" />
      </div>

      <details className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-indigo-800">查看本地命理计算依据</summary>
        <div className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="font-bold">日主与月令</p>
            <p className="mt-2">日主：{interactions.dayMaster.value} · {interactions.dayMaster.element} · {interactions.dayMaster.yinYang}</p>
            <p className="mt-1">月令：{interactions.monthCommand.branch} · {interactions.monthCommand.mainElement} · {interactions.monthCommand.relationToDayMaster}</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-bold">五行出现次数</p>
            <p className="mt-2">{Object.entries(interactions.elementCounts).map(([element, count]) => `${element}${count}`).join('　')}</p>
            <p className="mt-2 text-xs text-gray-500">{interactions.elementCountBasis}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-bold text-gray-800">主要结构关系</p>
          {relationDetails.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {relationDetails.map(detail => <span key={detail} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">{detail}</span>)}
            </div>
          ) : <p className="mt-2 text-xs text-gray-500">当前层级未形成已收录的合冲刑害关系。</p>}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-gray-500">{interactions.interpretationBoundary}</p>
      </details>

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-xl font-serif-sc font-bold text-gray-800"><Sparkles className="w-5 h-5 text-indigo-600" />周期时间轴</h3>
        <div className="mt-5 grid gap-3">
          {result.timeline.map(item => (
            <article key={item.dateRange} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-[150px_52px_1fr] sm:items-center">
              <p className="text-sm font-bold text-gray-700">{item.dateRange}</p>
              <p className="text-2xl font-black text-indigo-600">{item.score}</p>
              <div><h4 className="font-bold text-gray-800">{item.title}</h4><p className="mt-1 text-sm leading-relaxed text-gray-600">{item.analysis}</p></div>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: '机会点', items: result.opportunities, icon: <Lightbulb className="w-5 h-5" />, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
          { title: '风险点', items: result.risks, icon: <ShieldAlert className="w-5 h-5" />, color: 'text-amber-700 bg-amber-50 border-amber-100' },
          { title: '行动建议', items: result.actions, icon: <Sparkles className="w-5 h-5" />, color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
        ].map(section => (
          <section key={section.title} className={`rounded-2xl border p-5 ${section.color}`}>
            <h3 className="flex items-center gap-2 font-bold">{section.icon}{section.title}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">{section.items.map(item => <li key={item}>• {item}</li>)}</ul>
          </section>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500"><AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />{result.disclaimer}</p>
        <button type="button" onClick={onReset} className="flex-shrink-0 rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">调整周期或资料</button>
      </div>
    </div>
  );
};

export default ShortTermFortuneResult;
