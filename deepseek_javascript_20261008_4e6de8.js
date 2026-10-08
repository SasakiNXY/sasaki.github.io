// Stats inspirées de BO1 Zombies. Cadence en RPM, dégâts bruts, portée en mètres.

export const WEAPONS = {
  // --- STARTING ---
  'M1911': { cat: 'Pistol', dmg: 40, rpm: 400, mag: 8, reserve: 80, reload: 1.6, spread: 0.012, adsSpread: 0.006, mode: 'semi', range: 40, reserveMax: 80, upgradedName: 'M1911. (Mustang)' },

  // --- WALL BUYS ---
  'Olympia': { cat: 'Shotgun', dmg: 30, pellets: 6, rpm: 90, mag: 2, reserve: 38, reload: 2.8, spread: 0.09, adsSpread: 0.06, mode: 'pump', range: 15, reserveMax: 38, upgradedName: 'Hades' },
  'M14':     { cat: 'Rifle',   dmg: 45, rpm: 350, mag: 8, reserve: 96, reload: 2.0, spread: 0.008, adsSpread: 0.003, mode: 'semi', range: 90, reserveMax: 96, upgradedName: 'Mnesia' },
  'MPL':     { cat: 'SMG',     dmg: 30, rpm: 700, mag: 30, reserve: 180, reload: 2.0, spread: 0.018, adsSpread: 0.008, mode: 'auto', range: 40, reserveMax: 180, upgradedName: 'MPL-E' },
  'PM63':    { cat: 'SMG',     dmg: 28, rpm: 750, mag: 25, reserve: 175, reload: 1.9, spread: 0.017, adsSpread: 0.008, mode: 'auto', range: 40, reserveMax: 175, upgradedName: 'Tokyo & Rose' },
  'MP40':    { cat: 'SMG',     dmg: 40, rpm: 750, mag: 32, reserve: 192, reload: 2.1, spread: 0.016, adsSpread: 0.007, mode: 'auto', range: 45, reserveMax: 192, upgradedName: 'Afterburner' },
  'MP5K':    { cat: 'SMG',     dmg: 35, rpm: 800, mag: 30, reserve: 180, reload: 1.9, spread: 0.015, adsSpread: 0.006, mode: 'auto', range: 45, reserveMax: 180, upgradedName: 'MP115 Kollider' },
  'AK74u':   { cat: 'SMG',     dmg: 40, rpm: 750, mag: 30, reserve: 180, reload: 2.2, spread: 0.014, adsSpread: 0.006, mode: 'auto', range: 50, reserveMax: 180, upgradedName: 'AK74fu2' },
  'Stakeout':{ cat: 'Shotgun', dmg: 45, pellets: 8, rpm: 90, mag: 6, reserve: 48, reload: 3.0, spread: 0.08, adsSpread: 0.05, mode: 'pump', range: 18, reserveMax: 48, upgradedName: 'Raid' },
  'M16':     { cat: 'Rifle',   dmg: 40, rpm: 800, mag: 30, reserve: 180, reload: 2.0, spread: 0.010, adsSpread: 0.004, mode: 'auto', range: 70, reserveMax: 180, upgradedName: 'Skullcrusher' },
  'Frag Grenade': { cat: 'Lethal', dmg: 200, radius: 6, fuse: 3.0, isGrenade: true },
  'Claymore': { cat: 'Tactical', dmg: 250, radius: 5, isPlaceable: true },
  'Bowie Knife': { cat: 'Melee', dmg: 500, rpm: 60, isMelee: true },

  // --- MYSTERY BOX ---
  'Ray Gun':        { cat: 'Wonder', dmg: 200, rpm: 130, mag: 20, reserve: 160, reload: 2.5, spread: 0.005, adsSpread: 0.002, mode: 'semi', range: 60, reserveMax: 160, isWonder: true, upgradedName: "Porter's X2 Ray Gun", splashDmg: 100, splashRadius: 2.5 },
  'Thundergun':     { cat: 'Wonder', dmg: 1000, rpm: 60, mag: 2, reserve: 12, reload: 3.5, spread: 0.0, adsSpread: 0.0, mode: 'single', range: 12, reserveMax: 12, isWonder: true, upgradedName: 'Zeus Cannon', shockwave: true },
  'Wunderwaffe DG-2': { cat: 'Wonder', dmg: 300, rpm: 120, mag: 3, reserve: 15, reload: 4.0, spread: 0.005, adsSpread: 0.002, mode: 'semi', range: 90, reserveMax: 15, isWonder: true, upgradedName: 'Wunderwaffe DG-3 JZ', chain: 5 },
  'Crossbow':       { cat: 'Special', dmg: 100, rpm: 60, mag: 1, reserve: 12, reload: 2.5, spread: 0.005, adsSpread: 0.002, mode: 'single', range: 60, reserveMax: 12, explosiveBolt: true, upgradedName: 'Awful Lawton' },
  'Ballistic Knife':{ cat: 'Special', dmg: 200, rpm: 150, mag: 1, reserve: 6, reload: 1.8, spread: 0.01, adsSpread: 0.005, mode: 'single', range: 40, reserveMax: 6, upgradedName: 'The Krauss Refibrillator' },
  'Monkey Bombs':   { cat: 'Tactical', dmg: 0, isMonkey: true, count: 3, upgradedName: 'Monkey Bombs' },

  // --- BOX CLASSIQUES ---
  'MP40 (Box)':  { cat: 'SMG', dmg: 50, rpm: 750, mag: 32, reserve: 192, reload: 2.1, spread: 0.014, adsSpread: 0.006, mode: 'auto', range: 50, reserveMax: 192, upgradedName: 'Afterburner+' },
  'Thompson':    { cat: 'SMG', dmg: 40, rpm: 800, mag: 30, reserve: 180, reload: 2.4, spread: 0.016, adsSpread: 0.007, mode: 'auto', range: 45, reserveMax: 180, upgradedName: 'Gibbs & Co.' },
  'Trench Gun':  { cat: 'Shotgun', dmg: 50, pellets: 8, rpm: 90, mag: 6, reserve: 48, reload: 3.0, spread: 0.075, adsSpread: 0.045, mode: 'pump', range: 20, reserveMax: 48, upgradedName: 'Gut Shot' },
  'Panzerfaust': { cat: 'Launcher', dmg: 500, rpm: 30, mag: 1, reserve: 5, reload: 3.5, spread: 0.02, adsSpread: 0.01, mode: 'single', range: 100, reserveMax: 5, explosive: true, upgradedName: 'Panzerpack' },
  'Panzerschreck':{ cat: 'Launcher', dmg: 600, rpm: 30, mag: 1, reserve: 5, reload: 3.8, spread: 0.02, adsSpread: 0.01, mode: 'single', range: 100, reserveMax: 5, explosive: true, upgradedName: 'Panzerschreck+' },
  'MG42':        { cat: 'LMG', dmg: 60, rpm: 900, mag: 75, reserve: 300, reload: 4.5, spread: 0.022, adsSpread: 0.012, mode: 'auto', range: 80, reserveMax: 300, upgradedName: 'HMG42' },
  'HK21':        { cat: 'LMG', dmg: 55, rpm: 800, mag: 100, reserve: 400, reload: 4.8, spread: 0.020, adsSpread: 0.010, mode: 'auto', range: 85, reserveMax: 400, upgradedName: 'HK21+' },
  'RPK':         { cat: 'LMG', dmg: 50, rpm: 700, mag: 40, reserve: 240, reload: 3.2, spread: 0.018, adsSpread: 0.008, mode: 'auto', range: 80, reserveMax: 240, upgradedName: 'R115 Resonator' },
  'Dragunov':    { cat: 'Sniper', dmg: 150, rpm: 60, mag: 10, reserve: 60, reload: 3.5, spread: 0.003, adsSpread: 0.0005, mode: 'semi', range: 150, reserveMax: 60, scope: true, upgradedName: 'D115 Disassembler' },
  'L96A1':       { cat: 'Sniper', dmg: 200, rpm: 45, mag: 5, reserve: 30, reload: 3.5, spread: 0.002, adsSpread: 0.0003, mode: 'bolt', range: 200, reserveMax: 30, scope: true, upgradedName: 'L115 Isolator' },
  'Commando':    { cat: 'Rifle', dmg: 50, rpm: 750, mag: 30, reserve: 180, reload: 2.2, spread: 0.010, adsSpread: 0.004, mode: 'auto', range: 80, reserveMax: 180, upgradedName: 'Predator' },
  'Galil':       { cat: 'Rifle', dmg: 55, rpm: 750, mag: 35, reserve: 210, reload: 2.4, spread: 0.011, adsSpread: 0.005, mode: 'auto', range: 75, reserveMax: 210, upgradedName: 'Lamentation' },
  'FAMAS':       { cat: 'Rifle', dmg: 45, rpm: 900, mag: 30, reserve: 180, reload: 2.3, spread: 0.010, adsSpread: 0.004, mode: 'auto', range: 75, reserveMax: 180, upgradedName: 'G16-GL35' },
  'AUG':         { cat: 'Rifle', dmg: 50, rpm: 750, mag: 30, reserve: 180, reload: 2.3, spread: 0.010, adsSpread: 0.004, mode: 'auto', range: 80, reserveMax: 180, upgradedName: 'AUG-50M3' },
  'G11':         { cat: 'Rifle', dmg: 60, rpm: 900, mag: 48, reserve: 240, reload: 3.0, spread: 0.008, adsSpread: 0.003, mode: 'burst', range: 90, reserveMax: 240, upgradedName: 'G115 Generator' },
};

export const MYSTERY_BOX_POOL = [
  'Ray Gun', 'Thundergun', 'Wunderwaffe DG-2', 'Crossbow', 'Ballistic Knife', 'Monkey Bombs',
  'MP40 (Box)', 'Thompson', 'Trench Gun', 'Panzerfaust', 'Panzerschreck',
  'MG42', 'HK21', 'RPK', 'Dragunov', 'L96A1', 'Commando', 'Galil', 'FAMAS', 'AUG', 'G11'
];

export function getWeaponData(name) {
  return WEAPONS[name] || null;
}

export function getUpgradedName(name) {
  const w = WEAPONS[name];
  return w?.upgradedName || null;
}