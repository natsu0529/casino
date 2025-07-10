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
  const [betAmount, setBetAmount] = useState(100) // ハイステークスなので最低ベット額は100
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
        <div className="inline-block w-16 h-24 bg-blue-600 border-2 border-white rounded-lg flex items-center justify-center text-white font-bold mx-1">
          🂠
        </div>
      )
    }

    const color = ['♥', '♦'].includes(card.suit) ? 'text-red-500' : 'text-black'
    return (
      <div className="inline-block w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center mx-1">
        <div className={`text-lg font-bold ${color}`}>{card.rank}</div>
        <div className={`text-xl ${color}`}>{card.suit}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-2">
            ♠ ハイステークスブラックジャック ♠
          </h1>
          <div className="text-white text-right">
            <div className="text-lg font-bold">👤 {currentUser?.username}</div>
            <div className="text-yellow-300 font-bold">💰 {currentUser?.balance?.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ゲーム説明 */}
        <div className="bg-red-800/30 p-4 rounded-lg mb-6 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">💎 ハイステークスブラックジャック 💎</h2>
          <p className="text-lg">最低ベット額: 100コイン | 通常の2倍の配当！</p>
          <p>21に近づけてディーラーに勝利しよう！</p>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="bg-yellow-600 text-white p-4 rounded-lg mb-6 text-center font-bold text-lg">
            {message}
          </div>
        )}

        {/* ゲームエリア */}
        <div className="bg-green-800 rounded-lg p-6 mb-6">
          {/* ディーラーのカード */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-2">
              ディーラー {gameStatus === 'dealer' || gameStatus === 'finished' ? `(${dealerScore})` : ''}
            </h3>
            <div className="flex justify-center">
              {dealerHand.map((card, index) => 
                renderCard(card, index === 1 && gameStatus === 'playing')
              )}
            </div>
          </div>

          {/* プレイヤーのカード */}
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              あなた ({playerScore})
            </h3>
            <div className="flex justify-center">
              {playerHand.map((card, index) => 
                renderCard(card)
              )}
            </div>
          </div>
        </div>

        {/* ベットエリア */}
        {gameStatus === 'betting' && (
          <div className="bg-purple-800/50 p-6 rounded-lg mb-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">ベット額を選択</h3>
            <div className="flex justify-center gap-4 mb-4">
              {[100, 250, 500, 1000, 2500].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={amount > currentUser.balance}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    betAmount === amount 
                      ? 'bg-yellow-500 text-black' 
                      : amount > currentUser.balance
                        ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <div className="text-center">
              <button
                onClick={startGame}
                disabled={betAmount > currentUser.balance}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white px-8 py-3 rounded-lg font-bold text-lg"
              >
                ゲーム開始 ({betAmount}コイン)
              </button>
            </div>
          </div>
        )}

        {/* ゲームアクション */}
        {gameStatus === 'playing' && (
          <div className="text-center mb-6">
            <button
              onClick={hit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold text-lg mr-4"
            >
              ヒット
            </button>
            <button
              onClick={stand}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold text-lg"
            >
              スタンド
            </button>
          </div>
        )}

        {/* 新しいゲーム */}
        {gameStatus === 'finished' && (
          <div className="text-center mb-6">
            <button
              onClick={newGame}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg"
            >
              新しいゲーム
            </button>
          </div>
        )}

        {/* ゲーム履歴 */}
        {gameHistory.length > 0 && (
          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-white mb-4">ゲーム履歴</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-white text-sm">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left p-2">時刻</th>
                    <th className="text-left p-2">ベット</th>
                    <th className="text-left p-2">結果</th>
                    <th className="text-left p-2">獲得</th>
                    <th className="text-left p-2">スコア</th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map(game => (
                    <tr key={game.id} className="border-b border-gray-700">
                      <td className="p-2">{game.timestamp}</td>
                      <td className="p-2">{game.betAmount}</td>
                      <td className="p-2">
                        <span className={`font-bold ${
                          game.result === 'win' ? 'text-green-400' : 
                          game.result === 'lose' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {game.result === 'win' ? '勝利' : game.result === 'lose' ? '敗北' : '引分'}
                        </span>
                      </td>
                      <td className="p-2">{game.winAmount}</td>
                      <td className="p-2">{game.playerScore} vs {game.dealerScore}</td>
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
