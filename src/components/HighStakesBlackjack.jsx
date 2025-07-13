import { useState, useEffect } from 'react'

const HighStakesBlackjack = ({ currentUser, onNavigateHome, onBalanceUpdate }) => {
  // カードデッキの作成
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    const deck = []
    
    for (let suit of suits) {
      for (let rank of ranks) {
        deck.push({ suit, rank, value: getCardValue(rank) })
      }
    }
    
    return shuffleDeck(deck)
  }

  const getCardValue = (rank) => {
    if (rank === 'A') return 11
    if (['J', 'Q', 'K'].includes(rank)) return 10
    return parseInt(rank)
  }

  const shuffleDeck = (deck) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // ゲーム状態
  const [deck, setDeck] = useState([])
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [playerScore, setPlayerScore] = useState(0)
  const [dealerScore, setDealerScore] = useState(0)
  const [gameStatus, setGameStatus] = useState('betting') // betting, playing, dealer, finished
  const [betAmount, setBetAmount] = useState(5000) // ハイステークスなので最低ベット額は5000
  const [message, setMessage] = useState('')
  const [gameHistory, setGameHistory] = useState([])

  // スコア計算（エースの処理を含む）
  const calculateScore = (hand) => {
    let score = 0
    let aces = 0

    // エース以外のカードをまず計算
    for (let card of hand) {
      if (card.rank === 'A') {
        aces++
      } else {
        score += card.value
      }
    }

    // エースを1つずつ処理
    for (let i = 0; i < aces; i++) {
      if (score + 11 <= 21) {
        score += 11
      } else {
        score += 1
      }
    }

    return score
  }

  // ゲーム開始
  const startGame = () => {
    if (betAmount > currentUser.balance) {
      setMessage('残高が不足しています')
      return
    }

    const newDeck = createDeck()
    const newPlayerHand = [newDeck.pop(), newDeck.pop()]
    const newDealerHand = [newDeck.pop(), newDeck.pop()]

    setDeck(newDeck)
    setPlayerHand(newPlayerHand)
    setDealerHand(newDealerHand)
    setPlayerScore(calculateScore(newPlayerHand))
    setDealerScore(calculateScore([newDealerHand[0]]))
    setGameStatus('playing')
    setMessage('')

    // 残高からベット額を差し引く
    onBalanceUpdate(currentUser.balance - betAmount)
  }

  // プレイヤーがヒット
  const hit = () => {
    if (gameStatus !== 'playing') return

    const newCard = deck.pop()
    const newPlayerHand = [...playerHand, newCard]
    const newScore = calculateScore(newPlayerHand)

    setPlayerHand(newPlayerHand)
    setPlayerScore(newScore)
    setDeck([...deck])

    if (newScore > 21) {
      setGameStatus('finished')
      setMessage('バースト！ディーラーの勝ちです')
      addToHistory('lose', 0)
    }
  }

  // プレイヤーがスタンド
  const stand = () => {
    if (gameStatus !== 'playing') return

    setGameStatus('dealer')
    dealerPlay()
  }

  // ディーラーのプレイ
  const dealerPlay = () => {
    let currentDealerHand = [...dealerHand]
    let currentDeck = [...deck]
    let dealerScore = calculateScore(currentDealerHand)

    // ディーラーは17以上になるまでヒット
    while (dealerScore < 17) {
      const newCard = currentDeck.pop()
      currentDealerHand.push(newCard)
      dealerScore = calculateScore(currentDealerHand)
    }

    setDealerHand(currentDealerHand)
    setDealerScore(dealerScore)
    setDeck(currentDeck)

    // 勝敗判定
    setTimeout(() => {
      determineWinner(playerScore, dealerScore)
    }, 1000)
  }

  // 勝敗判定
  const determineWinner = (playerScore, dealerScore) => {
    let winnings = 0
    let result = ''

    if (dealerScore > 21) {
      // ディーラーバースト
      winnings = betAmount * 2
      setMessage(`ディーラーバースト！あなたの勝ちです！ ${winnings}コインを獲得！`)
      result = 'win'
    } else if (playerScore > dealerScore) {
      // プレイヤーの勝ち
      winnings = betAmount * 2
      setMessage(`あなたの勝ちです！ ${winnings}コインを獲得！`)
      result = 'win'
    } else if (playerScore < dealerScore) {
      // ディーラーの勝ち
      setMessage('ディーラーの勝ちです')
      result = 'lose'
    } else {
      // 引き分け
      winnings = betAmount
      setMessage('引き分けです')
      result = 'tie'
    }

    if (winnings > 0) {
      onBalanceUpdate(currentUser.balance + winnings)
    }

    setGameStatus('finished')
    addToHistory(result, winnings)
  }

  // ゲーム履歴に追加
  const addToHistory = (result, winAmount) => {
    const historyEntry = {
      id: Date.now(),
      betAmount,
      result,
      winAmount,
      playerScore,
      dealerScore,
      timestamp: new Date().toLocaleTimeString()
    }
    setGameHistory([historyEntry, ...gameHistory.slice(0, 9)])
  }

  // 新しいゲーム
  const newGame = () => {
    setPlayerHand([])
    setDealerHand([])
    setPlayerScore(0)
    setDealerScore(0)
    setGameStatus('betting')
    setMessage('')
  }

  // カードをレンダリング
  const renderCard = (card, hidden = false) => {
    if (hidden) {
      return (
        <div className="inline-block w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-16 md:h-24 bg-blue-600 border border-white rounded-md flex items-center justify-center text-white font-bold text-xs sm:text-base">
          🂠
        </div>
      )
    }

    const color = ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'
    return (
      <div className="inline-block w-8 h-12 xs:w-10 xs:h-14 sm:w-12 sm:h-16 md:w-16 md:h-24 bg-white border border-gray-300 rounded-md flex flex-col items-center justify-center">
        <div className={`text-xs xs:text-sm sm:text-base md:text-lg font-bold ${color}`}>{card.rank}</div>
        <div className={`text-sm xs:text-base sm:text-lg md:text-xl ${color}`}>{card.suit}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-black p-1 xs:p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col xs:flex-row justify-between items-center mb-2 xs:mb-3 sm:mb-4 md:mb-6 gap-1 xs:gap-2">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base order-1 xs:order-none"
          >
            ← ホーム
          </button>
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-1 sm:gap-2 order-2 xs:order-none text-center">
            <span className="hidden md:inline">♠</span> ハイステークスBJ <span className="hidden md:inline">♠</span>
          </h1>
          <div className="text-white text-center xs:text-right order-3 xs:order-none">
            <div className="text-xs xs:text-sm sm:text-lg font-bold">👤 {currentUser?.username}</div>
            <div className="text-yellow-300 font-bold text-xs xs:text-sm sm:text-base">💰 {currentUser?.balance?.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ゲーム説明 */}
        <div className="bg-red-800/30 p-2 xs:p-3 sm:p-4 rounded-lg mb-2 xs:mb-3 sm:mb-4 md:mb-6 text-white text-center">
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold mb-1 xs:mb-2">💎 ハイステークスBJ 💎</h2>
          <p className="text-xs xs:text-sm sm:text-base md:text-lg">最低ベット額: 5000コイン | 通常の2倍の配当！</p>
          <p className="text-xs sm:text-sm md:text-base">21に近づけてディーラーに勝利しよう！</p>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="bg-yellow-600 text-white p-2 xs:p-3 sm:p-4 rounded-lg mb-2 xs:mb-3 sm:mb-4 md:mb-6 text-center font-bold text-xs xs:text-sm sm:text-lg">
            {message}
          </div>
        )}

        {/* ゲームエリア */}
        <div className="bg-green-800 rounded-lg p-2 xs:p-3 sm:p-6 mb-2 xs:mb-3 sm:mb-4 md:mb-6">
          {/* ディーラーのカード */}
          <div className="mb-2 xs:mb-3 sm:mb-4 md:mb-8">
            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white mb-1 xs:mb-2 text-center">
              ディーラー {gameStatus === 'dealer' || gameStatus === 'finished' ? `(${dealerScore})` : ''}
            </h3>
            <div className="flex justify-center flex-wrap gap-0.5 xs:gap-1">
              {dealerHand.map((card, index) => 
                renderCard(card, index === 1 && gameStatus === 'playing')
              )}
            </div>
          </div>

          {/* プレイヤーのカード */}
          <div>
            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white mb-1 xs:mb-2 text-center">
              あなた ({playerScore})
            </h3>
            <div className="flex justify-center flex-wrap gap-0.5 xs:gap-1">
              {playerHand.map((card, index) => 
                renderCard(card)
              )}
            </div>
          </div>
        </div>

        {/* ベットエリア */}
        {gameStatus === 'betting' && (
          <div className="bg-purple-800/50 p-2 xs:p-3 sm:p-6 rounded-lg mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4 text-center">ベット額を選択</h3>
            <div className="grid grid-cols-3 xs:grid-cols-5 sm:flex sm:justify-center gap-1 xs:gap-2 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
              {[5000, 10000, 20000, 40000, 80000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > currentUser.balance}
                  className={`px-1 py-1 xs:px-2 xs:py-2 sm:px-4 sm:py-2 rounded-lg font-bold transition-colors text-xs sm:text-base ${
                    betAmount === amount 
                      ? 'bg-yellow-500 text-black' 
                      : amount > currentUser.balance
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {amount.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={startGame}
                disabled={betAmount > currentUser.balance}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-8 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-lg"
              >
                ゲーム開始 ({betAmount.toLocaleString()}コイン)
              </button>
            </div>
          </div>
        )}

        {/* ゲームアクション */}
        {gameStatus === 'playing' && (
          <div className="text-center mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            <button
              onClick={hit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-lg mr-2 sm:mr-4"
            >
              ヒット
            </button>
            <button
              onClick={stand}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-lg"
            >
              スタンド
            </button>
          </div>
        )}

        {/* 新しいゲーム */}
        {gameStatus === 'finished' && (
          <div className="text-center mb-2 xs:mb-3 sm:mb-4 md:mb-6">
            <button
              onClick={newGame}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 xs:px-4 xs:py-2 sm:px-8 sm:py-3 rounded-lg font-bold text-xs xs:text-sm sm:text-lg"
            >
              新しいゲーム
            </button>
          </div>
        )}

        {/* ゲーム履歴 */}
        {gameHistory.length > 0 && (
          <div className="bg-black/30 p-2 xs:p-3 sm:p-4 rounded-lg">
            <h3 className="text-sm xs:text-base sm:text-lg md:text-xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">ゲーム履歴</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-white text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left p-1 sm:p-2">時刻</th>
                    <th className="text-left p-1 sm:p-2">ベット</th>
                    <th className="text-left p-1 sm:p-2">結果</th>
                    <th className="text-left p-1 sm:p-2">獲得</th>
                    <th className="text-left p-1 sm:p-2">スコア</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map(game => (
                    <tr key={game.id} className="border-b border-gray-700">
                      <td className="p-1 sm:p-2">{game.timestamp}</td>
                      <td className="p-1 sm:p-2">{game.betAmount.toLocaleString()}</td>
                      <td className="p-1 sm:p-2">
                        <span className={`font-bold ${
                          game.result === 'win' ? 'text-green-400' : 
                          game.result === 'lose' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {game.result === 'win' ? '勝利' : game.result === 'lose' ? '敗北' : '引分'}
                        </span>
                      </td>
                      <td className="p-1 sm:p-2">{game.winAmount.toLocaleString()}</td>
                      <td className="p-1 sm:p-2">{game.playerScore} vs {game.dealerScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HighStakesBlackjack
