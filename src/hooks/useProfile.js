import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useProfile = (userId) => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('useProfile: User ID changed:', userId)
    
    if (!userId) {
      console.log('useProfile: No user ID, clearing profile')
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        console.log('useProfile: Fetching profile for user:', userId)
        setLoading(true)
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('useProfile: Profile fetch error:', error)
          
          // プロフィールが存在しない場合は作成を試みる
          if (error.code === 'PGRST116') {
            console.log('useProfile: Profile not found, creating new profile...')
            
            // 認証ユーザーの情報から username を取得
            const { data: { user } } = await supabase.auth.getUser()
            
            // Google認証の場合はfull_nameまたはemailから、通常認証の場合はuser_metadataから取得
            let username
            if (user?.app_metadata?.provider === 'google') {
              // Google認証の場合
              username = user?.user_metadata?.full_name || 
                        user?.user_metadata?.name || 
                        user?.email?.split('@')[0] || 
                        `user_${userId.slice(0, 8)}`
            } else {
              // 通常のメール認証の場合
              username = user?.user_metadata?.username || `user_${userId.slice(0, 8)}`
            }
            
            console.log('useProfile: Creating profile with username:', username, 'provider:', user?.app_metadata?.provider)
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: userId,
                  username: username,
                  balance: 1000
                }
              ])
              .select()
              .single()

            if (createError) {
              console.error('useProfile: Profile creation error:', createError)
              throw createError
            } else {
              console.log('useProfile: Profile created successfully:', newProfile)
              setProfile(newProfile)
            }
          } else {
            throw error
          }
        } else {
          console.log('useProfile: Profile fetched successfully:', data)
          setProfile(data)
        }
      } catch (error) {
        console.error('useProfile: プロフィール取得エラー:', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  // 残高を更新
  const updateBalance = async (newBalance) => {
    if (!userId) return { data: null, error: 'ユーザーIDが必要です' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      return { data, error: null }
    } catch (error) {
      console.error('残高更新エラー:', error)
      return { data: null, error }
    }
  }

  // ゲーム履歴を記録
  const recordGameHistory = async (gameType, betAmount, winAmount, result) => {
    if (!userId) return { data: null, error: 'ユーザーIDが必要です' }

    try {
      const { data, error } = await supabase
        .from('game_history')
        .insert([
          {
            user_id: userId,
            game_type: gameType,
            bet_amount: betAmount,
            win_amount: winAmount,
            result: result,
            played_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('ゲーム履歴記録エラー:', error)
      return { data: null, error }
    }
  }

  // ゲーム履歴を取得
  const getGameHistory = async (limit = 10) => {
    if (!userId) return { data: [], error: 'ユーザーIDが必要です' }

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', userId)
        .order('played_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('ゲーム履歴取得エラー:', error)
      return { data: [], error }
    }
  }

  // ユーザー名を更新する関数
  const updateUsername = async (newUsername) => {
    if (!userId) return { data: null, error: 'ユーザーIDが必要です' }

    try {
      console.log('useProfile: Updating username to:', newUsername)
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      
      setProfile(data)
      console.log('useProfile: Username updated successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('useProfile: Username update error:', error)
      return { data: null, error }
    }
  }

  // ランキング取得関数
  const getTopUsers = async (limit = 3) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, balance')
        .order('balance', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch top users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTopUsers:', error)
      return []
    }
  }

  return {
    profile,
    loading,
    updateBalance,
    updateUsername,
    recordGameHistory,
    getTopUsers
  }
}
