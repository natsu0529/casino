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
    if (user && profile) {
      await updateBalance(newBalance)
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
            onRecordGame={recordGameHistory}
          />
        )
      case 'poker':
        return (
          <PokerGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={recordGameHistory}
          />
        )
      case 'slot':
        return (
          <SlotGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={recordGameHistory}
          />
        )
      case 'roulette':
        return (
          <RouletteGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={recordGameHistory}
          />
        )
      case 'baccarat':
        return (
          <BaccaratGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={recordGameHistory}
          />
        )
      case 'high_odds_slot':
        return (
          <HighOddsSlotGame
            currentUser={profile}
            user={user}
            onNavigateHome={() => setCurrentPage('home')}
            onUpdateBalance={handleUpdateBalance}
            onRecordGame={recordGameHistory}
          />
        )
      case 'high_stakes':
        return (
          <HighStakesBlackjack 
            currentUser={profile}
            user={user}
            onBalanceUpdate={handleUpdateBalance} 
            onNavigateHome={() => setCurrentPage('home')}
            onRecordGame={recordGameHistory}
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
            onRecordGame={recordGameHistory}
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

