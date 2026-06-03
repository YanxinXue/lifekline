import React, { useState, useEffect } from 'react';
import { DivinationApiConfig, Gender, LifeDestinyResult } from '../types';
import { Copy, CheckCircle, AlertCircle, Upload, Sparkles, MessageSquare, ArrowRight, Calendar, Loader2 } from 'lucide-react';
import { BAZI_SYSTEM_INSTRUCTION } from '../constants';
import { calculateBazi } from '../services/baziCalculator';
import { generate100YearGanZhi, generateDaYunSequence, generateUserPrompt, getDaYunDirection } from '../services/promptBuilder';
import { generateLifeAnalysis } from '../services/geminiService';
import { hasUsableDivinationApiConfig } from '../services/fortuneService';
import CitySelector from './CitySelector';

interface ImportDataModeProps {
    onDataImport: (data: LifeDestinyResult) => void;
    apiConfig: DivinationApiConfig;
}

const ImportDataMode: React.FC<ImportDataModeProps> = ({ onDataImport, apiConfig }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [baziInfo, setBaziInfo] = useState({
        name: '',
        gender: 'Male',
        birthYear: '',
        yearPillar: '',
        monthPillar: '',
        dayPillar: '',
        hourPillar: '',
        startAge: '',
        firstDaYun: '',
    });
    const [jsonInput, setJsonInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState('');
    const [birthTime, setBirthTime] = useState('');
    const [cityLongitude, setCityLongitude] = useState(116.4);
    const [baziError, setBaziError] = useState<string | null>(null);
    const [onlineError, setOnlineError] = useState<string | null>(null);
    const [isGeneratingOnline, setIsGeneratingOnline] = useState(false);
    const [onlineProgress, setOnlineProgress] = useState('');

    const isOnlineConfigured = hasUsableDivinationApiConfig(apiConfig);

    useEffect(() => {
        if (!birthDate || !birthTime) {
            setBaziError(null);
            return;
        }
        try {
            const result = calculateBazi({
                birthDate,
                birthTime,
                longitude: cityLongitude,
                gender: baziInfo.gender as 'Male' | 'Female',
            });
            setBaziInfo(prev => ({
                ...prev,
                birthYear: birthDate.split('-')[0],
                yearPillar: result.yearPillar,
                monthPillar: result.monthPillar,
                dayPillar: result.dayPillar,
                hourPillar: result.hourPillar,
                startAge: String(result.startAge),
                firstDaYun: result.firstDaYun,
            }));
            setBaziError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '计算失败';
            setBaziError(message);
        }
    }, [birthDate, birthTime, cityLongitude, baziInfo.gender]);

    const getDaYunDirectionInfo = () => {
        if (!baziInfo.yearPillar) return { isForward: true, text: '顺行 (Forward)' };
        return getDaYunDirection(baziInfo.yearPillar, baziInfo.gender as 'Male' | 'Female');
    };

    const buildDeterministicChartData = (chartPoints: any[]) => {
        const birthYear = parseInt(baziInfo.birthYear, 10);
        const startAge = parseInt(baziInfo.startAge, 10);
        if (!Number.isFinite(birthYear) || !Number.isFinite(startAge) || !baziInfo.firstDaYun) {
            return chartPoints;
        }

        const { isForward } = getDaYunDirection(baziInfo.yearPillar, baziInfo.gender as 'Male' | 'Female');
        const yearGanZhiList = generate100YearGanZhi(birthYear);
        const daYunSequence = generateDaYunSequence(baziInfo.firstDaYun, isForward, 10);

        return chartPoints.map((point, index) => {
            const timelinePoint = yearGanZhiList[index];
            if (!timelinePoint) return point;

            const daYun = timelinePoint.age < startAge
                ? '童限'
                : daYunSequence[Math.floor((timelinePoint.age - startAge) / 10)] || daYunSequence[daYunSequence.length - 1] || point.daYun;

            return {
                ...point,
                age: timelinePoint.age,
                year: timelinePoint.year,
                ganZhi: timelinePoint.ganZhi,
                daYun,
            };
        });
    };

    const generatePrompt = () => {
        if (!baziInfo.yearPillar || !baziInfo.firstDaYun || !baziInfo.startAge) {
            return '';
        }
        return generateUserPrompt({
            name: baziInfo.name,
            gender: baziInfo.gender as 'Male' | 'Female',
            birthYear: baziInfo.birthYear,
            yearPillar: baziInfo.yearPillar,
            monthPillar: baziInfo.monthPillar,
            dayPillar: baziInfo.dayPillar,
            hourPillar: baziInfo.hourPillar,
            startAge: baziInfo.startAge,
            firstDaYun: baziInfo.firstDaYun,
        });
    };

    const copyFullPrompt = async () => {
        const fullPrompt = `=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generatePrompt()}`;

        try {
            await navigator.clipboard.writeText(fullPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    const handleImport = () => {
        setError(null);

        if (!jsonInput.trim()) {
            setError('请粘贴 AI 返回的 JSON 数据');
            return;
        }

        try {
            let jsonContent = jsonInput.trim();

            const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            } else {
                const jsonStartIndex = jsonContent.indexOf('{');
                const jsonEndIndex = jsonContent.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
                }
            }

            const data = JSON.parse(jsonContent);

            if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
                throw new Error('数据格式不正确：缺少 chartPoints 数组');
            }

            if (data.chartPoints.length < 10) {
                throw new Error('数据不完整：chartPoints 数量太少');
            }

            const result: LifeDestinyResult = {
                chartData: buildDeterministicChartData(data.chartPoints),
                analysis: {
                    bazi: data.bazi || [],
                    summary: data.summary || "无摘要",
                    summaryScore: data.summaryScore || 5,
                    personality: data.personality || "无性格分析",
                    personalityScore: data.personalityScore || 5,
                    industry: data.industry || "无",
                    industryScore: data.industryScore || 5,
                    fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
                    fengShuiScore: data.fengShuiScore || 5,
                    wealth: data.wealth || "无",
                    wealthScore: data.wealthScore || 5,
                    marriage: data.marriage || "无",
                    marriageScore: data.marriageScore || 5,
                    health: data.health || "无",
                    healthScore: data.healthScore || 5,
                    family: data.family || "无",
                    familyScore: data.familyScore || 5,

                },
            };

            onDataImport(result);
        } catch (err: any) {
            setError(`解析失败：${err.message}`);
        }
    };

    const handleBaziChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setBaziInfo(prev => ({ ...prev, [name]: value }));
        setOnlineError(null);
        setOnlineProgress('');
    };

    const isStep1Valid = baziInfo.birthYear && baziInfo.yearPillar && baziInfo.monthPillar &&
        baziInfo.dayPillar && baziInfo.hourPillar && baziInfo.startAge && baziInfo.firstDaYun;

    const handleGenerateOrShowPrompt = async () => {
        setOnlineError(null);
        setOnlineProgress('');

        if (!isOnlineConfigured) {
            setStep(2);
            return;
        }

        setIsGeneratingOnline(true);
        setOnlineProgress('正在连接在线 AI...');
        try {
            const data = await generateLifeAnalysis({
                name: baziInfo.name,
                gender: baziInfo.gender === 'Male' ? Gender.MALE : Gender.FEMALE,
                birthYear: baziInfo.birthYear,
                yearPillar: baziInfo.yearPillar,
                monthPillar: baziInfo.monthPillar,
                dayPillar: baziInfo.dayPillar,
                hourPillar: baziInfo.hourPillar,
                startAge: baziInfo.startAge,
                firstDaYun: baziInfo.firstDaYun,
                apiKey: apiConfig.apiKey,
                apiBaseUrl: apiConfig.apiBaseUrl,
                modelName: apiConfig.modelName,
            }, {
                onProgress: setOnlineProgress,
            });
            setOnlineProgress('已完成，正在生成报告...');
            onDataImport(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : '在线生成失败';
            setOnlineError(message);
        } finally {
            setIsGeneratingOnline(false);
        }
    };

    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                                ? 'bg-indigo-600 text-white scale-110'
                                : step > s
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第一步：输入八字信息</h2>
                        <p className="text-gray-500 text-sm">
                            {isOnlineConfigured ? '已检测到在线 AI 配置，提交后将直接生成 K 线' : '未检测到在线 AI 配置，将生成可复制提示词'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">姓名 (可选)</label>
                            <input
                                type="text"
                                name="name"
                                value={baziInfo.name}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="姓名"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">性别</label>
                        <select
                            name="gender"
                            value={baziInfo.gender}
                            onChange={handleBaziChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                                <option value="Male">乾造 (男)</option>
                                <option value="Female">坤造 (女)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-3 text-green-800 text-sm font-bold">
                            <Calendar className="w-4 h-4" />
                            <span>出生时间 (可自动排盘)</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">出生日期</label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={e => setBirthDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">出生时间 (北京时间)</label>
                                <input
                                    type="time"
                                    value={birthTime}
                                    onChange={e => setBirthTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white font-bold"
                                />
                            </div>
                        </div>
                        <CitySelector
                            value="北京"
                            onChange={(lon) => setCityLongitude(lon)}
                        />
                        {baziError && (
                            <p className="text-red-500 text-xs mt-2">{baziError}</p>
                        )}
                        {birthDate && birthTime && !baziError && baziInfo.yearPillar && (
                            <p className="text-green-700 text-xs mt-2 font-bold">
                                已自动排盘：{baziInfo.yearPillar} {baziInfo.monthPillar} {baziInfo.dayPillar} {baziInfo.hourPillar}
                                {baziInfo.startAge && baziInfo.firstDaYun && ` | 起运${baziInfo.startAge}岁 · 大运${baziInfo.firstDaYun}`}
                            </p>
                        )}
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                            <Sparkles className="w-4 h-4" />
                            <span>四柱干支</span>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-600 mb-1">出生年份 (阳历)</label>
                            <input
                                type="number"
                                name="birthYear"
                                value={baziInfo.birthYear}
                                onChange={handleBaziChange}
                                placeholder="如: 2003"
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {(['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'] as const).map((field, i) => (
                                <div key={field}>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">{['年柱', '月柱', '日柱', '时柱'][i]}</label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={baziInfo[field]}
                                        onChange={handleBaziChange}
                                        placeholder={['甲子', '乙丑', '丙寅', '丁卯'][i]}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-center font-serif-sc font-bold"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">起运年龄 (虚岁)</label>
                                <input
                                    type="number"
                                    name="startAge"
                                    value={baziInfo.startAge}
                                    onChange={handleBaziChange}
                                    placeholder="如: 8"
                                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">第一步大运</label>
                                <input
                                    type="text"
                                    name="firstDaYun"
                                    value={baziInfo.firstDaYun}
                                    onChange={handleBaziChange}
                                    placeholder="如: 辛酉"
                                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-indigo-600/70 mt-2 text-center">
                            大运方向：<span className="font-bold text-indigo-900">                    {getDaYunDirectionInfo().text}</span>
                        </p>
                    </div>

                    <button
                        onClick={handleGenerateOrShowPrompt}
                        disabled={!isStep1Valid || isGeneratingOnline}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isGeneratingOnline ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {onlineProgress || '在线生成中...'}
                            </>
                        ) : isOnlineConfigured ? (
                            <>
                                在线生成K线 <Sparkles className="w-5 h-5" />
                            </>
                        ) : (
                            <>
                                下一步：生成提示词 <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {onlineError && (
                        <div className="flex items-start gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-bold">在线 AI 生成失败</p>
                                <p>{onlineError}</p>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="mt-2 text-indigo-700 font-bold hover:text-indigo-900"
                                >
                                    改用复制提示词流程
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第二步：复制提示词</h2>
                        <p className="text-gray-500 text-sm">将提示词粘贴到任意 AI 聊天工具</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-gray-800">支持的 AI 工具</h3>
                                    <p className="text-sm text-gray-600">ChatGPT、Claude、Gemini、通义千问、文心一言 等</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-[80vh] overflow-y-auto mb-4">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                {`=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generatePrompt()}`}
                            </pre>
                        </div>

                        <button
                            onClick={copyFullPrompt}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    已复制到剪贴板！
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    复制完整提示词
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2">📝 使用说明</h4>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                            <li>点击上方按钮复制提示词</li>
                            <li>打开任意 AI 聊天工具（如 ChatGPT）</li>
                            <li>粘贴提示词并发送</li>
                            <li>等待 AI 生成完整的 JSON 数据</li>
                            <li>复制 AI 的回复，回到这里进行下一步</li>
                        </ol>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            下一步：导入数据 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第三步：导入 AI 回复</h2>
                        <p className="text-gray-500 text-sm">粘贴 AI 返回的 JSON 数据</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Upload className="w-4 h-4 inline mr-2" />
                            粘贴 AI 返回的 JSON 数据
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='将 AI 返回的 JSON 数据粘贴到这里...&#10;&#10;例如:&#10;{&#10;  "bazi": ["癸未", "壬戌", "丙子", "庚寅"],&#10;  "chartPoints": [...],&#10;  ...&#10;}'
                            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            生成人生K线
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportDataMode;
