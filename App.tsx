
import React, { useState, useMemo } from 'react';
import LifeKLineChart from './components/LifeKLineChart';
import AnalysisResult from './components/AnalysisResult';
import ImportDataMode from './components/ImportDataMode';
import DailyDivinationMode from './components/DailyDivinationMode';
import AlmanacMode from './components/AlmanacMode';
import { DivinationApiConfig, LifeDestinyResult } from './types';
import { hasUsableDivinationApiConfig, loadDivinationApiConfig, saveDivinationApiConfig } from './services/fortuneService';
import { Sparkles, AlertCircle, Download, Printer, Trophy, FileDown, FileUp, LineChart, ScrollText, CalendarDays } from 'lucide-react';

type PageMode = 'lifeKline' | 'divination' | 'almanac';
type DivinationMode = 'local' | 'online';

const App: React.FC = () => {
  const [pageMode, setPageMode] = useState<PageMode>('almanac');
  const [divinationMode, setDivinationMode] = useState<DivinationMode>(() => (
    hasUsableDivinationApiConfig(loadDivinationApiConfig()) ? 'online' : 'local'
  ));
  const [divinationApiConfig, setDivinationApiConfig] = useState<DivinationApiConfig>(loadDivinationApiConfig);
  const [divinationConfigDraft, setDivinationConfigDraft] = useState<DivinationApiConfig>(loadDivinationApiConfig);
  const [isDivinationConfigOpen, setIsDivinationConfigOpen] = useState(false);
  const [divinationConfigError, setDivinationConfigError] = useState<string | null>(null);
  const [result, setResult] = useState<LifeDestinyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // 处理导入数据
  const handleDataImport = (data: LifeDestinyResult) => {
    setResult(data);
    setUserName('');
    setError(null);
  };

  // 导出为 JSON 文件
  const handleExportJson = () => {
    if (!result) return;

    const exportData = {
      bazi: result.analysis.bazi,
      summary: result.analysis.summary,
      summaryScore: result.analysis.summaryScore,
      personality: result.analysis.personality,
      personalityScore: result.analysis.personalityScore,
      industry: result.analysis.industry,
      industryScore: result.analysis.industryScore,
      fengShui: result.analysis.fengShui,
      fengShuiScore: result.analysis.fengShuiScore,
      wealth: result.analysis.wealth,
      wealthScore: result.analysis.wealthScore,
      marriage: result.analysis.marriage,
      marriageScore: result.analysis.marriageScore,
      health: result.analysis.health,
      healthScore: result.analysis.healthScore,
      family: result.analysis.family,
      familyScore: result.analysis.familyScore,

      chartPoints: result.chartData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `命理分析_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 从 JSON 文件导入
  const handleImportJsonFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
          throw new Error('无效的数据格式：缺少 chartPoints');
        }

        const importedResult: LifeDestinyResult = {
          chartData: data.chartPoints,
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

        setResult(importedResult);
        setError(null);
      } catch (err: any) {
        setError(`文件解析失败：${err.message}`);
      }
    };
    reader.readAsText(file);
    // 重置 input 以便可以再次选择同一文件
    event.target.value = '';
  };

  const handlePrint = () => {
    window.print();
  };

  const openDivinationConfig = () => {
    const cachedConfig = loadDivinationApiConfig();
    setDivinationConfigDraft(cachedConfig);
    setDivinationConfigError(null);
    setIsDivinationConfigOpen(true);
  };

  const handleDivinationModeClick = () => {
    if (pageMode !== 'divination') {
      openDivinationConfig();
      return;
    }

    if (divinationMode === 'online') {
      openDivinationConfig();
      return;
    }

    const cachedConfig = loadDivinationApiConfig();
    setDivinationApiConfig(cachedConfig);

    if (hasUsableDivinationApiConfig(cachedConfig)) {
      setDivinationMode('online');
      return;
    }

    setDivinationConfigDraft(cachedConfig);
    setDivinationConfigError('未找到可用的在线解签配置，请先填写 API 信息。');
    setIsDivinationConfigOpen(true);
  };

  const handleDivinationConfigChange = (field: keyof DivinationApiConfig, value: string) => {
    setDivinationConfigDraft(prev => ({ ...prev, [field]: value }));
    setDivinationConfigError(null);
  };

  const handleSaveDivinationConfig = () => {
    if (!hasUsableDivinationApiConfig(divinationConfigDraft)) {
      setDivinationConfigError('请填写 API Key、API Base URL 和模型名称。');
      return;
    }

    saveDivinationApiConfig(divinationConfigDraft);
    setDivinationApiConfig(divinationConfigDraft);
    setDivinationMode('online');
    setIsDivinationConfigOpen(false);
    setDivinationConfigError(null);
  };

  const handleSwitchToLocalDivination = () => {
    setDivinationMode('local');
    setIsDivinationConfigOpen(false);
    setDivinationConfigError(null);
  };

  const handleSaveHtml = () => {
    if (!result) return;

    // 获取当前精确时间 (到秒)
    const now = new Date();
    const timeString = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // 1. 获取图表 SVG (Recharts 生成的是 SVG)
    const chartContainer = document.querySelector('.recharts-surface');
    // 如果找不到 chart，给一个提示文本
    const chartSvg = chartContainer ? chartContainer.outerHTML : '<div style="padding:20px;text-align:center;">图表导出失败，请截图保存</div>';

    // 2. 获取命理分析部分的 HTML
    const analysisContainer = document.getElementById('analysis-result-container');
    const analysisHtml = analysisContainer ? analysisContainer.innerHTML : '';

    // 3. 生成流年详批表格 (替代交互式的 Tooltip)
    // 根据分数判断颜色
    const tableRows = result.chartData.map(item => {
      const scoreColor = item.close >= item.open ? 'text-green-600' : 'text-red-600';
      const trendIcon = item.close >= item.open ? '▲' : '▼';
      return `
        <tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <td class="p-3 border-r border-gray-100 text-center font-mono">${item.age}岁</td>
          <td class="p-3 border-r border-gray-100 text-center font-bold">${item.year} ${item.ganZhi}</td>
          <td class="p-3 border-r border-gray-100 text-center text-sm">${item.daYun || '-'}</td>
          <td class="p-3 border-r border-gray-100 text-center font-bold ${scoreColor}">
            ${item.score} <span class="text-xs">${trendIcon}</span>
          </td>
          <td class="p-3 text-sm text-gray-700 text-justify leading-relaxed">${item.reason}</td>
        </tr>
      `;
    }).join('');

    const detailedTableHtml = `
      <div class="mt-12 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
           <div class="w-1 h-5 bg-indigo-600 rounded-full"></div>
           <h3 class="text-xl font-bold text-gray-800 font-serif-sc">流年详批全表</h3>
           <span class="text-xs text-gray-500 ml-2">(由于离线网页无法交互，特此列出所有年份详情)</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-100 text-gray-600 text-sm font-bold uppercase tracking-wider">
                <th class="p-3 border-r border-gray-200 text-center w-20">年龄</th>
                <th class="p-3 border-r border-gray-200 text-center w-28">流年</th>
                <th class="p-3 border-r border-gray-200 text-center w-28">大运</th>
                <th class="p-3 border-r border-gray-200 text-center w-20">评分</th>
                <th class="p-3">运势批断与建议</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // 4. 组装完整的 HTML 文件
    const fullHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${userName || '用户'} - 人生K线命理报告</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Inter:wght@400;600&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #f8f9fa; }
    .font-serif-sc { font-family: 'Noto Serif SC', serif; }
    /* Ensure SVG fits */
    svg { width: 100% !important; height: auto !important; }
  </style>
</head>
<body class="bg-gray-50 min-h-screen p-4 md:p-12">
  <div class="max-w-6xl mx-auto space-y-10">
    
    <!-- Header -->
    <div class="text-center border-b border-gray-200 pb-8">
      <h1 class="text-4xl font-bold font-serif-sc text-gray-900 mb-2">${userName ? userName + '的' : ''}人生K线命理报告</h1>
      <p class="text-gray-500 text-sm">生成时间：${timeString}</p>
    </div>

    <!-- Chart Section -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1 h-6 bg-indigo-600 rounded-full"></div>
        <h3 class="text-xl font-bold text-gray-800 font-serif-sc">流年大运走势图</h3>
      </div>
      <!-- Injected SVG Container -->
      <div class="w-full overflow-hidden flex justify-center py-4">
        ${chartSvg}
      </div>
      <p class="text-center text-xs text-gray-400 mt-2">注：图表K线颜色根据运势涨跌绘制，数值越高代表运势越强。</p>
    </div>

    <!-- Analysis Cards -->
    <div class="space-y-8">
       ${analysisHtml}
    </div>

    <!-- Detailed Table -->
    ${detailedTableHtml}

    <!-- Footer -->
    <div class="text-center text-gray-400 text-sm py-12 border-t border-gray-200 mt-12">
      <p>&copy; ${now.getFullYear()} 人生K线项目 | 仅供娱乐与文化研究，请勿迷信</p>
    </div>

  </div>
</body>
</html>
    `;

    // 5. 触发下载
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${userName || 'User'}_Life_Kline_Report_${now.getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 计算人生巅峰
  const peakYearItem = useMemo(() => {
    if (!result || !result.chartData.length) return null;
    return result.chartData.reduce((prev, current) => {
      if (current.high !== prev.high) return current.high > prev.high ? current : prev;
      if (current.score !== prev.score) return current.score > prev.score ? current : prev;
      return current.age < prev.age ? current : prev;
    });
  }, [result]);
  const isAiConfigured = hasUsableDivinationApiConfig(divinationApiConfig);
  const aiConfigButtonTitle = pageMode === 'divination'
    ? '点击检查本地缓存中的在线解签配置'
    : pageMode === 'almanac'
      ? '点击配置黄历事项解读在线 AI 模型'
      : '点击配置人生K线在线 AI 模型';
  const aiConfigButtonLabel = pageMode === 'divination'
    ? divinationMode === 'online'
      ? '在线灵签模式'
      : '本地灵签模式'
    : isAiConfigured
      ? '在线AI已配置'
      : '配置在线AI';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      {/* Header */}
      <header className="w-full bg-white border-b border-gray-200 py-6 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-serif-sc font-bold text-gray-900 tracking-wide">人生K线</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Life Destiny K-Line</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDivinationModeClick}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full transition-all ${pageMode === 'divination'
              ? divinationMode === 'online'
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              : isAiConfigured
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            title={aiConfigButtonTitle}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            {aiConfigButtonLabel}
          </button>
        </div>
      </header>

      {isDivinationConfigOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 no-print flex items-center justify-center px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-xl font-serif-sc font-bold text-gray-900">配置在线 AI 模型</h3>
              <p className="text-sm text-gray-500 mt-1">用于观音灵签、黄历和人生K线，配置只保存在当前浏览器缓存中，不上传后端。</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">API Base URL</label>
                <input
                  type="text"
                  value={divinationConfigDraft.apiBaseUrl}
                  onChange={e => handleDivinationConfigChange('apiBaseUrl', e.target.value)}
                  placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Model</label>
                <input
                  type="text"
                  value={divinationConfigDraft.modelName}
                  onChange={e => handleDivinationConfigChange('modelName', e.target.value)}
                  placeholder="qwen3.7-plus"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">API Key</label>
                <input
                  type="password"
                  value={divinationConfigDraft.apiKey}
                  onChange={e => handleDivinationConfigChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">请求由浏览器直接发往你填写的 OpenAI-compatible API 地址。</p>
              </div>

              {divinationConfigError && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{divinationConfigError}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {pageMode === 'divination' ? (
                <button
                  type="button"
                  onClick={handleSwitchToLocalDivination}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm"
                >
                  切换为本地模式
                </button>
              ) : (
                <div />
              )}
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDivinationConfigOpen(false)}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-bold text-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveDivinationConfig}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm"
                >
                  保存在线配置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-12">
        <div className="no-print flex justify-center">
          <div className="inline-flex w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-1 shadow-sm overflow-x-auto">
            <button
              onClick={() => setPageMode('divination')}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${pageMode === 'divination'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <ScrollText className="w-4 h-4" />
              观音灵签
            </button>
            <button
              onClick={() => setPageMode('almanac')}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${pageMode === 'almanac'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <CalendarDays className="w-4 h-4" />
              黄历
            </button>
            <button
              onClick={() => setPageMode('lifeKline')}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${pageMode === 'lifeKline'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <LineChart className="w-4 h-4" />
              人生K线
            </button>
          </div>
        </div>

        {/* If no result, show intro and form */}
        {pageMode === 'divination' && (
          <DailyDivinationMode
            apiConfig={divinationApiConfig}
            mode={divinationMode}
            onRequestConfig={openDivinationConfig}
          />
        )}

        {pageMode === 'almanac' && (
          <AlmanacMode
            apiConfig={divinationApiConfig}
            onRequestConfig={openDivinationConfig}
          />
        )}

        {pageMode === 'lifeKline' && !result && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
            <div className="text-center max-w-2xl flex flex-col items-center">
              <h2 className="text-4xl md:text-5xl font-serif-sc font-bold text-gray-900 mb-6">
                洞悉命运起伏 <br />
                <span className="text-indigo-600">预见人生轨迹</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-3xl">
                结合<strong>传统八字命理</strong>与<strong>金融可视化技术</strong>，将您的一生运势绘制成类似股票行情的K线图。
              </p>

              {/* 使用说明 */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 mb-6 text-left w-full max-w-lg">
                <h3 className="font-bold text-indigo-800 mb-2">📝 使用方法</h3>
                {hasUsableDivinationApiConfig(divinationApiConfig) ? (
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>填写八字信息</li>
                    <li>系统会直接调用浏览器缓存中的在线 AI 配置</li>
                    <li>模型返回 JSON 后自动生成 K 线报告</li>
                  </ol>
                ) : (
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>填写八字信息，生成专属提示词</li>
                    <li>复制提示词到任意 AI（ChatGPT、Claude、Gemini 等）</li>
                    <li>将 AI 返回的 JSON 数据粘贴回来</li>
                  </ol>
                )}
              </div>

              {/* 快速导入 JSON 文件 */}
              <label className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all group mb-4">
                <FileUp className="w-6 h-6 text-emerald-500 group-hover:text-emerald-600" />
                <span className="text-base font-medium text-gray-600 group-hover:text-emerald-700">已有 JSON 文件？点击直接导入</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* 导入模式组件 */}
            <ImportDataMode
              onDataImport={handleDataImport}
              apiConfig={divinationApiConfig}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-100 max-w-md w-full animate-bounce-short">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Results View */}
        {pageMode === 'lifeKline' && result && (
          <div className="animate-fade-in space-y-12">

            <div className="flex flex-col md:flex-row justify-between items-end md:items-center border-b border-gray-200 pb-4 gap-4">
              <h2 className="text-2xl font-bold font-serif-sc text-gray-800">
                {userName ? `${userName}的` : ''}命盘分析报告
              </h2>

              <div className="flex flex-wrap gap-3 no-print">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white border border-emerald-600 rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  导出JSON
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  保存PDF
                </button>
                <button
                  onClick={handleSaveHtml}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-indigo-600 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  保存网页
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  ← 重新排盘
                </button>
              </div>
            </div>

            {/* The Chart */}
            <section className="space-y-4 break-inside-avoid">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                  <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                  流年大运走势图 (100年)
                </h3>
                {peakYearItem && (
                  <p className="text-sm font-bold text-indigo-800 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 inline-flex items-center gap-2 self-start mt-1">
                    <Trophy className="w-3 h-3 text-amber-500" />
                    人生巅峰年份：{peakYearItem.year}年 ({peakYearItem.ganZhi}) - {peakYearItem.age}岁，高点 <span className="text-amber-600 text-lg">{peakYearItem.high}</span>
                  </p>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-2 no-print">
                <span className="text-green-600 font-bold">绿色K线</span> 代表运势上涨（吉），
                <span className="text-red-600 font-bold">红色K线</span> 代表运势下跌（凶）。
                <span className="text-red-500 font-bold">★</span> 标记为全盘最高运势点。
              </p>
              <LifeKLineChart data={result.chartData} />
            </section>

            {/* The Text Report */}
            {/* Added ID for HTML extraction */}
            <section id="analysis-result-container">
              <AnalysisResult analysis={result.analysis} />
            </section>

            {/* Print Only: Detailed Table to substitute interactive tooltips */}
            <div className="hidden print:block mt-8 break-before-page">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 mb-4">
                <div className="w-1 h-5 bg-indigo-600 rounded-full"></div>
                <h3 className="text-xl font-bold text-gray-800 font-serif-sc">流年详批全表</h3>
              </div>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                    <th className="p-2 border border-gray-200 text-center w-16">年龄</th>
                    <th className="p-2 border border-gray-200 text-center w-24">流年</th>
                    <th className="p-2 border border-gray-200 text-center w-24">大运</th>
                    <th className="p-2 border border-gray-200 text-center w-16">评分</th>
                    <th className="p-2 border border-gray-200">运势批断</th>
                  </tr>
                </thead>
                <tbody>
                  {result.chartData.map((item) => (
                    <tr key={item.age} className="border-b border-gray-100 break-inside-avoid">
                      <td className="p-2 border border-gray-100 text-center font-mono">{item.age}</td>
                      <td className="p-2 border border-gray-100 text-center font-bold">{item.year} {item.ganZhi}</td>
                      <td className="p-2 border border-gray-100 text-center">{item.daYun || '-'}</td>
                      <td className={`p-2 border border-gray-100 text-center font-bold ${item.close >= item.open ? 'text-green-600' : 'text-red-600'}`}>
                        {item.score}
                      </td>
                      <td className="p-2 border border-gray-100 text-gray-700 text-justify text-xs leading-relaxed">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-8 pt-4 border-t border-gray-200 flex justify-center items-center text-xs text-gray-500">
                <span>生成时间：{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-400 py-8 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} 人生K线 | 仅供娱乐与文化研究，请勿迷信</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
