import React, { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle, Copy, MessageSquare, Sparkles, Upload } from 'lucide-react';
import { BaziProfile, DivinationApiConfig, Gender, LifeDestinyResult, ResolvedBaziProfile } from '../types';
import { BAZI_SYSTEM_INSTRUCTION } from '../constants';
import { generate100YearGanZhi, generateDaYunSequence, generateUserPrompt, getDaYunDirection } from '../services/promptBuilder';
import { generateLifeAnalysis } from '../services/geminiService';
import { hasUsableDivinationApiConfig } from '../services/fortuneService';
import BaziProfileForm from './BaziProfileForm';

interface ImportDataModeProps {
  onDataImport: (data: LifeDestinyResult, name?: string) => void;
  apiConfig: DivinationApiConfig;
  profile: BaziProfile | null;
  storageMessage: string | null;
  onSaveProfile: (profile: BaziProfile) => void;
  onClearProfile: () => void;
}

const ImportDataMode: React.FC<ImportDataModeProps> = ({
  onDataImport,
  apiConfig,
  profile,
  storageMessage,
  onSaveProfile,
  onClearProfile,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [resolved, setResolved] = useState<ResolvedBaziProfile | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [isGeneratingOnline, setIsGeneratingOnline] = useState(false);
  const [onlineProgress, setOnlineProgress] = useState('');

  const isOnlineConfigured = hasUsableDivinationApiConfig(apiConfig);

  const generatePrompt = (input = resolved) => {
    if (!input) return '';
    return generateUserPrompt({
      name: input.name,
      gender: input.gender,
      birthYear: input.birthYear,
      yearPillar: input.yearPillar,
      monthPillar: input.monthPillar,
      dayPillar: input.dayPillar,
      hourPillar: input.hourPillar,
      startAge: input.startAge,
      firstDaYun: input.firstDaYun,
    });
  };

  const buildDeterministicChartData = (chartPoints: unknown[], input: ResolvedBaziProfile) => {
    const birthYear = Number(input.birthYear);
    const startAge = Number(input.startAge);
    const { isForward } = getDaYunDirection(input.yearPillar, input.gender);
    const years = generate100YearGanZhi(birthYear);
    const daYunSequence = generateDaYunSequence(input.firstDaYun, isForward, 10);

    return chartPoints.map((rawPoint, index) => {
      const point = rawPoint && typeof rawPoint === 'object' ? rawPoint as Record<string, unknown> : {};
      const timelinePoint = years[index];
      if (!timelinePoint) return point;
      const daYun = timelinePoint.age < startAge
        ? '童限'
        : daYunSequence[Math.floor((timelinePoint.age - startAge) / 10)] || daYunSequence[daYunSequence.length - 1] || '未知';
      return { ...point, ...timelinePoint, daYun };
    });
  };

  const toResult = (data: Record<string, unknown>, input: ResolvedBaziProfile): LifeDestinyResult => ({
    chartData: buildDeterministicChartData(data.chartPoints as unknown[], input) as LifeDestinyResult['chartData'],
    analysis: {
      bazi: Array.isArray(data.bazi) ? data.bazi as string[] : [input.yearPillar, input.monthPillar, input.dayPillar, input.hourPillar],
      summary: typeof data.summary === 'string' ? data.summary : '无摘要',
      summaryScore: Number(data.summaryScore) || 5,
      personality: typeof data.personality === 'string' ? data.personality : '无性格分析',
      personalityScore: Number(data.personalityScore) || 5,
      industry: typeof data.industry === 'string' ? data.industry : '无',
      industryScore: Number(data.industryScore) || 5,
      fengShui: typeof data.fengShui === 'string' ? data.fengShui : '建议多亲近自然，保持心境平和。',
      fengShuiScore: Number(data.fengShuiScore) || 5,
      wealth: typeof data.wealth === 'string' ? data.wealth : '无',
      wealthScore: Number(data.wealthScore) || 5,
      marriage: typeof data.marriage === 'string' ? data.marriage : '无',
      marriageScore: Number(data.marriageScore) || 5,
      health: typeof data.health === 'string' ? data.health : '无',
      healthScore: Number(data.healthScore) || 5,
      family: typeof data.family === 'string' ? data.family : '无',
      familyScore: Number(data.familyScore) || 5,
      crypto: typeof data.crypto === 'string' ? data.crypto : '无',
      cryptoScore: Number(data.cryptoScore) || 5,
      cryptoYear: typeof data.cryptoYear === 'string' ? data.cryptoYear : '无',
      cryptoStyle: typeof data.cryptoStyle === 'string' ? data.cryptoStyle : '无',
    },
  });

  const handleProfileSubmit = async (nextProfile: BaziProfile, nextResolved: ResolvedBaziProfile) => {
    onSaveProfile(nextProfile);
    setResolved(nextResolved);
    setOnlineError(null);
    setOnlineProgress('');

    if (!isOnlineConfigured) {
      setStep(2);
      return;
    }

    setIsGeneratingOnline(true);
    try {
      const data = await generateLifeAnalysis({
        name: nextResolved.name,
        gender: nextResolved.gender,
        birthYear: nextResolved.birthYear,
        yearPillar: nextResolved.yearPillar,
        monthPillar: nextResolved.monthPillar,
        dayPillar: nextResolved.dayPillar,
        hourPillar: nextResolved.hourPillar,
        startAge: nextResolved.startAge,
        firstDaYun: nextResolved.firstDaYun,
        apiKey: apiConfig.apiKey,
        apiBaseUrl: apiConfig.apiBaseUrl,
        modelName: apiConfig.modelName,
      }, { onProgress: setOnlineProgress });
      onDataImport(data, nextResolved.name);
    } catch (generationError: unknown) {
      setOnlineError(generationError instanceof Error ? generationError.message : '在线生成失败');
    } finally {
      setIsGeneratingOnline(false);
    }
  };

  const copyFullPrompt = async () => {
    const fullPrompt = `=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generatePrompt()}`;
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('复制失败，请手动选择提示词复制。');
    }
  };

  const handleImport = () => {
    setError(null);
    if (!resolved) {
      setError('生辰资料已失效，请返回上一步重新确认。');
      return;
    }
    try {
      let content = jsonInput.trim();
      const codeBlock = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlock) content = codeBlock[1].trim();
      else {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start >= 0 && end > start) content = content.slice(start, end + 1);
      }
      const data = JSON.parse(content) as Record<string, unknown>;
      if (!Array.isArray(data.chartPoints) || data.chartPoints.length < 10) throw new Error('数据不完整：chartPoints 数量太少');
      onDataImport(toResult(data, resolved), resolved.name);
    } catch (importError: unknown) {
      setError(`解析失败：${importError instanceof Error ? importError.message : '未知错误'}`);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {step === 1 ? (
        <div className="space-y-4">
          <BaziProfileForm
            key={profile ? `${profile.source}-${profile.updatedAt}` : 'empty-profile'}
            initialProfile={profile}
            onSubmit={handleProfileSubmit}
            onClear={onClearProfile}
            isSubmitting={isGeneratingOnline}
            submitLabel={isOnlineConfigured ? '保存并在线生成人生 K 线' : '保存并生成提示词'}
            helperText={isOnlineConfigured ? onlineProgress || '已检测到在线 AI 配置' : '未检测到在线 AI 配置，将使用复制提示词流程'}
            storageMessage={storageMessage}
          />
          {onlineError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <div className="flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0" /><p>{onlineError}</p></div>
              <button type="button" onClick={() => setStep(2)} className="mt-3 font-bold text-indigo-700">改用复制提示词流程</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-xl space-y-6">
          <div className="text-center"><h2 className="text-2xl font-bold font-serif-sc text-gray-800">第二步：复制提示词</h2><p className="mt-1 text-sm text-gray-500">将提示词粘贴到任意 AI 聊天工具</p></div>
          <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-5">
            <div className="flex items-center gap-2 font-bold text-gray-800"><MessageSquare className="w-5 h-5 text-blue-600" />完整提示词</div>
            <pre className="mt-4 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-4 text-xs text-gray-700">{`=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generatePrompt()}`}</pre>
            <button type="button" onClick={copyFullPrompt} className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 font-bold text-white ${copied ? 'bg-green-500' : 'bg-indigo-600'}`}>{copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}{copied ? '已复制' : '复制完整提示词'}</button>
          </div>
          {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700">← 上一步</button>
            <button type="button" onClick={() => setStep(3)} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-bold text-white">下一步：导入数据<ArrowRight className="w-5 h-5" /></button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-xl space-y-6">
          <div className="text-center"><h2 className="text-2xl font-bold font-serif-sc text-gray-800">第三步：导入 AI 回复</h2><p className="mt-1 text-sm text-gray-500">粘贴 AI 返回的 JSON 数据</p></div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700"><Upload className="w-4 h-4" />JSON 数据</label>
          <textarea value={jsonInput} onChange={event => setJsonInput(event.target.value)} className="h-64 w-full resize-none rounded-xl border border-gray-300 p-4 font-mono text-xs" placeholder="粘贴 AI 返回的 JSON" />
          {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-4">
            <button type="button" onClick={() => setStep(2)} className="flex-1 rounded-xl border-2 border-gray-300 py-3 font-bold text-gray-700">← 上一步</button>
            <button type="button" onClick={handleImport} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-bold text-white"><Sparkles className="w-5 h-5" />生成人生 K 线</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ImportDataMode;
