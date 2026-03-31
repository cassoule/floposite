const RANKS = [
  { min: 1200, max: 1400, name: 'Bronze', icon: '/ranks_icons/bronze.svg', color: '#C58A48', divs: [1250, 1300, 1350] },
  { min: 1400, max: 1600, name: 'Silver', icon: '/ranks_icons/silver.svg', color: '#BDC3C5', divs: [1450, 1500, 1550] },
  { min: 1600, max: 1850, name: 'Gold', icon: '/ranks_icons/gold.svg', color: '#FED833', divs: [1663, 1725, 1788] },
  { min: 1850, max: 2100, name: 'Diamond', icon: '/ranks_icons/diamond.svg', color: '#A6D5E9', divs: [1913, 1975, 2038] },
  { min: 2100, max: Infinity, name: 'Master', icon: '/ranks_icons/master.svg', color: '#77BB77', divs: [] },
]

const DIV_LABELS = ['I', 'II', 'III', 'IV']

function getRank(elo) {
  if (!elo) return null
  return RANKS.find((r) => elo >= r.min && elo < r.max) ?? null
}

export function rankIcon(elo) {
  return getRank(elo)?.icon ?? ''
}

export function rankDiv(elo) {
  const rank = getRank(elo)
  if (!rank || rank.divs.length === 0) return ''
  for (let i = 0; i < rank.divs.length; i++) {
    if (elo < rank.divs[i]) return DIV_LABELS[i]
  }
  return DIV_LABELS[rank.divs.length]
}

export function rankText(elo) {
  const rank = getRank(elo)
  if (!rank) return 'Non classé'
  const div = rankDiv(elo)
  return div ? `${rank.name} ${div}` : rank.name
}

export function rankColor(elo) {
  return getRank(elo)?.color ?? '#dddddd'
}

// Segment boundaries for the rank bar in AkhyStats.vue:
// Flop: 50, Bronze: 300, Silver: 600, Gold: 900, Diamond: 1200, Master: 1500
const SEGMENT_STARTS = [50, 300, 600, 900, 1200, 1500]

export function playerPosition(elo) {
  if (!elo || elo === 0) return SEGMENT_STARTS[0]
  if (elo < 1200) return (elo / 1199) * (SEGMENT_STARTS[1] - SEGMENT_STARTS[0]) + SEGMENT_STARTS[0]
  if (elo < 1400) return ((elo - 1200) / 199) * (SEGMENT_STARTS[2] - SEGMENT_STARTS[1]) + SEGMENT_STARTS[1]
  if (elo < 1600) return ((elo - 1400) / 199) * (SEGMENT_STARTS[3] - SEGMENT_STARTS[2]) + SEGMENT_STARTS[2]
  if (elo < 1850) return ((elo - 1600) / 249) * (SEGMENT_STARTS[4] - SEGMENT_STARTS[3]) + SEGMENT_STARTS[3]
  if (elo < 2100) return ((elo - 1850) / 249) * (SEGMENT_STARTS[5] - SEGMENT_STARTS[4]) + SEGMENT_STARTS[4]
  return SEGMENT_STARTS[5]
}

export { SEGMENT_STARTS }

export const RANK_MARKERS = RANKS.flatMap((rank) =>
  rank.divs.map((elo, i) => ({ elo, div: DIV_LABELS[i + 1] })),
)

export const RANK_LABELS = [
  { elo: 0, name: 'Unranked', icon: '', color: '#dddddd' },
  ...RANKS.map((r) => ({ elo: r.min, name: r.name, icon: r.icon, color: r.color })),
]

export { RANKS }
