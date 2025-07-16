import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import UsernameUpdate from './UsernameUpdate'
import MessageBoard from './MessageBoard'
import { UserNameWithTitle } from './TitleDisplay'

const HomePage = ({ currentUser, user, onNavigation, onLogout }) => {
  const [showUsernameUpdate, setShowUsernameUpdate] = useState(false)
  const [topUsers, setTopUsers] = useState([])
  const { getTopUsers } = useProfile(user?.id)

  // ランキングデータを取得
  useEffect(() => {
    if (typeof getTopUsers !== 'function') return;
    const fetchTopUsers = async () => {
      const users = await getTopUsers(3)
      setTopUsers(users)
    }
    
    fetchTopUsers()
  }, [typeof getTopUsers === 'function' ? getTopUsers : () => {}])

  const handleGameClick = (gameId) => {
    if (!currentUser) {
      alert('ゲームをプレイするにはログインが必要です。')
      onNavigation('register')
      return
    }
    
    console.log(`Navigating to ${gameId}`)
    onNavigation(gameId)
  }

  const handleRegisterClick = () => {
    onNavigation('register')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* ユーザー情報バー */}
        {currentUser && (
          <div className="mb-6 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-white">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">👤</span>
                    <UserNameWithTitle 
                      username={currentUser.username} 
                      title={currentUser.title}
                      format="postfix"
                      className="text-lg font-bold"
                    />
                  </div>
                  <div className="mt-1">
                    <span className="text-yellow-300 font-bold">💰 {currentUser.balance.toLocaleString()}コイン</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowUsernameUpdate(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-300"
                >
                  名前変更
                </button>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
              >
                ログアウト
              </button>
            </div>
          </div>
        )}

        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎰 カジノアプリ 🎰
          </h1>
          <p className="text-xl text-gray-300">お好きなゲームをお選びください</p>
          {!currentUser && (
            <p className="text-yellow-300 mt-2">※ ゲームをプレイするにはログインが必要です</p>
          )}
        </div>

        {/* 4x3ゲームグリッド */}
        <div className="grid grid-cols-4 gap-4 h-[450px] mb-8">
          {/* 左上 - ブラックジャック */}
          <div 
            className={`h-full bg-gradient-to-br from-red-600 to-red-800 border border-red-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('blackjack')}
          >
            <div className="text-3xl mb-2">♠</div>
            <h3 className="text-lg font-bold">ブラックジャック</h3>
          </div>

          {/* 中央左上 - スロット */}
          <div 
            className={`h-full bg-gradient-to-br from-yellow-600 to-yellow-800 border border-yellow-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('slot')}
          >
            <div className="text-3xl mb-2">🎰</div>
            <h3 className="text-lg font-bold">スロット</h3>
          </div>

          {/* 高オッズスロット */}
          <div 
            className={`h-full bg-gradient-to-br from-amber-600 to-orange-800 border border-amber-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('high_odds_slot')}
          >
            <div className="text-3xl mb-2">💸</div>
            <h3 className="text-lg font-bold">高オッズスロット</h3>
            <p className="text-xs opacity-80 text-center">高額ベット専用</p>
          </div>

          {/* 中央右上 - ポーカー */}
          <div 
            className={`h-full bg-gradient-to-br from-blue-600 to-blue-800 border border-blue-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('poker')}
          >
            <div className="text-3xl mb-2">🃏</div>
            <h3 className="text-lg font-bold">ポーカー</h3>
          </div>

          {/* 右上 - ルーレット */}
          <div 
            className={`h-full bg-gradient-to-br from-green-600 to-green-800 border border-green-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('roulette')}
          >
            <div className="text-3xl mb-2">🎡</div>
            <h3 className="text-lg font-bold">ルーレット</h3>
          </div>

          {/* 左中央 - バカラ */}
          <div 
            className={`h-full bg-gradient-to-br from-purple-600 to-purple-800 border border-purple-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('baccarat')}
          >
            <div className="text-3xl mb-2">💎</div>
            <h3 className="text-lg font-bold">バカラ</h3>
          </div>

          {/* 中央左中央 - ブリッジ */}
          <div 
            className={`h-full bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('bridge')}
          >
            <div className="text-3xl mb-2">🃏</div>
            <h3 className="text-lg font-bold">ブリッジ</h3>
          </div>

          {/* 中央右中央 - テキサスポーカー */}
          <div 
            className={`h-full bg-gradient-to-br from-teal-600 to-teal-800 border border-teal-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('texas_poker')}
          >
            <div className="text-3xl mb-2">🎲</div>
            <h3 className="text-lg font-bold">テキサスポーカー</h3>
          </div>

          {/* 右中央 - 高オッズBJ */}
          <div 
            className={`h-full bg-gradient-to-br from-orange-600 to-orange-800 border border-orange-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser ? 'opacity-75' : ''}`}
            onClick={() => handleGameClick('high_stakes')}
          >
            <div className="text-3xl mb-2">⭐</div>
            <h3 className="text-lg font-bold">高オッズBJ</h3>
            <p className="text-xs opacity-80 text-center">高リスク高リターン</p>
          </div>

          {/* 左下 - ユーザー登録 */}
          <div 
            className="h-full bg-gradient-to-br from-gray-600 to-gray-800 border border-gray-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white"
            onClick={handleRegisterClick}
          >
            <div className="text-3xl mb-2">👤</div>
            <h3 className="text-lg font-bold">
              {currentUser ? 'アカウント管理' : 'ユーザー登録'}
            </h3>
          </div>

          {/* ショップ */}
          <div 
            className="h-full bg-gradient-to-br from-indigo-600 to-purple-800 border border-indigo-400 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white"
            onClick={() => onNavigation('shop')}
          >
            <div className="text-3xl mb-2">🏛️</div>
            <h3 className="text-lg font-bold">ショップ</h3>
            <p className="text-xs opacity-80 text-center">爵位を購入</p>
          </div>

          {/* VIPページ */}
          <div className={`h-full bg-gradient-to-br from-yellow-400 to-yellow-700 border border-yellow-300 rounded-lg hover:scale-105 transition-transform duration-300 cursor-pointer flex flex-col items-center justify-center text-white ${!currentUser?.title ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={() => handleGameClick('vip')}
          >
            <div className="text-3xl mb-2">👑</div>
            <h3 className="text-lg font-bold">VIPルーム</h3>
            <p className="text-xs opacity-80 text-center">爵位ユーザー限定</p>
          </div>

          {/* 残りの1つは空白 */}
          <div></div>
        </div>

        {/* 資産ランキングと掲示板 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 資産ランキング */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-400 rounded-lg p-6">
            <div className="text-center">
              <div className="text-4xl mb-4 text-yellow-300">🏆</div>
              <h3 className="text-xl font-bold mb-4 text-white">資産ランキング TOP3</h3>
              <div className="space-y-3">
                {topUsers.map((user, index) => (
                  <div key={index} className="bg-black/20 rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="font-bold text-lg text-yellow-300">{index + 1}位</div>
                        <div className="font-medium">
                          <UserNameWithTitle 
                            username={user.username} 
                            title={user.title}
                            format="postfix"
                          />
                        </div>
                      </div>
                      <div className="text-yellow-300 font-bold">{user.balance.toLocaleString()}コイン</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 掲示板 */}
          <MessageBoard currentUser={currentUser} user={user} />
        </div>
      </div>

      {/* ユーザー名変更モーダル */}
      {showUsernameUpdate && (
        <UsernameUpdate onClose={() => setShowUsernameUpdate(false)} />
      )}
    </div>
  )
}

export default HomePage

