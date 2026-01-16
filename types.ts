// 0 = Yin (Back/Tail), 1 = Yang (Front/Head)
export type CoinSide = 0 | 1;

export enum LineType {
  ShaoYin = 'ShaoYin', // Young Yin (Unchanging Broken)
  ShaoYang = 'ShaoYang', // Young Yang (Unchanging Solid)
  LaoYin = 'LaoYin',   // Old Yin (Changing Broken -> Solid)
  LaoYang = 'LaoYang', // Old Yang (Changing Solid -> Broken)
}

export interface CastResult {
  coins: [CoinSide, CoinSide, CoinSide];
  lineType: LineType;
  value: number; // Sum of coins usually used to determine type
}

export interface HexagramData {
  lines: CastResult[]; // Index 0 is bottom line, Index 5 is top line
  timestamp: number;
}

export enum AppStep {
  Welcome = 'WELCOME',
  Casting = 'CASTING',
  Question = 'QUESTION',
  Analyzing = 'ANALYZING',
  Result = 'RESULT',
  History = 'HISTORY',
}

export interface GeminiResponse {
  markdown: string;
}

export type Language = 'zh-CN' | 'zh-TW' | 'en' | 'ja';
export type DivinationMode = 'AI' | 'LOCAL';

export interface HistoryRecord {
  id: string;
  timestamp: number;
  hexagram: HexagramData;
  question: string;
  interpretation: string;
  mode: DivinationMode;
  language: Language;
}