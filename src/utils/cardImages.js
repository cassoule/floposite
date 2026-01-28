const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K']
const suits = ['h', 'd', 'c', 's']

export const getCardImagePath = (rank, suit) => {
  if (rank && suit) {
    return `/cards/webp/${rank}${suit}.webp`
  }
  return `/cards/webp/card_backk.webp`
}

export const getAllCardImagePaths = () => {
  const paths = []
  paths.push(getCardImagePath(null, null))
  for (const rank of ranks) {
    for (const suit of suits) {
      paths.push(getCardImagePath(suit, rank))
    }
  }
  return paths
}
