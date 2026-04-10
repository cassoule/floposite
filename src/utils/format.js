/**
 * Shared formatting helpers used across views.
 *
 * Canonical implementations extracted from duplicated per-view methods
 * (Dashboard / PokerHome / PokerRoom / Blackjack all had their own copy).
 */

/**
 * Format a large coin/FlopoCoins amount with SI-ish suffixes.
 * Uses non-breaking thousands separator (space).
 *
 *   1 234        -> "1 234"
 *   12 345       -> "12.35K"
 *   1 000 000    -> "1.00M"
 *   1 000 000 000-> "1.00Md"
 */
export function formatAmount(amount) {
  if (amount === null || amount === undefined) return '0'
  const num = Number(amount)
  if (Number.isNaN(num)) return '0'

  let value = num
  if (value >= 1000000000) {
    value /= 1000000000
    return (
      value
        .toFixed(2)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'Md'
    )
  }
  if (value >= 1000000) {
    value /= 1000000
    return (
      value
        .toFixed(2)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'M'
    )
  }
  if (value >= 10000) {
    value /= 1000
    return (
      value
        .toFixed(2)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + 'K'
    )
  }
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Format a raw number with thousand separators, no suffix.
 *   1234567 -> "1 234 567"
 */
export function formatCoins(n) {
  if (n === null || n === undefined) return '0'
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/**
 * Format a millisecond duration as HH:MM:SS or MM:SS when less than an hour.
 * Used by the game timers (Sudoku, etc.).
 */
export function formatTimer(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hh = Math.floor(total / 3600)
  const mm = Math.floor((total % 3600) / 60)
  const ss = total % 60
  const pad = (v) => String(v).padStart(2, '0')
  if (hh > 0) return `${pad(hh)}:${pad(mm)}:${pad(ss)}`
  return `${pad(mm)}:${pad(ss)}`
}

/**
 * Pretty-print a countdown to an epoch-ms target, relative to a reference "now".
 * Returns "MM:SS" under one hour, otherwise "HH:MM".
 * Used by the Market view's offer countdowns.
 */
export function prettyTimeLeft(targetTimestamp, now = Date.now()) {
  const left = Math.max(0, targetTimestamp - now)
  const s = Math.ceil(left / 1000)
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s / 60) % 60)).padStart(2, '0')
  const ss = String(Math.floor(s % 60)).padStart(2, '0')
  if (hh === '00') return `${mm}:${ss}`
  return `${hh}:${mm}`
}
