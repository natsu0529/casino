import { useState, useEffect } from 'react'

const HighOddsSlotGame = ({ currentUser, onNavigateHome, onUpdateBalance, onRecordGame }) => {
  // 高級シンボル（Cash Express風）
  const symbols = [
    { symbol: '💸', name: 'キャッシュ', value: 100, weight: 5 },      // 超高価値
    { symbol: '💎', name: 'ダイヤモンド', value: 50, weight: 8 },      // 高価値
    { symbol: '👑', name: 'クラウン', value: 30, weight: 12 },         // 高価値
    { symbol: '🏆', name: 'トロフィー', value: 20, weight: 15 },       // 中高価値
    { symbol: '⭐', name: 'ゴールドスター', value: 15, weight: 20 },    // 中価値
    { symbol: '🎰', name: 'ラッキー7', value: 10, weight: 25 },        // 中価値
    { symbol: '🔔', name: 'ゴールドベル', value: 8, weight: 30 },      // 中価値
    { symbol: '🍀', name: 'ラッキークローバー', value: 5, weight: 35 }, // 低価値
  ]

  // ゲーム状態
  const [reels, setReels] = useState([0, 0, 0, 0, 0]) // 5リール
  const [spinning, setSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(500) // 最低500コイン
  const [message, setMessage] = useState('')
  const [lastWin, setLastWin] = useState(0)
  const [gameHistory, setGameHistory] = useState([])
  const [multiplier, setMultiplier] = useState(1)
  const [bonusRound, setBonusRound] = useState(false)
  const [freeSpins, setFreeSpins] = useState(0)

  // 重み付きランダム選択
  const getWeightedRandomSymbol = () => {
    const totalWeight = symbols.reduce((sum, symbol) => sum + symbol.weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < symbols.length; i++) {
      random -= symbols[i].weight
      if (random <= 0) {
        return i
      }
    }
    return 0
  }

  // ペイライン判定（5リール版）
  const checkPaylines = (reels) => {
    const paylines = [
      [0, 1, 2, 3, 4], // 中央ライン
      [0, 0, 1, 2, 3], // 上昇ライン
      [4, 3, 2, 1, 0], // 下降ライン
      [0, 1, 1, 1, 0], // V字ライン
      [4, 3, 3, 3, 4], // 逆V字ライン
    ]

    let totalMultiplier = 0
    let winningLines = []

    paylines.forEach((line, lineIndex) => {
      const symbols = line.map(pos => reels[pos])
      const lineMultiplier = calculateLineWin(symbols)
      
      if (lineMultiplier > 0) {
        totalMultiplier += lineMultiplier
        winningLines.push({ line: lineIndex + 1, multiplier: lineMultiplier })
      }
    })

    return { totalMultiplier, winningLines }
  }

  // ライン勝利計算（厳格版）
  const calculateLineWin = (lineSymbols) => {
    // デバッグ用ログ
    console.log('Line symbols:', lineSymbols.map(i => symbols[i].symbol), 'Indexes:', lineSymbols)
    
    // 左から連続している同じシンボルをチェック
    const firstSymbol = lineSymbols[0]
    let consecutiveCount = 1
    
    // 厳格な連続チェック：左から順番に同じシンボルでないと途切れる
    for (let i = 1; i < lineSymbols.length; i++) {
      if (lineSymbols[i] === firstSymbol) {
        consecutiveCount++
      } else {
        // 連続が途切れたら即座に終了
        break
      }
    }

    console.log(`First symbol: ${symbols[firstSymbol].symbol}, Consecutive: ${consecutiveCount}`)

    // キャッシュシンボル（💸）の特別ルール：2つ以上連続で勝利
    if (firstSymbol === 0 && consecutiveCount >= 2) { // キャッシュは0番目
      const winAmount = symbols[0].value * consecutiveCount * 2
      console.log(`Cash special rule win: ${winAmount}`)
      return winAmount
    }

    // 一般シンボル：3つ以上連続している場合のみ勝利
    if (consecutiveCount >= 3) {
      const symbol = symbols[firstSymbol]
      const baseMultiplier = symbol.value
      
      // 連続数に応じて倍率アップ
      let countMultiplier = 1
      if (consecutiveCount === 5) countMultiplier = 10
      else if (consecutiveCount === 4) countMultiplier = 5
      else if (consecutiveCount === 3) countMultiplier = 2
      
      const winAmount = baseMultiplier * countMultiplier
      console.log(`Normal win: ${symbol.symbol} x${consecutiveCount} = ${winAmount}`)
      return winAmount
    }

    console.log('No win - insufficient consecutive symbols')
    return 0
  }

  // ボーナス判定
  const checkBonus = (reels) => {
    const bonusSymbols = reels.filter(s => s <= 2).length // 上位3シンボル
    if (bonusSymbols >= 3) {
      setFreeSpins(10)
      setBonusRound(true)
      return true
    }
    return false
  }

  // スピン実行
  const spin = () => {
    // 既にスピン中の場合は処理しない
    if (spinning) {
      return
    }
    
    const currentBet = freeSpins > 0 ? 0 : betAmount
    
    if (currentBet > currentUser.balance) {
      setMessage('残高が不足しています。')
      return
    }

    setSpinning(true)
    setMessage('スピン中...')
    setLastWin(0)

    // フリースピンでない場合のみ残高を減らす
    if (freeSpins === 0) {
      onUpdateBalance(currentUser.balance - currentBet)
    } else {
      setFreeSpins(prev => prev - 1)
    }

    // スピンアニメーション
    const spinDuration = 3000 + Math.random() * 1000
    const spinInterval = 100

    let elapsed = 0
    const spinTimer = setInterval(() => {
      setReels([
        getWeightedRandomSymbol(),
        getWeightedRandomSymbol(),
        getWeightedRandomSymbol(),
        getWeightedRandomSymbol(),
        getWeightedRandomSymbol()
      ])

      elapsed += spinInterval
      if (elapsed >= spinDuration) {
        clearInterval(spinTimer)
        
        // 最終結果を決定
        const finalReels = [
          getWeightedRandomSymbol(),
          getWeightedRandomSymbol(),
          getWeightedRandomSymbol(),
          getWeightedRandomSymbol(),
          getWeightedRandomSymbol()
        ]
        
        setReels(finalReels)
        
        setTimeout(() => {
          checkResult(finalReels, betAmount) // 常にbetAmountを渡す（フリースピンでも記録用）
        }, 500)
      }
    }, spinInterval)
  }

  // 結果判定
  const checkResult = (finalReels, originalBetAmount) => {
    console.log('=== checkResult関数開始 ===')
    console.log('spinning状態をfalseに設定')
    setSpinning(false) // 確実にspinning状態を解除
    
    const { totalMultiplier, winningLines } = checkPaylines(finalReels)
    const bonusTriggered = checkBonus(finalReels)
    
    // フリースピン時もオリジナルのベット額で計算
    let winAmount = originalBetAmount * totalMultiplier * multiplier

    if (totalMultiplier > 0) {
      setLastWin(winAmount)
      onUpdateBalance(currentUser.balance + winAmount)
      
      if (totalMultiplier >= 500) {
        setMessage(`🎉 メガウィン！ ${winAmount.toLocaleString()}コイン獲得！ 🎉`)
      } else if (totalMultiplier >= 100) {
        setMessage(`💎 ビッグウィン！ ${winAmount.toLocaleString()}コイン獲得！ 💎`)
      } else if (totalMultiplier >= 50) {
        setMessage(`👑 グレートウィン！ ${winAmount.toLocaleString()}コイン獲得！ 👑`)
      } else {
        setMessage(`⭐ ウィン！ ${winAmount.toLocaleString()}コイン獲得！ ⭐`)
      }
    } else if (bonusTriggered) {
      setMessage('🎰 ボーナスラウンド開始！フリースピン10回！ 🎰')
    } else {
      setMessage(freeSpins > 0 ? `フリースピン残り: ${freeSpins}回` : '残念！もう一度挑戦してください。')
    }

    // フリースピン終了チェック
    if (freeSpins === 1 && bonusRound) {
      setBonusRound(false)
      setMessage('ボーナスラウンド終了！')
    }

    // ゲーム履歴に追加
    const newHistory = {
      reels: finalReels,
      bet: originalBetAmount,
      win: winAmount,
      multiplier: totalMultiplier,
      winningLines: winningLines,
      timestamp: new Date().toLocaleTimeString()
    }
    setGameHistory(prev => [newHistory, ...prev.slice(0, 4)])

    // ゲーム記録
    if (onRecordGame) {
      onRecordGame(
        'high_odds_slot',
        originalBetAmount,
        winAmount,
        winAmount > originalBetAmount ? 'win' : 'lose'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-yellow-300">💸 高オッズスロット 💸</h1>
          <div className="text-white text-right">
            <div className="text-lg font-bold">👤 {currentUser.username}</div>
            <div className="text-yellow-300 font-bold">💰 {currentUser.balance.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ボーナス情報 */}
        {bonusRound && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 mb-6 text-center">
            <h2 className="text-2xl font-bold text-white">🎰 ボーナスラウンド 🎰</h2>
            <p className="text-white">フリースピン残り: {freeSpins}回</p>
          </div>
        )}

        {/* スロットマシン */}
        <div className="bg-gradient-to-b from-yellow-400 to-amber-600 rounded-lg p-8 mb-6 shadow-2xl">
          <div className="bg-black rounded-lg p-6 mb-6">
            <div className="flex justify-center space-x-2">
              {reels.map((reelIndex, index) => (
                <div key={index} className={`w-20 h-20 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-lg flex items-center justify-center text-3xl font-bold border-4 border-yellow-500 shadow-lg ${
                  spinning ? 'animate-pulse' : ''
                }`}>
                  {symbols[reelIndex].symbol}
                </div>
              ))}
            </div>
          </div>

          {/* コントロールパネル */}
          <div className="bg-black/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-white">
                <label htmlFor="bet-amount" className="text-lg font-bold">ベット額: {betAmount.toLocaleString()}コイン</label>
                {freeSpins > 0 && <span className="text-yellow-300 ml-4">フリースピン中！</span>}
              </div>
              <div className="flex space-x-2" role="group" aria-label="ベット額選択">
                {!freeSpins && (
                  <>
                    <button
                      id="bet-500"
                      onClick={() => setBetAmount(500)}
                      className={`px-3 py-2 rounded text-white ${betAmount === 500 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額500コイン"
                    >
                      500
                    </button>
                    <button
                      id="bet-1000"
                      onClick={() => setBetAmount(1000)}
                      className={`px-3 py-2 rounded text-white ${betAmount === 1000 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額1000コイン"
                    >
                      1000
                    </button>
                    <button
                      id="bet-2000"
                      onClick={() => setBetAmount(2000)}
                      className={`px-3 py-2 rounded text-white ${betAmount === 2000 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額2000コイン"
                    >
                      2000
                    </button>
                    <button
                      id="bet-5000"
                      onClick={() => setBetAmount(5000)}
                      className={`px-3 py-2 rounded text-white ${betAmount === 5000 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額5000コイン"
                    >
                      5000
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                id="main-spin-button"
                onClick={spin}
                disabled={spinning || (!freeSpins && betAmount > currentUser.balance)}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                aria-label={spinning ? 'スピン中' : freeSpins > 0 ? 'フリースピン実行' : 'スピン実行'}
              >
                {spinning ? 'スピン中...' : freeSpins > 0 ? 'フリースピン' : 'スピン'}
              </button>
            </div>
          </div>

          {/* 最後の勝利金 */}
          {lastWin > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-3 rounded-lg mt-4">
              <span className="text-2xl font-bold">🎉 {lastWin.toLocaleString()}コイン獲得！ 🎉</span>
            </div>
          )}
        </div>

        {/* メッセージエリア */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
            <p className="text-white text-center text-lg font-bold">{message}</p>
          </div>
        )}

        {/* ペイアウトテーブルとゲーム履歴 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ペイアウトテーブル */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <h3 className="text-white font-bold mb-4 text-center">ペイアウトテーブル</h3>
            <div className="space-y-2 text-sm">
              <div className="text-yellow-300 font-bold border-b border-white/30 pb-2">5連続</div>
              {symbols.map((symbol, index) => (
                <div key={index} className="flex justify-between text-white">
                  <span>{symbol.symbol} {symbol.name}</span>
                  <span className="text-yellow-300 font-bold">{symbol.value * 10}倍</span>
                </div>
              ))}
              
              <div className="border-t border-white/30 pt-2 mt-2">
                <div className="text-white font-bold">特別ルール</div>
                <div className="flex justify-between text-white text-xs">
                  <span>💸 キャッシュ2個以上</span>
                  <span>特別配当</span>
                </div>
                <div className="flex justify-between text-white text-xs">
                  <span>ボーナスシンボル3個以上</span>
                  <span>フリースピン10回</span>
                </div>
              </div>
            </div>
          </div>

          {/* ゲーム履歴 */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <h3 className="text-white font-bold mb-4 text-center">最近のゲーム</h3>
            <div className="space-y-2 text-sm">
              {gameHistory.length === 0 ? (
                <p className="text-gray-300 text-center">まだゲームをプレイしていません</p>
              ) : (
                gameHistory.map((game, index) => (
                  <div key={index} className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-1">
                        {game.reels.map((reelIndex, i) => (
                          <span key={i} className="text-lg">{symbols[reelIndex].symbol}</span>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${game.win > 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {game.win > 0 ? `+${game.win.toLocaleString()}` : `-${game.bet.toLocaleString()}`}
                        </div>
                        <div className="text-xs text-gray-300">{game.timestamp}</div>
                      </div>
                    </div>
                    {game.winningLines.length > 0 && (
                      <div className="text-xs text-yellow-300 mt-1">
                        勝利ライン: {game.winningLines.map(line => `#${line.line}`).join(', ')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HighOddsSlotGame
