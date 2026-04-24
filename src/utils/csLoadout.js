/**
 * CS2 loadout weapon taxonomy — mirror of `flopobot_v2/src/utils/cs.weapons.js`.
 * Keep the two files in sync.
 */

export const WEAPON_SIDES = {
  'Glock-18': 't',
  'Tec-9': 't',
  'Sawed-Off': 't',
  'MAC-10': 't',
  'Galil AR': 't',
  'AK-47': 't',
  'SG 553': 't',
  G3SG1: 't',
  'USP-S': 'ct',
  P2000: 'ct',
  'Five-SeveN': 'ct',
  'MAG-7': 'ct',
  MP9: 'ct',
  FAMAS: 'ct',
  M4A4: 'ct',
  'M4A1-S': 'ct',
  AUG: 'ct',
  'SCAR-20': 'ct',
  'Desert Eagle': 'both',
  P250: 'both',
  'CZ75-Auto': 'both',
  'R8 Revolver': 'both',
  'Dual Berettas': 'both',
  Nova: 'both',
  XM1014: 'both',
  'MP5-SD': 'both',
  MP7: 'both',
  'PP-Bizon': 'both',
  P90: 'both',
  'UMP-45': 'both',
  M249: 'both',
  Negev: 'both',
  AWP: 'both',
  'SSG 08': 'both',
}

export const WEAPON_CATEGORY = {
  'Glock-18': 'starting',
  'USP-S': 'starting',
  P2000: 'starting',
  'Desert Eagle': 'other_pistol',
  'Tec-9': 'other_pistol',
  P250: 'other_pistol',
  'CZ75-Auto': 'other_pistol',
  'R8 Revolver': 'other_pistol',
  'Dual Berettas': 'other_pistol',
  'Five-SeveN': 'other_pistol',
  Nova: 'mid',
  XM1014: 'mid',
  'MAG-7': 'mid',
  'Sawed-Off': 'mid',
  'MAC-10': 'mid',
  'MP5-SD': 'mid',
  MP7: 'mid',
  MP9: 'mid',
  'PP-Bizon': 'mid',
  P90: 'mid',
  'UMP-45': 'mid',
  M249: 'mid',
  Negev: 'mid',
  'AK-47': 'rifle',
  'Galil AR': 'rifle',
  'SG 553': 'rifle',
  G3SG1: 'rifle',
  FAMAS: 'rifle',
  M4A4: 'rifle',
  'M4A1-S': 'rifle',
  AUG: 'rifle',
  'SCAR-20': 'rifle',
  AWP: 'rifle',
  'SSG 08': 'rifle',
}

export const LOADOUT_STRUCTURE = [
  { category: 'starting', count: 1, label: 'Départ' },
  { category: 'other_pistol', count: 4, label: 'Pistolets' },
  { category: 'mid', count: 5, label: 'Mid-tier' },
  { category: 'rifle', count: 5, label: 'Rifles' },
  { category: 'knife', count: 1, label: 'Couteau' },
  { category: 'gloves', count: 1, label: 'Gants' },
]

export const SIDES = ['t', 'ct']
export const SIDE_LABELS = { t: 'Côté T', ct: 'Côté CT' }

export function getWeaponKey(skin) {
  const name = skin?.marketHashName || ''
  const lower = name.toLowerCase()
  if (lower.includes('gloves') || lower.includes('wraps') || lower.includes('hand wrap'))
    return 'gloves'
  if (name.startsWith('★')) return 'knife'
  const sep = name.indexOf(' | ')
  return sep !== -1 ? name.slice(0, sep) : name
}

export function getCategoryForSkin(skin) {
  const key = getWeaponKey(skin)
  if (key === 'knife' || key === 'gloves') return key
  return WEAPON_CATEGORY[key] || null
}

export function isWeaponAllowedOnSide(weaponKey, side) {
  if (weaponKey === 'knife' || weaponKey === 'gloves') return true
  const weaponSide = WEAPON_SIDES[weaponKey]
  if (!weaponSide) return false
  return weaponSide === 'both' || weaponSide === side
}

export function parseLoadoutSlot(slot) {
  if (typeof slot !== 'string') return null
  const m = slot.match(/^(t|ct)_(starting|other|mid|rifle|knife|gloves)(?:_(\d+))?$/)
  if (!m) return null
  const [, side, cat, numStr] = m
  const categoryKey = cat === 'other' ? 'other_pistol' : cat
  const structure = LOADOUT_STRUCTURE.find((s) => s.category === categoryKey)
  if (!structure) return null
  if (structure.count === 1) {
    if (numStr !== undefined) return null
    return { side, category: categoryKey, index: 1 }
  }
  if (numStr === undefined) return null
  const index = parseInt(numStr, 10)
  if (!Number.isInteger(index) || index < 1 || index > structure.count) return null
  return { side, category: categoryKey, index }
}

export function buildLoadoutSlot(side, category, index = 1) {
  const structure = LOADOUT_STRUCTURE.find((s) => s.category === category)
  if (!structure) return null
  const catToken = category === 'other_pistol' ? 'other' : category
  if (structure.count === 1) return `${side}_${catToken}`
  return `${side}_${catToken}_${index}`
}

export function getEligibleSlotsForSkin(skin) {
  const category = getCategoryForSkin(skin)
  if (!category) return []
  const weaponKey = getWeaponKey(skin)
  const structure = LOADOUT_STRUCTURE.find((s) => s.category === category)
  if (!structure) return []
  const slots = []
  for (const side of SIDES) {
    if (!isWeaponAllowedOnSide(weaponKey, side)) continue
    if (category === 'starting' && side === 'ct' && weaponKey !== 'USP-S' && weaponKey !== 'P2000')
      continue
    for (let i = 1; i <= structure.count; i++) {
      slots.push(buildLoadoutSlot(side, category, i))
    }
  }
  return slots
}

/** Builds the full ordered list of slots for a given side (used by render code). */
export function getSlotsForSide(side) {
  const slots = []
  for (const block of LOADOUT_STRUCTURE) {
    for (let i = 1; i <= block.count; i++) {
      slots.push({
        id: buildLoadoutSlot(side, block.category, i),
        side,
        category: block.category,
        index: i,
        label: block.label,
      })
    }
  }
  return slots
}
