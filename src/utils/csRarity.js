export const CS_RARITY_COLORS = {
  'Consumer Grade': '#b0c3d9',
  'Industrial Grade': '#5e98d9',
  'Mil-Spec Grade': '#4b69ff',
  Restricted: '#8847ff',
  Classified: '#d32ce6',
  Covert: '#eb4b4b',
  Extraordinary: '#ffd700',
}

export const TRADE_UP_LADDER = [
  'Consumer Grade',
  'Industrial Grade',
  'Mil-Spec Grade',
  'Restricted',
  'Classified',
  'Covert',
]

export function getRarityColor(rarity) {
  return CS_RARITY_COLORS[rarity] || '#ffffff'
}

export function getNextRarity(rarity) {
  const idx = TRADE_UP_LADDER.indexOf(rarity)
  if (idx === -1 || idx === TRADE_UP_LADDER.length - 1) return null
  return TRADE_UP_LADDER[idx + 1]
}

export function canTradeUp(rarity) {
  const idx = TRADE_UP_LADDER.indexOf(rarity)
  return idx >= 0 && idx < TRADE_UP_LADDER.length - 1
}
