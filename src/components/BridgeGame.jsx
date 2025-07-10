import { useState, useEffect } from 'react'

const BridgeGame = ({ currentUser, onBalanceUpdate, onNavigateHome }) => {
  const [gameState, setGameState] = useState('betting') // betting, playing, finished
  const [bet, setBet] = useState(10)
  const [deck, setDeck] = useState([])
  const [hands, setHands] = useState({ north: [], south: [], east: [], west: [] })
  const [currentBid, setCurrentBid] = useState(null)
  const [biddingHistory, setBiddingHistory] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState('south') // south, west, north, east
  const [contract, setContract] = useState(null)
  const [declarer, setDeclarer] = useState(null)
  const [currentTrick, setCurrentTrick] = useState([])
  const [tricksWon, setTricksWon] = useState({ ns: 0, ew: 0 })
  const [gameHistory, setGameHistory] = useState([])
  const [message, setMessage] = useState('')
  const [selectedCard, setSelectedCard] = useState(null)
  const [trump, setTrump] = useState(null)
  const [biddingPhase, setBiddingPhase] = useState(true)
  const [playPhase, setPlayPhase] = useState(false)

  // カードデッキの作成
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣']
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
    const newDeck = []
    
    suits.forEach(suit => {
      ranks.forEach(rank => {
        newDeck.push({ suit, rank, value: ranks.indexOf(rank) + 2 })
      })
    })
    
    return shuffleDeck(newDeck)
  }

  // デッキをシャッフル
  const shuffleDeck = (deck) => {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // カードを配布
  const dealCards = () => {
    const newDeck = createDeck()
    const newHands = { north: [], south: [], east: [], west: [] }
    const players = ['north', 'south', 'east', 'west']
    
    // 各プレイヤーに13枚ずつ配布
    for (let i = 0; i < 52; i++) {
      const player = players[i % 4]
      newHands[player].push(newDeck[i])
    }
    
    // 手札をソート
    Object.keys(newHands).forEach(player => {
      newHands[player].sort((a, b) => {
        if (a.suit !== b.suit) {
          return ['♠', '♥', '♦', '♣'].indexOf(a.suit) - ['♠', '♥', '♦', '♣'].indexOf(b.suit)
        }
        return b.value - a.value
      })
    })
    
    setHands(newHands)
    setDeck(newDeck)
  }

  // ビッドの評価（簡単なAI）
  const evaluateHand = (hand) => {
    let points = 0
    const suitCounts = { '♠': 0, '♥': 0, '♦': 0, '♣': 0 }
    
    hand.forEach(card => {
      suitCounts[card.suit]++
      if (card.rank === 'A') points += 4
      else if (card.rank === 'K') points += 3
      else if (card.rank === 'Q') points += 2
      else if (card.rank === 'J') points += 1
    })
    
    // 配点ボーナス
    Object.values(suitCounts).forEach(count => {
      if (count >= 5) points += (count - 4) // 5枚以上のスーツにボーナス
      if (count === 0) points += 3 // ボイド
      else if (count === 1) points += 2 // シングルトン
      else if (count === 2) points += 1 // ダブルトン
    })
    
    return { points, suitCounts }
  }

  // AIのビッド決定
  const getAIBid = (player, hand) => {
    const evaluation = evaluateHand(hand)
    const { points, suitCounts } = evaluation
    
    // 簡単なビッドロジック
    if (points < 12) return 'Pass'
    
    // 最も長いスーツを見つける
    let bestSuit = null
    let maxCount = 0
    Object.entries(suitCounts).forEach(([suit, count]) => {
      if (count > maxCount) {
        maxCount = count
        bestSuit = suit
      }
    })
    
    if (points >= 12 && points < 16) {
      if (maxCount >= 5) return `1${bestSuit}`
      return '1NT'
    } else if (points >= 16 && points < 20) {
      if (maxCount >= 5) return `2${bestSuit}`
      return '2NT'
    } else if (points >= 20) {
      if (maxCount >= 6) return `3${bestSuit}`
      return '3NT'
    }
    
    return 'Pass'
  }

  // ビッド処理
  const handleBid = (bid) => {
    const newHistory = [...biddingHistory, { player: currentPlayer, bid }]
    setBiddingHistory(newHistory)
    
    if (bid !== 'Pass') {
      setCurrentBid({ player: currentPlayer, bid })
    }
    
    // 次のプレイヤーに移行
    const playerOrder = ['south', 'west', 'north', 'east']
    const currentIndex = playerOrder.indexOf(currentPlayer)
    const nextPlayer = playerOrder[(currentIndex + 1) % 4]
    setCurrentPlayer(nextPlayer)
    
    // ビッド終了判定（3回連続パス）
    const lastThreeBids = newHistory.slice(-3)
    if (lastThreeBids.length === 3 && lastThreeBids.every(b => b.bid === 'Pass')) {
      if (currentBid) {
        setContract(currentBid)
        setDeclarer(currentBid.player)
        setTrump(currentBid.bid.slice(-1) === 'T' ? 'NT' : currentBid.bid.slice(-1))
        setBiddingPhase(false)
        setPlayPhase(true)
        setCurrentPlayer('west') // 左隣から開始
        setMessage(`コントラクト: ${currentBid.bid} by ${currentBid.player}`)
      } else {
        setMessage('全員パス。新しいゲームを開始してください。')
        setGameState('finished')
      }
    }
  }

  // AIの自動ビッド
  useEffect(() => {
    if (biddingPhase && currentPlayer !== 'south' && gameState === 'betting') {
      const timer = setTimeout(() => {
        const aiHand = hands[currentPlayer]
        if (aiHand && aiHand.length > 0) {
          const aiBid = getAIBid(currentPlayer, aiHand)
          handleBid(aiBid)
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, biddingPhase, hands, gameState])

  // カードプレイ処理
  const playCard = (card) => {
    if (currentPlayer !== 'south') return
    
    const newHand = hands.south.filter(c => c !== card)
    setHands(prev => ({ ...prev, south: newHand }))
    
    const newTrick = [...currentTrick, { player: 'south', card }]
    setCurrentTrick(newTrick)
    
    // 次のプレイヤーに移行
    const playerOrder = ['south', 'west', 'north', 'east']
    const currentIndex = playerOrder.indexOf(currentPlayer)
    const nextPlayer = playerOrder[(currentIndex + 1) % 4]
    setCurrentPlayer(nextPlayer)
    
    // トリック完了判定
    if (newTrick.length === 4) {
      // トリック勝者を決定（簡単な実装）
      const winner = newTrick[0].player // 簡略化
      const isNS = winner === 'north' || winner === 'south'
      
      setTricksWon(prev => ({
        ns: prev.ns + (isNS ? 1 : 0),
        ew: prev.ew + (isNS ? 0 : 1)
      }))
      
      setCurrentTrick([])
      setCurrentPlayer(winner)
      
      // ゲーム終了判定
      if (newHand.length === 0) {
        finishGame()
      }
    }
  }

  // AIの自動プレイ
  useEffect(() => {
    if (playPhase && currentPlayer !== 'south' && currentTrick.length < 4) {
      const timer = setTimeout(() => {
        const aiHand = hands[currentPlayer]
        if (aiHand && aiHand.length > 0) {
          const randomCard = aiHand[Math.floor(Math.random() * aiHand.length)]
          
          const newHand = aiHand.filter(c => c !== randomCard)
          setHands(prev => ({ ...prev, [currentPlayer]: newHand }))
          
          const newTrick = [...currentTrick, { player: currentPlayer, card: randomCard }]
          setCurrentTrick(newTrick)
          
          // 次のプレイヤーに移行
          const playerOrder = ['south', 'west', 'north', 'east']
          const currentIndex = playerOrder.indexOf(currentPlayer)
          const nextPlayer = playerOrder[(currentIndex + 1) % 4]
          setCurrentPlayer(nextPlayer)
          
          // トリック完了判定
          if (newTrick.length === 4) {
            setTimeout(() => {
              const winner = newTrick[0].player // 簡略化
              const isNS = winner === 'north' || winner === 'south'
              
              setTricksWon(prev => ({
                ns: prev.ns + (isNS ? 1 : 0),
                ew: prev.ew + (isNS ? 0 : 1)
              }))
              
              setCurrentTrick([])
              setCurrentPlayer(winner)
              
              // ゲーム終了判定
              if (newHand.length === 0) {
                finishGame()
              }
            }, 1000)
          }
        }
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [currentPlayer, playPhase, currentTrick, hands])

  // ゲーム終了処理
  const finishGame = () => {
    const contractLevel = parseInt(contract.bid[0])
    const neededTricks = 6 + contractLevel
    const actualTricks = tricksWon.ns
    
    let result = ''
    let winnings = 0
    
    if (actualTricks >= neededTricks) {
      result = 'コントラクト成功！'
      winnings = bet * 2
    } else {
      result = 'コントラクト失敗'
      winnings = 0
    }
    
    setMessage(result)
    setGameState('finished')
    
    const newBalance = currentUser.balance - bet + winnings
    onBalanceUpdate(newBalance)
    
    const gameResult = {
      contract: contract.bid,
      tricksWon: actualTricks,
      neededTricks,
      result,
      winnings: winnings - bet
    }
    
    setGameHistory(prev => [gameResult, ...prev.slice(0, 4)])
  }

  // ゲーム開始
  const startGame = () => {
    if (currentUser.balance < bet) {
      alert('残高が不足しています')
      return
    }
    
    dealCards()
    setGameState('betting')
    setBiddingHistory([])
    setCurrentBid(null)
    setCurrentPlayer('south')
    setContract(null)
    setDeclarer(null)
    setCurrentTrick([])
    setTricksWon({ ns: 0, ew: 0 })
    setMessage('ビッドを開始してください')
    setBiddingPhase(true)
    setPlayPhase(false)
  }

  // 新しいゲーム
  const newGame = () => {
    setGameState('betting')
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white">
      {/* ヘッダー */}
      <div className="bg-black/30 p-4 flex justify-between items-center">
        <button 
          onClick={() => onNavigateHome()}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
        >
          ← ホームに戻る
        </button>
        <h1 className="text-2xl font-bold">🃏 コントラクトブリッジ 🃏</h1>
        <div className="text-right">
          <div className="text-lg">👤 {currentUser?.username}</div>
          <div className="text-xl font-bold">💰 {currentUser?.balance?.toLocaleString()}コイン</div>
        </div>
      </div>

      {/* ゲーム説明バナー */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-center">
        <h2 className="text-xl font-bold mb-2">🎯 コントラクトブリッジ 🎯</h2>
        <p className="text-sm">
          4人制トリックテイキングゲーム | ビッド → プレイ → 結果 | コントラクト成功で2倍配当
        </p>
      </div>

      <div className="container mx-auto p-6">
        {gameState === 'betting' && (
          <div className="space-y-6">
            {/* 賭け金設定 */}
            <div className="bg-purple-800/50 rounded-lg p-6 text-center">
              <h3 className="text-xl font-bold mb-4">賭け金を選択してください</h3>
              <div className="flex justify-center gap-4 mb-4">
                {[5, 10, 25, 50, 100].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBet(amount)}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      bet === amount 
                        ? 'bg-yellow-500 text-black ring-4 ring-yellow-300' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {amount}コイン
                  </button>
                ))}
              </div>
              <p className="text-lg mb-4">選択した賭け金: {bet}コイン</p>
              <button
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold text-xl transition-colors"
              >
                ゲーム開始
              </button>
            </div>

            {/* ビッドフェーズ */}
            {biddingPhase && hands.south.length > 0 && (
              <div className="space-y-4">
                <div className="bg-blue-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-2">ビッドフェーズ</h3>
                  <p className="mb-2">現在のプレイヤー: {currentPlayer}</p>
                  {message && <p className="text-yellow-300">{message}</p>}
                </div>

                {/* ビッド履歴 */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-bold mb-2">ビッド履歴</h4>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    {biddingHistory.map((bid, index) => (
                      <div key={index} className="bg-gray-700 p-2 rounded">
                        {bid.player}: {bid.bid}
                      </div>
                    ))}
                  </div>
                </div>

                {/* プレイヤーのビッドオプション */}
                {currentPlayer === 'south' && (
                  <div className="bg-green-800/50 rounded-lg p-4">
                    <h4 className="font-bold mb-2">あなたのビッド</h4>
                    <div className="grid grid-cols-4 gap-2">
                      <button onClick={() => handleBid('Pass')} className="bg-red-600 hover:bg-red-700 p-2 rounded">Pass</button>
                      <button onClick={() => handleBid('1♠')} className="bg-blue-600 hover:bg-blue-700 p-2 rounded">1♠</button>
                      <button onClick={() => handleBid('1♥')} className="bg-red-600 hover:bg-red-700 p-2 rounded">1♥</button>
                      <button onClick={() => handleBid('1♦')} className="bg-orange-600 hover:bg-orange-700 p-2 rounded">1♦</button>
                      <button onClick={() => handleBid('1♣')} className="bg-gray-600 hover:bg-gray-700 p-2 rounded">1♣</button>
                      <button onClick={() => handleBid('1NT')} className="bg-purple-600 hover:bg-purple-700 p-2 rounded">1NT</button>
                      <button onClick={() => handleBid('2NT')} className="bg-purple-600 hover:bg-purple-700 p-2 rounded">2NT</button>
                      <button onClick={() => handleBid('3NT')} className="bg-purple-600 hover:bg-purple-700 p-2 rounded">3NT</button>
                    </div>
                  </div>
                )}

                {/* 手札表示 */}
                <div className="bg-brown-800/50 rounded-lg p-4">
                  <h4 className="font-bold mb-2">あなたの手札</h4>
                  <div className="grid grid-cols-13 gap-1">
                    {hands.south.map((card, index) => (
                      <div
                        key={index}
                        className="bg-white text-black p-2 rounded text-center text-sm font-bold"
                      >
                        {card.rank}{card.suit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* プレイフェーズ */}
            {playPhase && (
              <div className="space-y-4">
                <div className="bg-blue-800/50 rounded-lg p-4">
                  <h3 className="text-lg font-bold mb-2">プレイフェーズ</h3>
                  <p className="mb-2">コントラクト: {contract?.bid} by {declarer}</p>
                  <p className="mb-2">切り札: {trump}</p>
                  <p className="mb-2">現在のプレイヤー: {currentPlayer}</p>
                  <p>トリック獲得数 - NS: {tricksWon.ns}, EW: {tricksWon.ew}</p>
                </div>

                {/* 現在のトリック */}
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="font-bold mb-2">現在のトリック</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {currentTrick.map((play, index) => (
                      <div key={index} className="bg-white text-black p-2 rounded text-center">
                        <div className="font-bold">{play.player}</div>
                        <div>{play.card.rank}{play.card.suit}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* プレイヤーの手札 */}
                {currentPlayer === 'south' && (
                  <div className="bg-green-800/50 rounded-lg p-4">
                    <h4 className="font-bold mb-2">カードを選択してください</h4>
                    <div className="grid grid-cols-13 gap-1">
                      {hands.south.map((card, index) => (
                        <button
                          key={index}
                          onClick={() => playCard(card)}
                          className="bg-white text-black p-2 rounded text-center text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                          {card.rank}{card.suit}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && (
          <div className="text-center space-y-6">
            <div className="bg-blue-800/50 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">{message}</h2>
              <button
                onClick={newGame}
                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-bold text-xl transition-colors"
              >
                新しいゲーム
              </button>
            </div>
          </div>
        )}

        {/* 最近のゲーム履歴 */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">最近のゲーム</h3>
          {gameHistory.length === 0 ? (
            <p className="text-gray-400">まだゲームをプレイしていません。</p>
          ) : (
            <div className="space-y-2">
              {gameHistory.map((game, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded flex justify-between items-center">
                  <div>
                    <span className="font-bold">{game.contract}</span>
                    <span className="ml-2">トリック: {game.tricksWon}/{game.neededTricks}</span>
                    <span className="ml-2">{game.result}</span>
                  </div>
                  <div className={`font-bold ${game.winnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {game.winnings >= 0 ? '+' : ''}{game.winnings}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ルール説明 */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">ゲームルール</h3>
          <div className="text-sm space-y-2">
            <p>• 4人制のトリックテイキングゲーム（あなたは南、他はコンピュータ）</p>
            <p>• ビッドフェーズ：コントラクト（取るべきトリック数とスーツ）を宣言</p>
            <p>• プレイフェーズ：13トリックをプレイし、コントラクト達成を目指す</p>
            <p>• コントラクト成功で賭け金の2倍を獲得</p>
            <p>• ポイント計算：A=4, K=3, Q=2, J=1点</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BridgeGame

