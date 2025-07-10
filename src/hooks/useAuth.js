import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    console.log('useAuth: Initializing authentication...')
    
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        console.log('useAuth: Getting current session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('useAuth: Session error:', error)
        } else {
          console.log('useAuth: Current session:', session?.user?.id || 'No session')
        }
        
        setUser(session?.user ?? null)
        setLoading(false)
        setInitialized(true)
      } catch (error) {
        console.error('useAuth: Error getting session:', error)
        setUser(null)
        setLoading(false)
        setInitialized(true)
      }
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.id || 'No user')
        setUser(session?.user ?? null)
        setLoading(false)
        setInitialized(true)
      }
    )

    return () => {
      console.log('useAuth: Cleaning up subscription')
      subscription.unsubscribe()
    }
  }, [])

  // ユーザー登録
  const signUp = async (email, password, username) => {
    try {
      console.log('useAuth: Starting signup process...', { email, username })
      
      // 認証ユーザーを作成（プロフィールは useProfile で自動作成）
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      })

      if (authError) {
        console.error('useAuth: Auth error:', authError)
        throw authError
      }

      console.log('useAuth: Auth user created successfully:', authData.user?.id)
      return { data: authData, error: null }
    } catch (error) {
      console.error('useAuth: SignUp error:', error)
      return { data: null, error }
    }
  }

  // ログイン
  const signIn = async (email, password) => {
    try {
      console.log('Starting signin process...', { email })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('SignIn error:', error)
        throw error
      }
      
      console.log('SignIn successful:', data.user?.id)
      return { data, error: null }
    } catch (error) {
      console.error('SignIn error:', error)
      return { data: null, error }
    }
  }

  // ログアウト
  const signOut = async () => {
    try {
      console.log('useAuth: Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('useAuth: Sign out successful')
    } catch (error) {
      console.error('useAuth: ログアウトエラー:', error)
    }
  }

  return {
    user,
    loading,
    initialized,
    signUp,
    signIn,
    signOut
  }
}
