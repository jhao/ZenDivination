import React from 'react';
import { CoinSide } from '../types';

interface CoinProps {
  side: CoinSide | null;
  animate: boolean;
}

const Coin: React.FC<CoinProps> = ({ side, animate }) => {
  return (
    <div className={`w-20 h-20 rounded-full border-4 border-yellow-600 flex items-center justify-center shadow-lg transform transition-all duration-700 bg-yellow-100 ${animate ? 'rotate-[720deg] scale-110' : ''}`}>
      {side === null ? (
        <span className="text-yellow-800 text-xs">?</span>
      ) : side === 1 ? (
        // Yang / Front / Text Side
        <div className="text-center">
          <span className="block text-2xl font-bold text-yellow-800">乾隆</span>
          <span className="block text-xs text-yellow-700">通宝</span>
        </div>
      ) : (
        // Yin / Back / Flower Side
        <div className="w-12 h-12 bg-yellow-800/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-800" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
            </svg>
        </div>
      )}
    </div>
  );
};

export default Coin;
