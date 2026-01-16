import React, { useState, useEffect } from 'react';
import { ArrowRight, RotateCcw, Sparkles, Loader2, Moon, Globe, Cpu, Settings2, Clock, Trash2, ChevronRight, BrainCircuit } from 'lucide-react';

import { AppStep, HexagramData, LineType, CoinSide, Language, DivinationMode, HistoryRecord } from './types';
import { castCoins, getHexagramStructure } from './utils/divination';
import { interpretHexagram } from './services/geminiService';
import { interpretHexagramLocal } from './services/localService';
import { saveRecord, getHistory, clearHistory } from './services/storageService';
import { UI_TEXT, HEXAGRAM_NAMES } from './constants';
import Coin from './components/Coin';
import HexagramLine from './components/HexagramLine';
import { YinYangSymbol } from './components/YinYangSymbol';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.Welcome);
  const [hexagram, setHexagram] = useState<HexagramData>({ lines: [], timestamp: 0 });
  const [currentCoins, setCurrentCoins] = useState<[CoinSide | null, CoinSide | null, CoinSide | null]>([null, null, null]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [question, setQuestion] = useState("");
  const [interpretation, setInterpretation] = useState("");
  
  // Settings State
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [mode, setMode] = useState<DivinationMode>('LOCAL');
  const [showSettings, setShowSettings] = useState(false);

  // History State
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([]);
  
  // Track which mode generated the current result (to show AI button if Local)
  const [resultSource, setResultSource] = useState<DivinationMode | null>(null);

  // Helper for text
  const t = UI_TEXT[language];

  // Refresh history whenever entering history step
  useEffect(() => {
    if (step === AppStep.History) {
      setHistoryRecords(getHistory());
    }
  }, [step]);

  const handleStart = () => {
    setStep(AppStep.Casting);
    setHexagram({ lines: [], timestamp: Date.now() });
    setCurrentCoins([null, null, null]);
  };

  const handleCast = () => {
    if (isFlipping || hexagram.lines.length >= 6) return;

    setIsFlipping(true);

    setTimeout(() => {
      const result = castCoins();
      setCurrentCoins(result.coins);
      
      setHexagram(prev => ({
        ...prev,
        lines: [...prev.lines, result]
      }));
      
      setIsFlipping(false);
    }, 800);
  };

  const handleFinishCasting = () => {
    setStep(AppStep.Question);
  };

  const handleConsultOracle = async () => {
    setStep(AppStep.Analyzing);
    setResultSource(mode);
    
    let result = "";
    try {
      if (mode === 'AI') {
        result = await interpretHexagram(hexagram, question, language);
      } else {
        result = await interpretHexagramLocal(hexagram, language);
      }
    } catch (e) {
      result = "Error consulting oracle.";
    }

    setInterpretation(result);
    setStep(AppStep.Result);

    // Save Record
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      hexagram: hexagram,
      question: question,
      interpretation: result,
      mode: mode,
      language: language
    };
    saveRecord(newRecord);
  };
  
  const handleAiDeepDive = async () => {
    setStep(AppStep.Analyzing);
    // Explicitly using AI here
    setResultSource('AI');
    
    let result = "";
    try {
        result = await interpretHexagram(hexagram, question, language);
    } catch(e) {
        result = "Error consulting AI.";
    }
    
    setInterpretation(result);
    setStep(AppStep.Result);
    
    // Save this new AI record
    const newRecord: HistoryRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      hexagram: hexagram,
      question: question,
      interpretation: result,
      mode: 'AI',
      language: language
    };
    saveRecord(newRecord);
  };

  const handleReset = () => {
    setStep(AppStep.Welcome);
    setHexagram({ lines: [], timestamp: 0 });
    setQuestion("");
    setInterpretation("");
    setCurrentCoins([null, null, null]);
    setResultSource(null);
  };

  const handleLoadRecord = (record: HistoryRecord) => {
    setHexagram(record.hexagram);
    setQuestion(record.question);
    setInterpretation(record.interpretation);
    setResultSource(record.mode);
    setStep(AppStep.Result);
  };

  const handleClearHistory = () => {
    if (confirm(t.history_del_confirm)) {
      clearHistory();
      setHistoryRecords([]);
    }
  };

  // --- Components ---

  const LanguageSelector = () => (
    <div className="flex gap-2 p-2 bg-gray-800 rounded-lg mt-2">
       {(['zh-CN', 'zh-TW', 'en', 'ja'] as Language[]).map(lang => (
         <button 
           key={lang}
           onClick={() => setLanguage(lang)}
           className={`px-3 py-1 rounded text-sm ${language === lang ? 'bg-yellow-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
         >
           {lang === 'zh-CN' ? '简' : lang === 'zh-TW' ? '繁' : lang === 'en' ? 'EN' : '日'}
         </button>
       ))}
    </div>
  );

  const ModeSelector = () => (
    <div className="flex gap-2 p-2 bg-gray-800 rounded-lg mt-2">
       {(['AI', 'LOCAL'] as DivinationMode[]).map(m => (
         <button 
           key={m}
           onClick={() => setMode(m)}
           className={`px-3 py-1 rounded text-sm flex-1 ${mode === m ? 'bg-indigo-700 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
         >
           {m === 'AI' ? t.mode_ai : t.mode_local}
         </button>
       ))}
    </div>
  );

  // --- Views ---

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in-up">
      <div className="mb-8 text-yellow-500 opacity-90 animate-pulse">
        <YinYangSymbol className="w-24 h-24" />
      </div>
      <h1 className="text-4xl md:text-6xl font-serif text-gray-100 mb-2 tracking-wider">{t.title}</h1>
      <p className="text-xl text-yellow-700 mb-4 font-serif">{t.subtitle}</p>
      <p className="text-gray-400 max-w-md mb-12 text-lg">
        {t.desc}
      </p>
      <button 
        onClick={handleStart}
        className="group relative px-8 py-4 bg-yellow-900/30 border border-yellow-700/50 hover:bg-yellow-800/40 text-yellow-100 rounded-full transition-all duration-300 flex items-center gap-2 overflow-hidden"
      >
        <span className="relative z-10 text-lg">{t.start}</span>
        <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        <div className="absolute inset-0 bg-yellow-600/10 blur-xl group-hover:bg-yellow-600/20 transition-all" />
      </button>
    </div>
  );

  const renderCasting = () => {
    const linesCast = hexagram.lines.length;
    const isComplete = linesCast === 6;

    return (
      <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
        <div className="w-full h-64 bg-gray-800/50 rounded-lg p-6 mb-8 flex flex-col-reverse justify-start border border-gray-700 shadow-inner relative">
          {hexagram.lines.map((line, idx) => (
             <HexagramLine key={idx} type={line.lineType} index={idx} />
          ))}
          {linesCast === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
              <span className="opacity-50">Lines appear bottom to top</span>
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-10 justify-center">
            <Coin side={currentCoins[0]} animate={isFlipping} />
            <Coin side={currentCoins[1]} animate={isFlipping} />
            <Coin side={currentCoins[2]} animate={isFlipping} />
        </div>

        <div className="text-center">
          {!isComplete ? (
            <>
              <p className="text-gray-400 mb-4 text-sm uppercase tracking-widest">
                {t.cast_progress.replace('{current}', (linesCast + 1).toString())}
              </p>
              <button
                onClick={handleCast}
                disabled={isFlipping}
                className="w-full max-w-[200px] py-4 bg-indigo-900 hover:bg-indigo-800 disabled:bg-gray-700 text-white rounded-xl shadow-lg transition-all active:scale-95 border border-indigo-700 font-medium text-lg"
              >
                {isFlipping ? t.tossing : t.shake}
              </button>
            </>
          ) : (
             <div className="animate-in fade-in zoom-in duration-300">
               <p className="text-yellow-500 mb-4 font-medium">{t.complete}</p>
               <button
                onClick={handleFinishCasting}
                className="w-full max-w-[200px] py-4 bg-green-900 hover:bg-green-800 text-white rounded-xl shadow-lg transition-all border border-green-700 font-medium text-lg flex items-center justify-center gap-2"
              >
                {t.proceed} <ArrowRight size={18} />
              </button>
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuestion = () => (
    <div className="w-full max-w-md mx-auto px-6 py-10 animate-fade-in-up">
      <h2 className="text-2xl font-serif text-gray-200 mb-6 text-center">{t.question_title}</h2>
      <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-xl">
        <label className="block text-gray-400 text-sm mb-2">{t.question_label}</label>
        <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t.question_placeholder}
            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-4 text-gray-100 focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-all min-h-[120px] resize-none"
        />
        <div className="mt-6 flex justify-end">
             <button
                onClick={handleConsultOracle}
                className="px-6 py-3 bg-yellow-700 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg"
              >
                <Sparkles size={18} />
                {t.interpret}
              </button>
        </div>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="w-full max-w-2xl mx-auto px-4 pb-12 animate-fade-in">
        
      <div className="flex justify-between items-center mb-6 pt-4">
        <h2 className="text-2xl font-serif text-yellow-500">{t.result_title}</h2>
        <div className="flex gap-4">
             {resultSource === 'LOCAL' && step !== AppStep.Analyzing && (
                 <button 
                    onClick={handleAiDeepDive}
                    className="flex items-center gap-1 text-sm bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 px-3 py-1 rounded-full border border-indigo-700 transition-colors"
                 >
                    <BrainCircuit size={14} />
                    {t.btn_deep_interpret}
                 </button>
             )}
             <button onClick={handleReset} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                <RotateCcw size={14} /> {t.new_reading}
             </button>
        </div>
      </div>

      <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 mb-8 flex flex-col items-center">
         {question && (
             <div className="w-full text-center mb-4 pb-4 border-b border-gray-700/50">
                 <p className="text-yellow-600 text-xs uppercase font-bold tracking-widest mb-1">{t.question_display}</p>
                 <p className="text-gray-300 font-serif text-lg">"{question}"</p>
             </div>
         )}
         <div className="w-32 flex flex-col-reverse gap-1">
            {hexagram.lines.map((line, idx) => (
                <div key={idx} className="w-full h-2">
                     {(line.lineType === LineType.ShaoYin || line.lineType === LineType.LaoYin) ? (
                         <div className="flex justify-between h-full">
                             <div className={`w-[45%] h-full ${line.lineType === LineType.LaoYin ? 'bg-red-500/80' : 'bg-gray-400'}`}></div>
                             <div className={`w-[45%] h-full ${line.lineType === LineType.LaoYin ? 'bg-red-500/80' : 'bg-gray-400'}`}></div>
                         </div>
                     ) : (
                         <div className={`w-full h-full ${line.lineType === LineType.LaoYang ? 'bg-red-500/80' : 'bg-gray-400'}`}></div>
                     )}
                </div>
            ))}
         </div>
      </div>

      <div className="prose prose-invert prose-yellow max-w-none">
         <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 leading-relaxed text-gray-300 shadow-inner">
            {step === AppStep.Analyzing ? (
                 <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
                    <p className="text-gray-400 animate-pulse">{t.analyzing}</p>
                 </div>
            ) : (
                <div className="markdown-body">
                    {interpretation.split('\n').map((line, i) => (
                        <p key={i} className="mb-2 min-h-[1em]">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/^# (.*)/, '<h1 class="text-xl font-bold text-yellow-100 my-4">$1</h1>')
                        .replace(/^## (.*)/, '<h2 class="text-lg font-bold text-yellow-200 my-3">$1</h2>')
                        .replace(/^- (.*)/, '<li class="ml-4 list-disc">$1</li>')
                        }</p>
                    )).map((el, i) => <div key={i} dangerouslySetInnerHTML={{__html: el.props.children}} />)}
                </div>
            )}
         </div>
      </div>
      
      {step === AppStep.Result && resultSource === 'AI' && (
          <div className="mt-8 text-center text-gray-500 text-sm italic">
            {t.ai_disclaimer}
          </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="w-full max-w-2xl mx-auto px-4 pb-12 animate-fade-in">
        <div className="flex justify-between items-center mb-6 pt-4">
            <h2 className="text-2xl font-serif text-yellow-500">{t.history_title}</h2>
            {historyRecords.length > 0 && (
                <button onClick={handleClearHistory} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-sm">
                    <Trash2 size={14} /> {t.history_clear}
                </button>
            )}
        </div>

        {historyRecords.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
                <Clock size={48} className="mx-auto mb-4 opacity-30" />
                <p>{t.history_empty}</p>
            </div>
        ) : (
            <div className="space-y-4">
                {historyRecords.map((record) => {
                    const struct = getHexagramStructure(record.hexagram.lines);
                    const hexId = (struct.upper << 3) | struct.lower;
                    const hexName = HEXAGRAM_NAMES[hexId]?.[language] || "Unknown";
                    const dateStr = new Date(record.timestamp).toLocaleString(
                        language === 'en' ? 'en-US' : (language === 'ja' ? 'ja-JP' : 'zh-CN'),
                        { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                    );

                    return (
                        <div key={record.id} 
                             onClick={() => handleLoadRecord(record)}
                             className="bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700 hover:border-yellow-700/50 p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-yellow-600 font-serif font-bold">{hexName}</span>
                                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">{record.mode}</span>
                                </div>
                                <p className="text-gray-300 text-sm line-clamp-1 mb-1 font-medium">{record.question || t.question_placeholder.split('：')[0]}</p>
                                <p className="text-xs text-gray-500">{dateStr}</p>
                            </div>
                            <ChevronRight className="text-gray-600 group-hover:text-yellow-500 transition-colors" />
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans selection:bg-yellow-900 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 w-full p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(AppStep.Welcome)}>
            <Moon className="w-5 h-5 text-yellow-600" />
            <span className="font-serif font-bold text-lg tracking-wide text-gray-300 hidden md:block">ZenDivination</span>
            <span className="font-serif font-bold text-lg tracking-wide text-gray-300 md:hidden">六爻</span>
        </div>
        
        {/* Settings & History */}
        <div className="flex items-center gap-4">
             {/* History Button (Desktop & Mobile) */}
             <button 
                onClick={() => setStep(AppStep.History)}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${step === AppStep.History ? 'text-yellow-500 bg-gray-800' : 'text-gray-400'}`}
             >
                <Clock size={20} />
             </button>

             {/* Desktop Quick Settings */}
             <div className="hidden md:flex gap-4">
                 <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                    <Globe size={14} className="text-gray-400" />
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className="bg-transparent text-sm text-gray-300 outline-none border-none cursor-pointer"
                    >
                      <option value="zh-CN">简体</option>
                      <option value="zh-TW">繁體</option>
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                    <Cpu size={14} className="text-gray-400" />
                    <select 
                      value={mode} 
                      onChange={(e) => setMode(e.target.value as DivinationMode)}
                      className="bg-transparent text-sm text-gray-300 outline-none border-none cursor-pointer"
                    >
                      <option value="AI">{t.mode_ai}</option>
                      <option value="LOCAL">{t.mode_local}</option>
                    </select>
                 </div>
             </div>

             {/* Mobile Settings Toggle */}
             <button 
                onClick={() => setShowSettings(!showSettings)}
                className="md:hidden p-2 text-gray-400 hover:text-white"
             >
                <Settings2 size={20} />
             </button>
        </div>
      </nav>

      {/* Mobile Settings Panel */}
      {showSettings && (
          <div className="md:hidden relative z-20 bg-gray-900 border-b border-gray-800 p-4 animate-slide-down">
             <div className="mb-4">
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">{t.switch_lang}</label>
                <LanguageSelector />
             </div>
             <div>
                <label className="text-xs text-gray-500 uppercase font-bold mb-2 block">{t.switch_mode}</label>
                <ModeSelector />
             </div>
          </div>
      )}

      <main className="relative z-10 container mx-auto flex flex-col items-center pt-8 md:pt-16 pb-12">
        {step === AppStep.Welcome && renderWelcome()}
        {step === AppStep.Casting && renderCasting()}
        {step === AppStep.Question && renderQuestion()}
        {(step === AppStep.Analyzing || step === AppStep.Result) && renderResult()}
        {step === AppStep.History && renderHistory()}
      </main>
    </div>
  );
};

export default App;