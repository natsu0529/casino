import { supabase } from './supabase'

// ジャックポット額を取得
export async function getJackpotAmount(gameType = 'vip_mega_bucks') {
  const { data, error } = await supabase
    .from('jackpot_pool')
    .select('amount')
    .eq('game_type', gameType)
    .single()
  if (error) throw error
  return data?.amount ?? 0
}

// ジャックポット額を増やす（加算）
export async function incrementJackpot(gameType = 'vip_mega_bucks', addAmount = 0) {
  const { data, error } = await supabase.rpc('increment_jackpot', {
    game_type: gameType,
    add_amount: addAmount
  })
  if (error) throw error
  return data
}

// ジャックポットリセット（当選時）
export async function resetJackpot(gameType = 'vip_mega_bucks', resetAmount = 1000000) {
  const { data, error } = await supabase
    .from('jackpot_pool')
    .update({ amount: resetAmount, updated_at: new Date().toISOString() })
    .eq('game_type', gameType)
    .select()
    .single()
  if (error) throw error
  return data
}
