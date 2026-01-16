import { CoinSide, LineType, CastResult } from "../types";
import { COIN_VALUES } from "../constants";

export const castCoins = (): CastResult => {
  const coins: [CoinSide, CoinSide, CoinSide] = [
    Math.random() < 0.5 ? 0 : 1,
    Math.random() < 0.5 ? 0 : 1,
    Math.random() < 0.5 ? 0 : 1,
  ];

  const sum = coins.reduce((acc, side) => acc + (side === 0 ? COIN_VALUES.BACK : COIN_VALUES.FRONT), 0);

  let lineType: LineType;

  switch (sum) {
    case 6: // Old Yin
      lineType = LineType.LaoYin;
      break;
    case 7: // Shao Yang
      lineType = LineType.ShaoYang;
      break;
    case 8: // Shao Yin
      lineType = LineType.ShaoYin;
      break;
    case 9: // Old Yang
      lineType = LineType.LaoYang;
      break;
    default:
      throw new Error("Impossible coin sum");
  }

  return {
    coins,
    lineType,
    value: sum,
  };
};

export const getHexagramStructure = (lines: CastResult[]) => {
    // Determine Binary Value (Bottom Line = Least Significant Bit or simply index 0)
    // For Trigrams, we usually group 1-3 (Lower) and 4-6 (Upper)
    
    // Convert line types to 0 (Yin) or 1 (Yang) for the *Original* Hexagram
    const binaryLines = lines.map(line => 
        (line.lineType === LineType.ShaoYang || line.lineType === LineType.LaoYang) ? 1 : 0
    );

    // Helper to get integer value from array of 0s and 1s [bottom, mid, top]
    const getTrigramValue = (l1: number, l2: number, l3: number) => {
        return (l3 << 2) | (l2 << 1) | l1;
    };

    const lowerTrigram = getTrigramValue(binaryLines[0], binaryLines[1], binaryLines[2]);
    const upperTrigram = getTrigramValue(binaryLines[3], binaryLines[4], binaryLines[5]);

    return {
        lower: lowerTrigram,
        upper: upperTrigram,
        lines: binaryLines
    };
};
