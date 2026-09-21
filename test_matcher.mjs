function getCoreLocation(text) {
  if (!text) return '';
  const genericWords = [
    'airport', 'international', 'hotel', 'road', 'station', 'saudi', 'arabia',
    'al', 'haram', 'mazarat', 'mazarats', 'train', 'via', 'meeqat', 'wadyia',
    'jin', 'badr', 'city', 'center', 'blue', 'area', 'town', 'enclave', 'king',
    'abdulaziz', 'platform', 'mount', 'arafat', 'munawwarah', 'vice', 'versa',
    'location', 'med'
  ];
  
  let core = text.toLowerCase()
    .replace(/[,\.\(\)]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !genericWords.includes(w))
    .filter(w => !/^\d+$/.test(w))
    .filter(w => !/^[a-z0-9]{4}\+/.test(w))
    .join(' ');
    
  return core;
}

const routes = [
  { from: 'Jeddah international airport', to: 'Makkah Hotel' },
  { from: 'King Abdulaziz International Airport, Jeddah Saudi Arabia', to: 'Al Haram, Makkah Saudi Arabia' },
  { from: 'Madinah Airport', to: 'Madinah Hotel' },
  { from: 'Airport Road, Taif Saudi Arabia', to: 'Al Haram, Madinah Saudi Arabia' },
  { from: 'Jeddah Airport', to: 'Makkah Hotel' },
  { from: 'ISB - Islamabad International Airport', to: 'Islamabad City Center/Blue Area'}
];

routes.forEach(r => {
  console.log(`"${r.from}" -> core: "${getCoreLocation(r.from)}"`);
  console.log(`"${r.to}" -> core: "${getCoreLocation(r.to)}"`);
});
