import { useState, useEffect, useCallback } from 'react'
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
        .select('username, balance, title')
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

  // 掲示板メッセージ取得関数
  const getMessages = useCallback(async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('message_board')
        .select(`
          id,
          content,
          created_at,
          profiles!inner(username, balance, title)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch messages:', error)
        return []
      }

      // データを整形
      const formattedData = data?.map(message => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        username: message.profiles.username,
        balance: message.profiles.balance,
        title: message.profiles.title
      })) || []

      return formattedData
    } catch (error) {
      console.error('Error in getMessages:', error)
      return []
    }
  }, [])

  // 掲示板メッセージ投稿関数
  const postMessage = useCallback(async (content) => {
    try {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('message_board')
        .insert({
          user_id: userId,
          content: content.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to post message:', error)
        throw error
      }

      console.log('Message posted successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Error in postMessage:', error)
      throw error
    }
  }, [userId])

  // 爵位購入関数
  const purchaseTitle = useCallback(async (titleName, price) => {
    try {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      // トランザクション的に処理するため、まず残高チェック
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('balance, title')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      if (currentProfile.balance < price) {
        throw new Error('残高が不足しています')
      }

      // 残高のみを減らす（爵位の更新はトリガーで行う）
      const newBalance = currentProfile.balance - price
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) throw updateError

      // 購入履歴を記録（トリガーが段階的制約をチェックし、profiles.titleを更新）
      const { data: purchaseData, error: historyError } = await supabase
        .from('title_purchases')
        .insert({
          user_id: userId,
          title: titleName,
          price: price
        })
        .select()

      if (historyError) {
        console.error('Failed to record purchase history:', historyError)
        // 購入履歴の記録が失敗した場合、残高をロールバック
        const { error: rollbackError } = await supabase
          .from('profiles')
          .update({ balance: currentProfile.balance }) // 元の残高に戻す
          .eq('id', userId)
        
        if (rollbackError) {
          console.error('Failed to rollback balance update:', rollbackError)
        }
        
        // より詳細なエラーメッセージを提供
        const errorMessage = historyError.message || '不明なエラー'
        if (errorMessage.includes('段階的に購入')) {
          throw new Error('爵位は段階的に購入する必要があります。現在の爵位の次の段階のみ購入可能です。')
        } else if (errorMessage.includes('男爵から購入')) {
          throw new Error('最初の爵位は男爵から購入してください。')
        } else {
          throw new Error(`爵位の購入に失敗しました: ${errorMessage}`)
        }
      }

      // 購入成功後、最新のプロフィール（爵位含む）を取得
      const { data: finalProfile, error: finalFetchError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userId)
        .single()

      if (finalFetchError) {
        console.error('Failed to fetch updated profile:', finalFetchError)
        // とりあえず手動で更新
        const manualProfile = { ...updatedProfile, title: titleName }
        setProfile(manualProfile)
        console.log('Title purchased successfully (manual update):', manualProfile)
        return { data: manualProfile, error: null }
      }

      console.log('Purchase history recorded successfully:', purchaseData)
      setProfile(finalProfile)
      console.log('Title purchased successfully:', finalProfile)
      return { data: finalProfile, error: null }

      setProfile(updatedProfile)
      console.log('Title purchased successfully:', updatedProfile)
      return { data: updatedProfile, error: null }
    } catch (error) {
      console.error('Error in purchaseTitle:', error)
      return { data: null, error }
    }
  }, [userId])

  // VIP専用掲示板メッセージ取得関数
  const getVipMessages = useCallback(async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('vip_message_board')
        .select(`
          id,
          content,
          created_at,
          profiles!inner(username, balance, title)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Failed to fetch VIP messages:', error)
        return []
      }

      // データを整形
      const formattedData = data?.map(message => ({
        id: message.id,
        content: message.content,
        created_at: message.created_at,
        username: message.profiles.username,
        balance: message.profiles.balance,
        title: message.profiles.title
      })) || []

      return formattedData
    } catch (error) {
      console.error('Error in getVipMessages:', error)
      return []
    }
  }, [])

  // VIP専用掲示板メッセージ投稿関数
  const postVipMessage = useCallback(async (content) => {
    try {
      if (!userId) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('vip_message_board')
        .insert({
          user_id: userId,
          content: content.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to post VIP message:', error)
        throw error
      }

      console.log('VIP message posted successfully:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Error in postVipMessage:', error)
      throw error
    }
  }, [userId])

  return {
    profile,
    loading,
    updateBalance,
    updateUsername,
    recordGameHistory,
    getTopUsers,
    getMessages,
    postMessage,
    purchaseTitle,
    getVipMessages,
    postVipMessage
  }
}
