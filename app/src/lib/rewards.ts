export const DIFF_REWARDS = {
  easy:   { xp: 8,  gold: 5,  attr: 6,  hp: 4  },
  medium: { xp: 15, gold: 10, attr: 12, hp: 8  },
  hard:   { xp: 26, gold: 18, attr: 22, hp: 14 },
} as const

export function calcReward(difficulty: string, mult = 1) {
  const d = DIFF_REWARDS[difficulty as keyof typeof DIFF_REWARDS] ?? DIFF_REWARDS.medium
  return {
    xp:   Math.round(d.xp   * mult),
    gold: Math.round(d.gold * mult),
    attr: Math.round(d.attr * mult),
    hp:   d.hp,
  }
}
