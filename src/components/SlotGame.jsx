import { useState, useEffect, useRef } from 'react'

const SlotGame = ({ currentUser, onNavigateHome, onUpdateBalance }) => {
  // スロットシンボル（期待値1.1調整版）
  const symbols = [
    { symbol: '🍒', name: 'チェリー', value: 1, weight: 35 },  // 高確率
    { symbol: '🍋', name: 'レモン', value: 2, weight: 30 },    // 高確率
    { symbol: '🍊', name: 'オレンジ', value: 3, weight: 20 }, // 中確率
    { symbol: '🍇', name: 'ブドウ', value: 4, weight: 10 },   // 中確率
    { symbol: '🔔', name: 'ベル', value: 5, weight: 4 },      // 低確率
    { symbol: '⭐', name: 'スター', value: 10, weight: 0.8 }, // 超低確率
    { symbol: '💎', name: 'ダイヤ', value: 15, weight: 0.15 }, // 激レア
    { symbol: '7️⃣', name: 'ラッキーセブン', value: 50, weight: 0.05 } // 超激レア
  ]

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
    return 0 // フォールバック
  }

  // ゲーム状態
  const [reels, setReels] = useState([0, 0, 0])
  const [spinning, setSpinning] = useState(false)
  const [betAmount, setBetAmount] = useState(10)
  const [message, setMessage] = useState('')
  const [lastWin, setLastWin] = useState(0)
  const [gameHistory, setGameHistory] = useState([])
  const [autoSpin, setAutoSpin] = useState(false)
  const [autoSpinCount, setAutoSpinCount] = useState(0)
  const [maxAutoSpins, setMaxAutoSpins] = useState(10)
  const [autoSpinInterval, setAutoSpinInterval] = useState(null)
  
  // 最新の残高を追跡するref
  const currentBalanceRef = useRef(currentUser.balance)
  const autoSpinRef = useRef(false)
  const autoSpinCountRef = useRef(0)
  
  // 残高とautoSpinの更新を追跡
  useEffect(() => {
    currentBalanceRef.current = currentUser.balance
  }, [currentUser.balance])
  
  useEffect(() => {
    autoSpinRef.current = autoSpin
  }, [autoSpin])

  useEffect(() => {
    autoSpinCountRef.current = autoSpinCount
  }, [autoSpinCount])

  // 連続スピン制御関数
  const startAutoSpin = (count) => {
    if (spinning || autoSpin) return
    if (currentBalanceRef.current < betAmount) {
      setMessage('残高が不足しています。')
      return
    }
    
    console.log(`=== 連続スピン開始 ===`)
    console.log(`回数: ${count}回`)
    
    setAutoSpin(true)
    autoSpinRef.current = true
    setAutoSpinCount(0)
    autoSpinCountRef.current = 0
    setMaxAutoSpins(count)
    spin()
  }

  const stopAutoSpin = () => {
    console.log(`=== 連続スピン手動停止 ===`)
    console.trace('stopAutoSpin called from:') // 呼び出し元を特定
    setAutoSpin(false)
    autoSpinRef.current = false
    setAutoSpinCount(0)
    autoSpinCountRef.current = 0
    setMessage('連続スピンを停止しました。')
  }

  // ペイアウトテーブル（期待値1.1調整版）
  const getPayoutMultiplier = (reel1, reel2, reel3) => {
    const symbol1 = symbols[reel1]
    const symbol2 = symbols[reel2]
    const symbol3 = symbols[reel3]

    // デバッグ用ログ
    console.log('=== 通常スロット勝利判定 ===')
    console.log('Reel positions:', reel1, reel2, reel3)
    console.log('Symbols:', symbol1.symbol, symbol2.symbol, symbol3.symbol)
    console.log('Symbol names:', symbol1.name, symbol2.name, symbol3.name)

    // 3つ同じシンボルのみ当たり（プレイヤー有利版 RTP125%）
    if (reel1 === reel2 && reel2 === reel3) {
      console.log('3つ揃い判定: 成功')
      switch (symbol1.name) {
        case 'ラッキーセブン': 
          console.log('ラッキーセブン3つ: 100倍')
          return 100  // 7が3つ揃い（50→100倍）
        case 'ダイヤ': 
          console.log('ダイヤ3つ: 50倍')
          return 50         // ダイヤ3つ（15→50倍）
        case 'スター': 
          console.log('スター3つ: 25倍')
          return 25         // スター3つ（10→25倍）
        case 'ベル': 
          console.log('ベル3つ: 20倍')
          return 20            // ベル3つ（8→20倍）
        case 'ブドウ': 
          console.log('ブドウ3つ: 10倍')
          return 10          // ブドウ3つ（6→10倍）
        case 'オレンジ': 
          console.log('オレンジ3つ: 6倍')
          return 6        // オレンジ3つ（4→6倍）
        case 'レモン': 
          console.log('レモン3つ: 10倍')
          return 10          // レモン3つ（3→10倍）
        case 'チェリー': 
          console.log('チェリー3つ: 20倍')
          return 20        // チェリー3つ（2→20倍）
        default: 
          console.log('不明なシンボル: 0倍')
          return 0
      }
    }

    // チェリーの特別ルール（大幅強化）
    if (reel1 === 0) { // チェリーは0番目
      if (reel2 === 0) { // 左2つがチェリー
        console.log('チェリー特別ルール: 左2つチェリー 5倍')
        return 5 // 2→5倍
      } else { // 左1つだけチェリー
        console.log('チェリー特別ルール: 左1つチェリー 2倍')
        return 2 // 1→2倍
      }
    }

    // ベルの特別ルール削除（期待値調整のため）
    
    console.log('勝利なし: 0倍')
    return 0 // ハズレ
  }

  // スピン実行
  const spin = () => {
    // 既にスピン中の場合は処理しない
    if (spinning) {
      return
    }
    
    if (betAmount > currentBalanceRef.current) {
      setMessage('残高が不足しています。')
      setAutoSpin(false)
      autoSpinRef.current = false
      setAutoSpinCount(0)
      return
    }

    setSpinning(true)
    setMessage(autoSpinRef.current ? `連続スピン中... (${autoSpinCount + 1}/${maxAutoSpins})` : 'スピン中...')
    setLastWin(0)

    // 残高から賭け金を引く
    const newBalance = currentBalanceRef.current - betAmount
    onUpdateBalance(newBalance)
    currentBalanceRef.current = newBalance

    // アニメーション効果のためのランダム回転
    const spinDuration = autoSpinRef.current ? 1000 : 2000 + Math.random() * 1000 // 連続スピン時は短縮
    const spinInterval = 100 // 100msごとに更新

    let elapsed = 0
    const spinTimer = setInterval(() => {
      setReels([
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length),
        Math.floor(Math.random() * symbols.length)
      ])

      elapsed += spinInterval
      if (elapsed >= spinDuration) {
        clearInterval(spinTimer)
        
        // 最終結果を決定（重み付きランダム）
        const finalReels = [
          getWeightedRandomSymbol(),
          getWeightedRandomSymbol(),
          getWeightedRandomSymbol()
        ]
        
        setReels(finalReels)
        
        // 結果判定
        setTimeout(() => {
          checkResult(finalReels)
        }, autoSpinRef.current ? 200 : 500) // 連続スピン時は短縮
      }
    }, spinInterval)
  }

  // 結果判定
  const checkResult = (finalReels) => {
    console.log(`=== checkResult関数開始 ===`)
    console.log(`autoSpin状態: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}`)
    console.log(`autoSpinCount: ${autoSpinCount}, maxAutoSpins: ${maxAutoSpins}`)
    
    setSpinning(false) // 確実にspinning状態を解除
    
    const multiplier = getPayoutMultiplier(finalReels[0], finalReels[1], finalReels[2])
    const winAmount = betAmount * multiplier

    if (multiplier > 0) {
      setLastWin(winAmount)
      onUpdateBalance(currentUser.balance + winAmount)
      // 内部残高も更新
      currentBalanceRef.current = currentUser.balance + winAmount
      
      if (!autoSpinRef.current) {
        // 連続スピン中でない場合のみメッセージを表示
        if (multiplier >= 77) {
          setMessage(`🎉 ラッキーセブン！ ${winAmount.toLocaleString()}コイン獲得！ 🎉`)
        } else if (multiplier >= 20) {
          setMessage(`💎 大当たり！ ${winAmount.toLocaleString()}コイン獲得！ 💎`)
        } else if (multiplier >= 10) {
          setMessage(`⭐ 当たり！ ${winAmount.toLocaleString()}コイン獲得！ ⭐`)
        } else {
          setMessage(`🍒 小当たり！ ${winAmount.toLocaleString()}コイン獲得！`)
        }
      }
    } else if (!autoSpinRef.current) {
      setMessage('残念！もう一度挑戦してください。')
    }

    console.log(`=== 連続スピン条件チェック ===`)
    console.log(`autoSpin: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}`)
    
    // 連続スピンの処理 - refの値を使用
    if (autoSpinRef.current) {
      const newCount = autoSpinCountRef.current + 1
      console.log(`=== 連続スピン処理開始 ===`)
      console.log(`現在のカウント: ${autoSpinCountRef.current}, 新しいカウント: ${newCount}, 最大回数: ${maxAutoSpins}`)
      console.log(`autoSpin状態: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}`)
      
      // 先にカウントを更新（stateとref両方）
      setAutoSpinCount(newCount)
      autoSpinCountRef.current = newCount
      
      // 終了条件を厳密にチェック
      if (newCount >= maxAutoSpins) {
        // 連続スピン終了
        console.log(`連続スピン終了: ${newCount} >= ${maxAutoSpins}`)
        setAutoSpin(false)
        autoSpinRef.current = false
        setAutoSpinCount(0)
        autoSpinCountRef.current = 0
        setMessage(`連続スピン完了！ ${maxAutoSpins}回実行しました。`)
      } else {
        // 連続スピン中のメッセージを更新
        setMessage(`連続スピン中... (${newCount}/${maxAutoSpins})`)
        console.log(`次のスピンをスケジュール: ${newCount}/${maxAutoSpins}`)
        
        // タイマー前に再度終了条件チェック
        const shouldContinue = newCount < maxAutoSpins && autoSpinRef.current
        if (shouldContinue) {
          // 次のスピンを実行
          setTimeout(() => {
            console.log(`=== タイマー実行 ===`)
            console.log(`現在の残高: ${currentBalanceRef.current}, ベット額: ${betAmount}`)
            console.log(`autoSpin状態（タイマー内）: ${autoSpinRef.current}`)
            console.log(`現在のカウント（タイマー内）: ${autoSpinCountRef.current}, 最大回数: ${maxAutoSpins}`)
            
            // 三重チェック: 残高・autoSpin状態・回数制限（refの値を使用）
            if (betAmount <= currentBalanceRef.current && autoSpinRef.current && autoSpinCountRef.current < maxAutoSpins) {
              console.log(`全条件OK、次のスピンを実行`)
              spin()
            } else {
              console.log(`条件不満足で連続スピン停止`)
              setAutoSpin(false)
              autoSpinRef.current = false
              setAutoSpinCount(0)
              autoSpinCountRef.current = 0
              if (betAmount > currentBalanceRef.current) {
                setMessage('残高不足により連続スピンを停止しました。')
              } else {
                setMessage(`連続スピン完了！`)
              }
            }
          }, 1000) // 1秒後に次のスピン
        } else {
          console.log(`継続条件不満足で連続スピン即時停止`)
          setAutoSpin(false)
          autoSpinRef.current = false
          setAutoSpinCount(0)
          autoSpinCountRef.current = 0
          setMessage(`連続スピン完了！`)
        }
      }
    } else {
      console.log(`連続スピン処理をスキップ（autoSpin: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}）`)
    }

    // ゲーム履歴に追加
    const newHistory = {
      reels: finalReels,
      bet: betAmount,
      win: winAmount,
      multiplier: multiplier,
      timestamp: new Date().toLocaleTimeString()
    }
    setGameHistory(prev => [newHistory, ...prev.slice(0, 4)]) // 最新5件まで保持
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-1 xs:p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col xs:flex-row justify-between items-center mb-2 xs:mb-4 sm:mb-6 gap-2 xs:gap-0">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base order-1 xs:order-none"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-1 xs:gap-2 order-2 xs:order-none text-center">🎰 スロット 🎰</h1>
          <div className="text-white text-center xs:text-right order-3 xs:order-none">
            <div className="text-xs xs:text-sm sm:text-lg font-bold">👤 {currentUser.username}</div>
            <div className="text-xs xs:text-sm sm:text-xl font-bold text-yellow-300">💰 {currentUser.balance.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* スロットマシン */}
        <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg p-3 xs:p-4 sm:p-6 lg:p-8 mb-2 xs:mb-3 sm:mb-4 lg:mb-6 shadow-2xl">
          <div className="bg-black rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
            <div className="flex justify-center gap-1 xs:gap-2 sm:gap-3 lg:gap-4 overflow-x-auto">
              {reels.map((reelIndex, index) => (
                <div key={index} className={`w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-white rounded-lg flex items-center justify-center text-lg xs:text-2xl sm:text-3xl lg:text-4xl font-bold border-2 xs:border-3 sm:border-4 border-gray-300 flex-shrink-0 ${
                  spinning ? 'animate-pulse' : ''
                }`}>
                  {symbols[reelIndex].symbol}
                </div>
              ))}
            </div>
          </div>

          {/* ベットコントロール */}
          <div className="bg-white/20 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-4 mb-2 xs:mb-3 sm:mb-4">
            <div className="flex flex-col xs:flex-row items-center justify-center gap-2 xs:gap-3 sm:gap-4 mb-2 xs:mb-3 sm:mb-4">
              <label htmlFor="bet-amount-select" className="text-white font-medium text-xs xs:text-sm sm:text-base">賭け金:</label>
              <select
                id="bet-amount-select"
                name="betAmount"
                value={betAmount}
                onChange={(e) => setBetAmount(parseInt(e.target.value))}
                disabled={spinning}
                className="px-2 py-1 xs:px-3 xs:py-2 rounded-lg bg-white/20 border border-white/30 text-white text-xs xs:text-sm sm:text-base"
                aria-label="賭け金選択"
              >
                <option value={5}>5コイン</option>
                <option value={10}>10コイン</option>
                <option value={25}>25コイン</option>
                <option value={50}>50コイン</option>
                <option value={100}>100コイン</option>
              </select>
            </div>

            <div className="flex flex-col items-center gap-2 xs:gap-3">
              {/* 通常スピンボタン */}
              <button
                id="slot-spin-button"
                onClick={spin}
                disabled={spinning || betAmount > currentUser.balance || autoSpin}
                className={`px-4 py-2 xs:px-6 xs:py-2 sm:px-8 sm:py-3 rounded-lg font-bold text-white transition-all duration-300 text-xs xs:text-sm sm:text-base ${
                  spinning || betAmount > currentUser.balance || autoSpin
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 hover:scale-105'
                }`}
                aria-label={spinning ? 'スピン中' : 'スピン実行'}
              >
                {spinning ? 'スピン中...' : autoSpin ? '連続スピン中' : 'スピン'}
              </button>
              
              {/* 連続スピンボタン */}
              {!autoSpin ? (
                <div className="flex gap-1 xs:gap-2">
                  <button
                    onClick={() => startAutoSpin(10)}
                    disabled={spinning || betAmount > currentUser.balance}
                    className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-xs xs:text-sm font-medium ${
                      spinning || betAmount > currentUser.balance
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    10回
                  </button>
                  <button
                    onClick={() => startAutoSpin(25)}
                    disabled={spinning || betAmount > currentUser.balance}
                    className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-xs xs:text-sm font-medium ${
                      spinning || betAmount > currentUser.balance
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    25回
                  </button>
                  <button
                    onClick={() => startAutoSpin(50)}
                    disabled={spinning || betAmount > currentUser.balance}
                    className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-xs xs:text-sm font-medium ${
                      spinning || betAmount > currentUser.balance
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    50回
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-white text-xs xs:text-sm">
                    連続スピン: {autoSpinCount}/{maxAutoSpins}
                  </div>
                  <button
                    onClick={stopAutoSpin}
                    className="px-3 py-1 xs:px-4 xs:py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs xs:text-sm font-medium"
                  >
                    停止
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 最後の勝利金 */}
          {lastWin > 0 && (
            <div className="bg-green-500 text-white text-center py-1 xs:py-2 rounded-lg mb-2 xs:mb-3 sm:mb-4">
              <span className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold">🎉 {lastWin.toLocaleString()}コイン獲得！ 🎉</span>
            </div>
          )}
        </div>

        {/* メッセージエリア */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-4 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
            <p className="text-white text-center text-sm xs:text-base sm:text-lg font-bold">{message}</p>
          </div>
        )}

        {/* ペイアウトテーブル */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 lg:gap-6 mb-2 xs:mb-3 sm:mb-4 lg:mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-4">
            <h3 className="text-white font-bold mb-2 xs:mb-3 sm:mb-4 text-center text-sm xs:text-base sm:text-lg">ペイアウトテーブル</h3>
            <div className="space-y-1 xs:space-y-2 text-xs xs:text-sm">
              <div className="text-white font-bold border-b border-white/30 pb-1 xs:pb-2">3つ揃い</div>
              <div className="flex justify-between text-white">
                <span>7️⃣ ラッキーセブン</span>
                <span className="text-yellow-300 font-bold">77倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>💎 ダイヤ</span>
                <span className="text-purple-300 font-bold">20倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>⭐ スター</span>
                <span className="text-blue-300">15倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>🔔 ベル</span>
                <span>10倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>🍇 ブドウ</span>
                <span>8倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>🍊 オレンジ</span>
                <span>6倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>🍋 レモン</span>
                <span>4倍</span>
              </div>
              <div className="flex justify-between text-white">
                <span>🍒 チェリー</span>
                <span>2倍</span>
              </div>
              
              <div className="border-t border-white/30 pt-1 xs:pt-2 mt-1 xs:mt-2">
                <div className="text-white font-bold text-xs xs:text-sm">特別ルール</div>
                <div className="flex justify-between text-white text-xs">
                  <span>🍒 左リール1個</span>
                  <span>2倍</span>
                </div>
                <div className="flex justify-between text-white text-xs">
                  <span>🍒 左リール2個</span>
                  <span>4倍</span>
                </div>
                <div className="flex justify-between text-white text-xs">
                  <span>🔔 ベル2個以上</span>
                  <span>3倍</span>
                </div>
              </div>
            </div>
          </div>

          {/* ゲーム履歴 */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-4">
            <h3 className="text-white font-bold mb-2 xs:mb-3 sm:mb-4 text-center text-sm xs:text-base sm:text-lg">最近のゲーム</h3>
            <div className="space-y-1 xs:space-y-2 text-xs xs:text-sm">
              {gameHistory.length === 0 ? (
                <p className="text-gray-300 text-center">まだゲームをプレイしていません</p>
              ) : (
                gameHistory.map((game, index) => (
                  <div key={index} className="bg-white/5 rounded p-1 xs:p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-0.5 xs:gap-1">
                        {game.reels.map((reelIndex, i) => (
                          <span key={i} className="text-sm xs:text-base sm:text-lg">{symbols[reelIndex].symbol}</span>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-xs xs:text-sm ${game.win > 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {game.win > 0 ? `+${game.win}` : `-${game.bet}`}
                        </div>
                        <div className="text-xs text-gray-300">{game.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ルール説明 */}
        <div className="bg-white/5 backdrop-blur-md rounded-lg p-2 xs:p-3 sm:p-4">
          <h4 className="text-white font-bold mb-1 xs:mb-2 text-xs xs:text-sm sm:text-base">ゲームルール:</h4>
          <p className="text-gray-300 text-xs xs:text-sm">
            3つのリールを回転させ、同じシンボルを揃えてコインを獲得しましょう。
            3つ揃いが最高配当、2つ揃いや特別な組み合わせでも配当があります。
            オートプレイ機能で連続プレイも可能です。
          </p>
        </div>
      </div>
    </div>
  )
}

export default SlotGame

