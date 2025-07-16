import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import HomePage from './components/HomePage.jsx'
import UserRegistration from './components/UserRegistration.jsx'
import ShopPage from './components/ShopPage.jsx'
import BlackjackGame from './components/BlackjackGame.jsx'
import PokerGame from './components/PokerGame.jsx'
import SlotGame from './components/SlotGame.jsx'
import HighOddsSlotGame from './components/HighOddsSlotGame.jsx'
import RouletteGame from './components/RouletteGame.jsx'
import BaccaratGame from './components/BaccaratGame.jsx'
import HighStakesBlackjack from './components/HighStakesBlackjack.jsx'
import BridgeGame from './components/BridgeGame.jsx'
import TexasPokerGame from './components/TexasPokerGame.jsx'
import VipPage from './components/VipPage.jsx'
import VipMegaBucksSlot from './components/VipMegaBucksSlot.jsx'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const { user, loading: authLoading, initialized, signOut } = useAuth()
  const { profile, loading: profileLoading, updateBalance, updateUsername, recordGameHistory } = useProfile(user?.id)

  // デバッグ用ログ
  useEffect(() => {
    console.log('=== App State Debug ===')
    console.log('Current user:', user)
    console.log('User ID:', user?.id)
    console.log('Auth loading:', authLoading)
    console.log('Auth initialized:', initialized)
    console.log('Profile:', profile)
    console.log('Profile loading:', profileLoading)
    console.log('Current page:', currentPage)
    console.log('=====================')
  }, [user, authLoading, initialized, profile, profileLoading, currentPage])

  const handleNavigation = (page) => {
    setCurrentPage(page)
  }

  const handleLogin = (user) => {
    setCurrentPage('home')
  }

  const handleLogout = async () => {
    await signOut()
    setCurrentPage('home')
  }

  const handleUpdateBalance = async (newBalance) => {
    if (user && profile && updateBalance) {
      try {
        await updateBalance(newBalance)
      } catch (error) {
        console.error('App.jsx - 残高更新エラー:', error)
        // エラーが発生してもアプリケーションは継続
      }
    }
  }

  const handleRecordGame = async (gameParams) => {
    console.log('=== App.jsx handleRecordGame 開始 ===')
    console.log('受信パラメータ:', gameParams)
    console.log('ユーザー状態:', { user: !!user, profile: !!profile, recordGameHistory: !!recordGameHistory })
    
    if (user && profile && recordGameHistory) {
      try {
        let gameType, betAmount, winAmount, result
        
        // 新しいオブジェクト形式（スロットゲームから）
        if (gameParams && typeof gameParams === 'object' && gameParams.gameType) {
          gameType = gameParams.gameType
          betAmount = gameParams.betAmount
          winAmount = gameParams.winAmount
          result = gameParams.result
        }
        // 従来のゲーム結果オブジェクト形式（他のゲームから）
        else if (gameParams && typeof gameParams === 'object' && gameParams.type) {
          gameType = gameParams.type || 'Unknown'
          betAmount = gameParams.bet || 0
          winAmount = gameParams.win || 0
          result = gameParams.profit >= 0 ? 'win' : 'loss'
        }
        // フォールバック
        else {
          console.error('❌ 未対応のゲームパラメータ形式:', gameParams)
          return
        }
        
        console.log('正規化されたパラメータ:', { gameType, betAmount, winAmount, result })
        
        await recordGameHistory(gameType, betAmount, winAmount, result)
        console.log('✅ App.jsx: ゲーム履歴記録成功')
      } catch (error) {
        console.error('❌ App.jsx - ゲーム履歴記録エラー:', error)
        // エラーが発生してもアプリケーションは継続
      }
    } else {
      console.log('⚠️ handleRecordGame スキップ:', { user: !!user, profile: !!profile, recordGameHistory: !!recordGameHistory })
    }
  }

  // 認証とプロフィールのローディング中
  if (!initialized || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl">認証中...</h2>
        </div>
      </div>
    )
  }

  // ユーザーがログイン済みだがプロフィールローディング中
  if (user && profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl">プロフィール読み込み中...</h2>
        </div>
      </div>
    )
  }

  // ページのレンダリング
  const renderPage = () => {
    switch (currentPage) {
      case 'register':
        return (
          <UserRegistration 
            onBack={() => setCurrentPage('home')}
            onLogin={handleLogin}
          />
        )
      case 'shop':
        return (
          <ShopPage
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
          />
        )
      case 'blackjack':
        return (
          <BlackjackGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'poker':
        return (
          <PokerGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'slot':
        return (
          <SlotGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'roulette':
        return (
          <RouletteGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'baccarat':
        return (
          <BaccaratGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'high_odds_slot':
        return (
          <HighOddsSlotGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'high_stakes':
        return (
          <HighStakesBlackjack 
            currentUser={profile}
            user={user}
            onBalanceUpdate={handleUpdateBalance} 
            onNavigateHome={() => setCurrentPage('home')}
            onRecordGame={handleRecordGame}
          />
        )
      case 'bridge':
        return (
          <BridgeGame 
            onNavigateHome={() => setCurrentPage('home')}
          />
        )
      case 'texas_poker':
        return (
          <TexasPokerGame 
            currentUser={profile}
            onBalanceUpdate={handleUpdateBalance} 
            onNavigateHome={() => setCurrentPage('home')}
          />
        )
      case 'vip':
        return (
          <VipPage 
            onNavigation={handleNavigation}
            onNavigateHome={() => setCurrentPage('home')}
          />
        )
      case 'vip-mega-bucks':
        return (
          <VipMegaBucksSlot 
            currentUser={profile}
            onNavigation={handleNavigation}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={handleRecordGame}
          />
        )
      case 'home':
      default:
        return (
          <HomePage 
            currentUser={profile}
            user={user}
            onNavigation={handleNavigation}
            onLogout={handleLogout}
          />
        )
    }
  }

  return renderPage()
}

export default App

