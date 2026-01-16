import React from 'react';
import { LineType } from '../types';

interface HexagramLineProps {
  type: LineType;
  index: number; // 0 (bottom) to 5 (top)
  showChange?: boolean; // Whether to show the resulting changed line
}

const HexagramLine: React.FC<HexagramLineProps> = ({ type, index, showChange = false }) => {
  
  // Render logic for the "Original" hexagram line
  const renderOriginal = () => {
    const isYin = type === LineType.ShaoYin || type === LineType.LaoYin;
    const isMoving = type === LineType.LaoYin || type === LineType.LaoYang;
    
    // Changing lines often highlighted in red or with a marker
    const colorClass = isMoving ? "bg-red-500" : "bg-gray-200";
    const label = isMoving ? (type === LineType.LaoYin ? "X" : "O") : "";

    return (
      <div className="flex items-center w-full h-8 my-1 relative animate-fadeIn">
         {/* Line visualization */}
         <div className="flex-1 flex justify-center items-center h-full relative">
            {isYin ? (
                // Broken Line
                <div className="w-full flex justify-between h-4">
                    <div className={`w-[45%] h-full ${colorClass} shadow-sm rounded-sm`}></div>
                    <div className={`w-[45%] h-full ${colorClass} shadow-sm rounded-sm`}></div>
                </div>
            ) : (
                // Solid Line
                <div className={`w-full h-4 ${colorClass} shadow-sm rounded-sm`}></div>
            )}
            
            {/* Moving Line Marker */}
            {isMoving && (
                <div className="absolute right-[-20px] text-xs text-red-400 font-bold">
                    {label}
                </div>
            )}
         </div>
      </div>
    );
  };

  return renderOriginal();
};

export default HexagramLine;
