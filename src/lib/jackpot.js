import { supabase } from './supabase'

// ジャックポット額を取得
export async function getJackpotAmount(gameType = 'vip_mega_bucks') {
  try {
    const { data, error } = await supabase
      .from('jackpot_pool')
      .select('amount')
      .eq('game_type', gameType)
      .single()
    
    if (error) {
      console.error('ジャックポット取得エラー:', error)
      return 10000000 // デフォルト値
    }
    return data?.amount ?? 10000000
  } catch (e) {
    console.error('ジャックポット取得例外:', e)
    return 10000000 // デフォルト値
  }
}

// ジャックポット額を増やす（加算）
export async function incrementJackpot(gameType = 'vip_mega_bucks', addAmount = 0) {
  try {
    // 現在の額を取得
    const currentAmount = await getJackpotAmount(gameType)
    const newAmount = currentAmount + addAmount
    
    console.log(`ジャックポット加算: ${currentAmount} + ${addAmount} = ${newAmount}`)
    
    // 新しい額で更新
    const { data, error } = await supabase
      .from('jackpot_pool')
      .update({ amount: newAmount, updated_at: new Date().toISOString() })
      .eq('game_type', gameType)
      .select()
      .single()
    
    if (error) {
      console.error('ジャックポット更新エラー:', error)
      throw error
    }
    return data
  } catch (e) {
    console.error('ジャックポット加算例外:', e)
    throw e
  }
}

// ジャックポットリセット（当選時）
export async function resetJackpot(gameType = 'vip_mega_bucks', resetAmount = 10000000) {
  try {
    console.log(`ジャックポットリセット: ${resetAmount}`)
    
    const { data, error } = await supabase
      .from('jackpot_pool')
      .update({ amount: resetAmount, updated_at: new Date().toISOString() })
      .eq('game_type', gameType)
      .select()
      .single()
    
    if (error) {
      console.error('ジャックポットリセットエラー:', error)
      throw error
    }
    return data
  } catch (e) {
    console.error('ジャックポットリセット例外:', e)
    throw e
  }
}
