import { HexagramData, Language, LineType } from "../types";
import { TRIGRAMS, UI_TEXT, HEXAGRAM_NAMES } from "../constants";
import { getHexagramStructure } from "../utils/divination";

// Helpers for element relationships
const ELEMENT_RELATIONS: Record<string, Record<string, 'Generate' | 'Overcome' | 'Same' | 'GeneratedBy' | 'OvercomedBy'>> = {
  'Metal': { 'Metal': 'Same', 'Water': 'Generate', 'Wood': 'Overcome', 'Earth': 'GeneratedBy', 'Fire': 'OvercomedBy' },
  'Water': { 'Water': 'Same', 'Wood': 'Generate', 'Fire': 'Overcome', 'Metal': 'GeneratedBy', 'Earth': 'OvercomedBy' },
  'Wood': { 'Wood': 'Same', 'Fire': 'Generate', 'Earth': 'Overcome', 'Water': 'GeneratedBy', 'Metal': 'OvercomedBy' },
  'Fire': { 'Fire': 'Same', 'Earth': 'Generate', 'Metal': 'Overcome', 'Wood': 'GeneratedBy', 'Water': 'OvercomedBy' },
  'Earth': { 'Earth': 'Same', 'Metal': 'Generate', 'Water': 'Overcome', 'Fire': 'GeneratedBy', 'Wood': 'OvercomedBy' },
  // Localized fallbacks
  '金': { '金': 'Same', '水': 'Generate', '木': 'Overcome', '土': 'GeneratedBy', '火': 'OvercomedBy' },
  '水': { '水': 'Same', '木': 'Generate', '火': 'Overcome', '金': 'GeneratedBy', '土': 'OvercomedBy' },
  '木': { '木': 'Same', '火': 'Generate', '土': 'Overcome', '水': 'GeneratedBy', '金': 'OvercomedBy' },
  '火': { '火': 'Same', '土': 'Generate', '金': 'Overcome', '木': 'GeneratedBy', '水': 'OvercomedBy' },
  '土': { '土': 'Same', '金': 'Generate', '水': 'Overcome', '火': 'GeneratedBy', '木': 'OvercomedBy' }
};

const getSixRelation = (lineElement: string, palaceElement: string, lang: Language): string => {
  // Normalize elements to English for logic if needed, but the map handles local names
  // We assume consistent input (either all EN or all ZH)
  // But wait, TRIGRAMS const has localized elements.
  // We need a consistent key. Let's map everything to EN for logic then format back.
  
  const mapToEn: Record<string, string> = {
    '金': 'Metal', '木': 'Wood', '水': 'Water', '火': 'Fire', '土': 'Earth',
    'Metal': 'Metal', 'Wood': 'Wood', 'Water': 'Water', 'Fire': 'Fire', 'Earth': 'Earth'
  };

  const lEl = mapToEn[lineElement];
  const pEl = mapToEn[palaceElement];
  const relation = ELEMENT_RELATIONS[lEl][pEl];
  const t = UI_TEXT[lang];

  switch (relation) {
    case 'Same': return t.rel_brother;
    case 'GeneratedBy': return t.rel_parent;
    case 'Generate': return t.rel_offspring;
    case 'Overcome': return t.rel_wealth;
    case 'OvercomedBy': return t.rel_official;
    default: return '?';
  }
};

// Algorithm to find the Palace (Gong) and Shi/Ying positions
// Based on line flipping method
const findPalaceState = (lines: number[]) => {
    // lines: array of 0/1 (bottom to top)
    const pureHexagrams = [
        0, // 000000 Earth (Kun)
        7, // 001000 -> Not pure. Pure are 111111(63), 000000(0) etc.
        // Pure Hexagrams indices:
        // Qian(63), Dui(27), Li(45), Zhen(9), Xun(54), Kan(18), Gen(36), Kun(0)
    ];
    // We don't need a list, we simulate the logic.
    
    // Convert current lines to an ID to check against pure
    const getVal = (ls: number[]) => {
         const lower = (ls[2]<<2)|(ls[1]<<1)|ls[0];
         const upper = (ls[5]<<2)|(ls[4]<<1)|ls[3];
         return (upper<<3)|lower;
    };

    // Helper: is pure? (Upper == Lower)
    const isPure = (ls: number[]) => {
        const lower = (ls[2]<<2)|(ls[1]<<1)|ls[0];
        const upper = (ls[5]<<2)|(ls[4]<<1)|ls[3];
        return lower === upper; // Roughly true for 8 pure hexagrams
    };

    let temp = [...lines];
    
    // 1. Pure?
    if (isPure(temp)) return { palaceLine: 6, shi: 5, ying: 2, variant: 'Pure' };

    // 2. Flip 1 (Bottom)
    temp[0] = temp[0] ^ 1;
    if (isPure(temp)) return { palaceLine: 1, shi: 0, ying: 3, variant: 'Gen 1' };

    // 3. Flip 2
    temp[1] = temp[1] ^ 1;
    if (isPure(temp)) return { palaceLine: 2, shi: 1, ying: 4, variant: 'Gen 2' };

    // 4. Flip 3
    temp[2] = temp[2] ^ 1;
    if (isPure(temp)) return { palaceLine: 3, shi: 2, ying: 5, variant: 'Gen 3' };

    // 5. Flip 4
    temp[3] = temp[3] ^ 1;
    if (isPure(temp)) return { palaceLine: 4, shi: 3, ying: 0, variant: 'Gen 4' };

    // 6. Flip 5
    temp[4] = temp[4] ^ 1;
    if (isPure(temp)) return { palaceLine: 5, shi: 4, ying: 1, variant: 'Gen 5' };

    // 7. Wandering Soul (Flip 4 back)
    temp[3] = temp[3] ^ 1; // Restore 4? No, the logic implies starting from the result of step 6.
    // Correct Wandering Soul: Flip 4th line OF THE 5th GENERATION HEXAGRAM.
    // temp is currently Gen 5. Flip 4 (index 3).
    // Actually, simple rule: If 5 flips didn't find pure, it's either Wandering (You Hun) or Returning (Gui Hun).
    // Wandering Soul: Pure match is found by flipping line 4 of the *original*? No.
    // Wandering Soul = Gen 5 + flip 4. Shi = 3, Ying = 0.
    
    // Let's optimize. The loop modified `temp`. `temp` is now Gen 5 hexagram.
    // Check Wandering: Flip line 3 (4th line) of current `temp`.
    temp[3] = temp[3] ^ 1;
    if (isPure(temp)) return { palaceLine: 4, shi: 3, ying: 0, variant: 'Wandering' };

    // 8. Return Soul (Gui Hun): Inner trigram returns to original state (Pure matches Outer).
    // Logic: Shi = 2, Ying = 5. The Pure Hexagram is based on the LOWER trigram of the *original*?
    // No, standard is Shi at 3rd.
    // Let's assume remaining is Return Soul.
    return { palaceLine: 3, shi: 2, ying: 5, variant: 'Return' };
};

export const interpretHexagramLocal = async (
  hexagram: HexagramData,
  language: Language
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 800));

  const t = UI_TEXT[language];
  const originalStruct = getHexagramStructure(hexagram.lines);
  const originalHexID = (originalStruct.upper << 3) | originalStruct.lower;
  
  // Future Hexagram
  // Simplified logic for future binary
  const futureBinary = hexagram.lines.map(l => {
     if (l.lineType === LineType.ShaoYin) return 0;
     if (l.lineType === LineType.ShaoYang) return 1;
     if (l.lineType === LineType.LaoYin) return 1; // Change to Yang
     if (l.lineType === LineType.LaoYang) return 0; // Change to Yin
     return 0;
  });
  
  // Calculate Future ID
  const fLower = (futureBinary[2]<<2)|(futureBinary[1]<<1)|futureBinary[0];
  const fUpper = (futureBinary[5]<<2)|(futureBinary[4]<<1)|futureBinary[3];
  const futureHexID = (fUpper << 3) | fLower;

  // Identify Names
  const origName = HEXAGRAM_NAMES[originalHexID]?.[language] || "Unknown";
  const futureName = HEXAGRAM_NAMES[futureHexID]?.[language] || "Unknown";

  // Identify Trigrams
  const upTri = TRIGRAMS[originalStruct.upper][language];
  const loTri = TRIGRAMS[originalStruct.lower][language];

  // --- Six Relations Diagnosis ---
  // 1. Find Palace
  const palaceState = findPalaceState(originalStruct.lines);
  // The Palace Element is determined by the Pure Hexagram found in `temp` (which is now `lines` transformed).
  // We need to re-run or trace which Pure Hexagram it belonged to.
  // Actually, simpler: The Palace is defined by the Outer Trigram for Return Soul, otherwise...
  // Let's re-simulate quickly to get the Pure Hexagram ID.
  let pTemp: number[] = [...originalStruct.lines];
  if (palaceState.variant === 'Gen 1') pTemp[0] ^= 1;
  else if (palaceState.variant === 'Gen 2') { pTemp[0]^=1; pTemp[1]^=1; }
  else if (palaceState.variant === 'Gen 3') { pTemp[0]^=1; pTemp[1]^=1; pTemp[2]^=1; }
  else if (palaceState.variant === 'Gen 4') { pTemp[0]^=1; pTemp[1]^=1; pTemp[2]^=1; pTemp[3]^=1; }
  else if (palaceState.variant === 'Gen 5') { pTemp[0]^=1; pTemp[1]^=1; pTemp[2]^=1; pTemp[3]^=1; pTemp[4]^=1; }
  else if (palaceState.variant === 'Wandering') { pTemp[0]^=1; pTemp[1]^=1; pTemp[2]^=1; pTemp[3]^=1; pTemp[4]^=1; pTemp[3]^=1; }
  else if (palaceState.variant === 'Return') { 
      // Return Soul: Lower trigram becomes same as Upper.
      // So Pure Hex is Upper over Upper.
      const u = originalStruct.upper;
      // Reconstruct lines from trigram
      pTemp = [(u&1), (u>>1)&1, (u>>2)&1, (u&1), (u>>1)&1, (u>>2)&1];
  }
  
  const palaceTrigramID = (pTemp[5]<<2)|(pTemp[4]<<1)|pTemp[3]; // Upper trigram of Pure is the Palace
  const palaceElement = TRIGRAMS[palaceTrigramID][language].element;
  const palaceName = TRIGRAMS[palaceTrigramID][language].name;

  // 2. Identify Elements of Shi and Ying Lines
  // Simplified Na Jia: Use Trigram Element of the line's position.
  // Line 0,1,2 use Lower Trigram Element. Line 3,4,5 use Upper Trigram Element.
  // *Note*: Real Na Jia assigns branches, but for local approximate logic, Trigram element is a valid proxy for "Environment".
  const shiIndex = palaceState.shi;
  const yingIndex = palaceState.ying;
  
  const shiTriID = shiIndex < 3 ? originalStruct.lower : originalStruct.upper;
  const yingTriID = yingIndex < 3 ? originalStruct.lower : originalStruct.upper;
  
  const shiElement = TRIGRAMS[shiTriID][language].element;
  const yingElement = TRIGRAMS[yingTriID][language].element;

  const shiRelation = getSixRelation(shiElement, palaceElement, language);
  const yingRelation = getSixRelation(yingElement, palaceElement, language);

  // --- Logic for Sections ---

  // 1. Current Status
  const statusText = `${origName}。${t.sec_status.replace(/[【】\[\]]/g,'')} : ${upTri.nature}${loTri.nature}。
${upTri.attribute} ${language === 'en'?'over':'于'} ${loTri.attribute}。`;

  // 2. Six Relations Diagnosis
  const diagnosisText = `
- **${t.lbl_palace}**: ${palaceName} (${palaceElement})
- **${t.lbl_subject}**: ${t.line_label_bottom.replace('初爻', (shiIndex+1).toString())} [${shiElement}] -> ${shiRelation}
- **${t.lbl_object}**: ${t.line_label_bottom.replace('初爻', (yingIndex+1).toString())} [${yingElement}] -> ${yingRelation}
  `;

  // 3. Main Contradiction
  // Relationship between Shi and Ying
  const mapToEn = (e:string) => (['金','木','水','火','土'].includes(e) ? { '金':'Metal','木':'Wood','水':'Water','火':'Fire','土':'Earth' }[e] : e) || e;
  const sE = mapToEn(shiElement);
  const yE = mapToEn(yingElement);
  
  // Need English map for logic check, but keeping localized text for output
  const syRel = ELEMENT_RELATIONS[sE][yE]; // Shi vs Ying
  
  let contradictionText = "";
  if (syRel === 'Same') contradictionText = language==='en'?"Subject and Object are in harmony (Brother). Collaboration.":"世应比和，谋事可成，利于合作。";
  else if (syRel === 'Generate') contradictionText = language==='en'?"Subject supports Object. You are investing effort.":"世爻生应爻。你去生彼，虽耗费心力，但由于你主动。";
  else if (syRel === 'GeneratedBy') contradictionText = language==='en'?"Object supports Subject. You receive help.":"应爻生世爻。彼来生我，即使不动也有人相助，大吉。";
  else if (syRel === 'Overcome') contradictionText = language==='en'?"Subject controls Object. You have the upper hand.":"世爻克应爻。我克彼，你能掌控局势，利于进取。";
  else if (syRel === 'OvercomedBy') contradictionText = language==='en'?"Object controls Subject. Pressure from environment.":"应爻克世爻。彼来克我，压力较大，事多阻滞。";

  // 4. Future Trend
  const hasChange = originalHexID !== futureHexID;
  const futureText = hasChange 
    ? `${futureName}. ${language==='en'?'Situation evolves to this state.':'卦象变至此。'} ` 
    : (language==='en'?"No moving lines. Situation is stable.":"无动爻，局势稳定，当以静制动。");

  // 5. Advice
  let adviceText = "";
  // Simple heuristic advice based on Shi Relation
  if (shiRelation.includes(t.rel_wealth)) adviceText += language==='en'?"Good for financial gain. ":"利于求财。";
  if (shiRelation.includes(t.rel_official)) adviceText += language==='en'?"Be careful of stress or authority. ":"注意压力与官非，或利于求名。";
  if (shiRelation.includes(t.rel_parent)) adviceText += language==='en'?"Seek guidance or study. ":"利于文书、长辈助力。";
  if (hasChange && futureText.includes("Unknown")) adviceText += "";

  return `
# ${t.result_title}

### ${t.sec_status}
${statusText}

### ${t.sec_diagnosis}
${diagnosisText}

### ${t.sec_contradiction}
${contradictionText}

### ${t.sec_future}
${futureText}

### ${t.sec_advice}
${adviceText}
  `;
};
