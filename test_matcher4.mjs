function checkCityMismatch(text1, text2) {
  text1 = (text1 || '').toLowerCase();
  text2 = (text2 || '').toLowerCase();
  
  const cities = [
    ['makkah', 'makka'],
    ['madinah', 'madina', 'med'],
    ['jeddah'],
    ['taif'],
    ['islamabad', 'isb']
  ];
  
  for (const aliases of cities) {
    const hasCity1 = aliases.some(a => text1.includes(a));
    const hasCity2 = aliases.some(a => text2.includes(a));
    
    // If one string mentions a city, but the other doesn't mention ANY alias of that city, it's a mismatch
    if (hasCity1 !== hasCity2) {
      return true; // Mismatch found
    }
  }
  
  return false; // No mismatch
}

console.log("Taif vs Madinah Airport:", checkCityMismatch("Airport Road, Taif Saudi Arabia", "Madinah Airport"));
console.log("Jeddah vs Jeddah Int:", checkCityMismatch("Jeddah Airport", "King Abdulaziz International Airport, Jeddah Saudi Arabia"));
console.log("Makkah vs Makkah:", checkCityMismatch("Makkah Hotel", "Al Haram, Makkah Saudi Arabia"));
console.log("Madina vs Madinah:", checkCityMismatch("Madina Hotel", "Madinah Airport"));
