function getCoreLocation(text) {
  if (!text) return '';
  const genericWords = [
    'airport', 'international', 'hotel', 'road', 'station', 'saudi', 'arabia',
    'al', 'haram', 'mazarat', 'mazarats', 'train', 'via', 'meeqat', 'wadyia',
    'jin', 'badr', 'city', 'center', 'blue', 'area', 'town', 'enclave', 'king',
    'abdulaziz', 'platform', 'mount', 'arafat', 'munawwarah', 'vice', 'versa',
    'location', 'med'
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
  
  if (core1.length === 0 || core2.length === 0) return false;
  return core1.some(w => core2.includes(w));
}

console.log("Taif to Madinah Airport:", sharesCoreWord("Airport Road, Taif Saudi Arabia", "Madinah Airport"));
console.log("Jeddah to Jeddah Airport:", sharesCoreWord("Jeddah Airport", "Jeddah international airport"));
console.log("Makkah to Al Haram:", sharesCoreWord("Makkah Hotel", "Al Haram, Makkah Saudi Arabia"));
