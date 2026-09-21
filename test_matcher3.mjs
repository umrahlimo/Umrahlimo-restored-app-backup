function getCoreLocation(text) {
  if (!text) return '';
  const genericWords = [
    'airport', 'international', 'hotel', 'road', 'station', 'saudi', 'arabia', 'al'
  ];
  
  const words = text.toLowerCase()
    .replace(/[,\.\(\)]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !genericWords.includes(w))
    .filter(w => !/^\d+$/.test(w))
    .filter(w => !/^[a-z0-9]{4}\+/.test(w));
    
  return words;
}

function sharesCoreWord(text1, text2) {
  const core1 = getCoreLocation(text1);
  const core2 = getCoreLocation(text2);
  
  // If either side has no core words, we can't reliably filter, so we just return true to allow fallback scoring
  if (core1.length === 0 || core2.length === 0) return true;
  return core1.some(w => core2.includes(w));
}

console.log("Taif to Madinah:", sharesCoreWord("Airport Road, Taif Saudi Arabia", "Madinah Airport"));
console.log("Jeddah to Jeddah:", sharesCoreWord("Jeddah Airport", "Jeddah international airport"));
console.log("Makkah to Makkah:", sharesCoreWord("Makkah Hotel", "Al Haram, Makkah Saudi Arabia"));
console.log("Wadyia to Wadyia:", sharesCoreWord("Wadyia Jin", "Wadi E Jin, Madinah Saudi Arabia"));
console.log("Badr to Badr:", sharesCoreWord("Badr Mazarats", "Badar Saudi Arabia"));
