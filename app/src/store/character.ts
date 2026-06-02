import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database, CosmeticSlot } from '../lib/database.types'

type Cosmetic = Database['public']['Tables']['cosmetics']['Row']

interface CharacterState {
  equipped: Partial<Record<CosmeticSlot, string | null>>
  inventory: Cosmetic[]
  allCosmetics: Cosmetic[]
  loading: boolean
  fetch: (userId: string) => Promise<void>
  equip: (userId: string, slot: CosmeticSlot, cosmeticId: string | null) => Promise<void>
  grantStarterKit: (userId: string) => Promise<void>
}

function parseInventory(rows: unknown[]): Cosmetic[] {
  return rows
    .map((r: any) => r.cosmetics)
    .filter(Boolean)
    .flatMap((c: unknown) => (Array.isArray(c) ? c : [c])) as Cosmetic[]
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  equipped: {},
  inventory: [],
  allCosmetics: [],
  loading: true,

  fetch: async (userId) => {
    set({ loading: true })

    const [charRes, invRes, allRes] = await Promise.all([
      supabase.from('character').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('inventory').select('cosmetic_id, cosmetics(*)').eq('user_id', userId),
      supabase.from('cosmetics').select('*').order('slot').order('layer_z'),
    ])

    const charRow = charRes.data
    const equipped: Partial<Record<CosmeticSlot, string | null>> = charRow
      ? {
          background: charRow.background,
          body: charRow.body,
          bottom: charRow.bottom,
          top: charRow.top,
          hair: charRow.hair,
          accessory: charRow.accessory,
        }
      : {}

    const inventory = parseInventory(invRes.data ?? [])
    const allCosmetics: Cosmetic[] = allRes.data ?? []

    set({ equipped, inventory, allCosmetics, loading: false })

    // Auto-grant starter kit for users with empty inventory
    if (inventory.length === 0 && allCosmetics.some(c => c.unlock_type === 'starter')) {
      await get().grantStarterKit(userId)
    }
  },

  equip: async (userId, slot, cosmeticId) => {
    const { error } = await supabase
      .from('character')
      .upsert({ user_id: userId, [slot]: cosmeticId }, { onConflict: 'user_id' })

    if (!error) {
      set(s => ({ equipped: { ...s.equipped, [slot]: cosmeticId } }))
    } else {
      console.error('equip error:', error)
    }
  },

  grantStarterKit: async (userId) => {
    const { data: starters } = await supabase
      .from('cosmetics')
      .select('id, slot')
      .eq('unlock_type', 'starter')

    if (!starters?.length) return

    await supabase
      .from('inventory')
      .upsert(
        starters.map(c => ({ user_id: userId, cosmetic_id: c.id })),
        { onConflict: 'user_id,cosmetic_id', ignoreDuplicates: true }
      )

    // Build default equipped: first starter per slot
    const slotDefaults: Partial<Record<CosmeticSlot, string>> = {}
    for (const c of starters) {
      const slot = c.slot as CosmeticSlot
      if (!slotDefaults[slot]) slotDefaults[slot] = c.id
    }

    await supabase
      .from('character')
      .upsert({ user_id: userId, ...slotDefaults }, { onConflict: 'user_id' })

    // Reload without re-triggering grantStarterKit
    const [charRes, invRes] = await Promise.all([
      supabase.from('character').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('inventory').select('cosmetic_id, cosmetics(*)').eq('user_id', userId),
    ])

    const charRow = charRes.data
    const equipped: Partial<Record<CosmeticSlot, string | null>> = charRow
      ? {
          background: charRow.background,
          body: charRow.body,
          bottom: charRow.bottom,
          top: charRow.top,
          hair: charRow.hair,
          accessory: charRow.accessory,
        }
      : {}

    set({
      equipped,
      inventory: parseInventory(invRes.data ?? []),
    })
  },
}))
