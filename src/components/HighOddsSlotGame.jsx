import { useState, useEffect, useRef } from 'react'

const HighOddsSlotGame = ({ currentUser, onNavigateHome, onUpdateBalance, onRecordGame }) => {
  // null/undefined チェック（早期リターン）
  if (!currentUser || typeof currentUser.balance !== 'number') {
    console.warn('⚠️ 高オッズスロット: currentUserまたはbalanceが無効:', currentUser)
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">データ読み込み中...</h2>
          <p>ユーザー情報を読み込んでいます。しばらくお待ちください。</p>
        </div>
      </div>
    )
  }

  // 高級シンボル（期待値200%→約133%調整版）
  const symbols = [
    { symbol: '💎', name: 'ダイヤモンド', value: 8, weight: 8 },      // 8倍
    { symbol: '🔥', name: 'ファイア', value: 7, weight: 10 },         // 7倍
    { symbol: '⭐', name: 'ゴールドスター', value: 5, weight: 12 },   // 5倍
    { symbol: '🍒', name: 'チェリー', value: 4, weight: 15 },         // 4倍
    { symbol: '🍋', name: 'レモン', value: 3, weight: 20 },           // 3倍
    { symbol: '🍊', name: 'オレンジ', value: 2, weight: 25 },         // 2倍
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
  const [autoSpin, setAutoSpin] = useState(false)
  const [autoSpinCount, setAutoSpinCount] = useState(0)
  const [maxAutoSpins, setMaxAutoSpins] = useState(10)
  
  // 連続スピン中にボーナスが発生した場合の状態保存
  const [pausedAutoSpin, setPausedAutoSpin] = useState(false)
  const [pausedAutoSpinCount, setPausedAutoSpinCount] = useState(0)
  const [pausedMaxAutoSpins, setPausedMaxAutoSpins] = useState(0)
  
  // 最新の残高を追跡するref
  const currentBalanceRef = useRef(currentUser.balance)
  const autoSpinRef = useRef(false)
  const autoSpinCountRef = useRef(0)
  const pausedAutoSpinRef = useRef(false)
  const maxAutoSpinsRef = useRef(0) // 追加: maxAutoSpinsのref版
  
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

  useEffect(() => {
    pausedAutoSpinRef.current = pausedAutoSpin
  }, [pausedAutoSpin])

  useEffect(() => {
    maxAutoSpinsRef.current = maxAutoSpins
  }, [maxAutoSpins])

  // freeSpinsの変化を監視し、フリースピンがセットされた瞬間に自動開始
  useEffect(() => {
    if (freeSpins > 0 && !spinning && bonusRound && pausedAutoSpinRef.current) {
      console.log('フリースピンが検出されました。自動スピンを開始します:', freeSpins)
      // 少し遅延を入れてからスピンを開始（UIの更新を確実にするため）
      const timer = setTimeout(() => {
        // 再度フリースピンの状態をチェックして確実に実行
        if (freeSpins > 0 && !spinning && bonusRound) {
          console.log('useEffectでフリースピンを実行:', freeSpins)
          spin()
        }
      }, 2500) // 2.5秒待機
      
      return () => clearTimeout(timer) // クリーンアップ
    } else if (freeSpins === 0 && bonusRound && pausedAutoSpinRef.current) {
      console.log('useEffectでフリースピン終了を検出しました（減算後に0）')
      // フリースピン終了時の処理は下のuseEffectで行うため、ここでは何もしない
    }
  }, [freeSpins, spinning, bonusRound])

  // 連続スピンの自動再開を監視
  useEffect(() => {
    // フリースピン終了時の連続スピン再開処理
    if (freeSpins === 0 && bonusRound && pausedAutoSpinRef.current) {
      console.log(`=== useEffectでフリースピン終了、連続スピン再開準備 ===`)
      console.log(`pausedAutoSpinCount: ${pausedAutoSpinCount}, pausedMaxAutoSpins: ${pausedMaxAutoSpins}`)
      
      setBonusRound(false)
      setPausedAutoSpin(false)
      pausedAutoSpinRef.current = false
      
      // 連続スピンが残っている場合は再開設定
      if (pausedAutoSpinCount < pausedMaxAutoSpins) {
        console.log(`useEffectで連続スピン再開設定: ${pausedAutoSpinCount}/${pausedAutoSpins}`)
        console.log(`復元する値 - autoSpinCount: ${pausedAutoSpinCount}, maxAutoSpins: ${pausedMaxAutoSpンス}`)
        setAutoSpin(true)
        autoSpinRef.current = true
        setAutoSpinCount(pausedAutoSpinCount)
        autoSpinCountRef.current = pausedAutoSpinCount
        setMaxAutoSpins(pausedAutoSpins)
        setMessage(`ボーナス終了！連続スピン再開 (${pausedAutoSpinCount}/${pausedAutoSpンス})`)
        
        // 少し遅延してから自動実行
        const timer = setTimeout(() => {
          if (autoSpinRef.current && !spinning && freeSpins === 0 && betAmount <= currentBalanceRef.current) {
            console.log('useEffectで連続スピン自動継続実行')
            spin()
          }
        }, 2000) // 2秒後に自動実行
        
        return () => clearTimeout(timer)
      } else {
        console.log(`useEffectで連続スピン完了: ${pausedAutoSpinCount} >= ${pausedMaxAutoSpins}`)
        setMessage('ボーナス終了！連続スピン完了！')
        // リセット
        setPausedAutoSpinCount(0)
        setPausedMaxAutoSpスン(0)
      }
      return
    }
    
    // フリースピン終了後に連続スピンを自動再開（従来の処理）
    if (autoSpin && autoSpinRef.current && !spinning && freeSpins === 0 && !bonusRound) {
      console.log('連続スピン自動再開の条件をチェック:', {
        autoSpin,
        autoSpinRefCurrent: autoSpinRef.current,
        spinning,
        freeSpins,
        bonusRound,
        autoSpinCount: autoSpinCountRef.current,
        maxAutoSpins
      })
      
      // 連続スピンが残っている場合のみ自動実行
      if (autoSpinCountRef.current < maxAutoSpins) {
        console.log(`連続スピン自動継続: ${autoSpinCountRef.current}/${maxAutoSpins}`)
        const timer = setTimeout(() => {
          if (autoSpinRef.current && !spinning && freeSpins === 0 && betAmount <= currentBalanceRef.current) {
            console.log('連続スピン自動継続実行')
            spin()
          }
        }, 2000) // 2秒後に自動実行
        
        return () => clearTimeout(timer)
      }
    }
  }, [autoSpin, spinning, freeSpins, bonusRound, maxAutoSpins, pausedAutoSpinCount, pausedMaxAutoSpンス])

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

  // ペイライン判定（5リール×1行の正しい実装）
  const checkPaylines = (reels) => {
    // 5リール×1行スロットでは、1つのペイラインのみ存在
    // reelsは[シンボル0, シンボル1, シンボル2, シンボル3, シンボル4]の配列
    
    let totalMultiplier = 0
    let winningLines = []

    // メインペイライン（左から右への連続一致判定）
    const lineMultiplier = calculateLineWin(reels)
    
    if (lineMultiplier > 0) {
      totalMultiplier += lineMultiplier
      winningLines.push({ line: 1, multiplier: lineMultiplier })
    }

    return { totalMultiplier, winningLines }
  }

  // ライン勝利計算（プレイヤー有利版）
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

    // 3つ以上連続している場合のみ勝利（プレイヤー有利版）
    if (consecutiveCount >= 3) {
      const symbol = symbols[firstSymbol]
      const baseMultiplier = symbol.value
      
      // 連続数に応じて倍率アップ（調整版）
      let countMultiplier = 1
      if (consecutiveCount === 5) countMultiplier = 20     // 5つ揃い：20倍
      else if (consecutiveCount === 4) countMultiplier = 8 // 4つ揃い：8倍
      else if (consecutiveCount === 3) countMultiplier = 3 // 3つ揃い：3倍
      
      const winAmount = baseMultiplier * countMultiplier
      console.log(`Win: ${symbol.symbol} x${consecutiveCount} = ${winAmount}`)
      return winAmount
    }

    console.log('No win - insufficient consecutive symbols')
    return 0
  }

  // ボーナス判定（上位3シンボルでボーナス発生）
  const checkBonus = (reels) => {
    // フリースピン中は新しいボーナスを発生させない
    if (freeSpins > 0 || bonusRound) {
      return false
    }
    
    const bonusSymbols = reels.filter(s => s <= 2).length // 💎、🔥、⭐（上位3シンボル）
    if (bonusSymbols >= 3) {
      console.log(`ボーナス発生！bonusSymbols: ${bonusSymbols}`)
      setFreeSpins(5)
      setBonusRound(true)
      setMessage('ボーナス発生！フリースピン5回獲得！')
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
    
    if (currentBet > currentBalanceRef.current) {
      setMessage('残高が不足しています。')
      setAutoSpin(false)
      setAutoSpinCount(0)
      return
    }

    setSpinning(true)
    const spinMessage = freeSpins > 0 
      ? `フリースピン中... (残り${freeSpins}回)`
      : autoSpinRef.current 
        ? `連続スピン中... (${autoSpinCount + 1}/${maxAutoSpins})`
        : 'スピン中...'
    setMessage(spinMessage)
    setLastWin(0)

    // フリースピンでない場合のみ残高を減らす
    if (freeSpins === 0) {
      const newBalance = currentBalanceRef.current - currentBet
      console.log('🎯 高オッズスロット: 残高減算', {
        oldBalance: currentBalanceRef.current,
        betAmount: currentBet,
        newBalance: newBalance
      })
      
      try {
        onUpdateBalance(newBalance)
        currentBalanceRef.current = newBalance
        console.log('✅ 高オッズスロット: 残高減算成功')
      } catch (error) {
        console.error('❌ 高オッズスロット: 残高減算失敗:', error)
        setSpinning(false)
        setMessage('残高更新に失敗しました')
        return
      }
    }
    // フリースピンの減算は checkResult() で結果確定後に行う

    // スピンアニメーション（連続スピン時は短縮）
    const spinDuration = (autoSpin && freeSpins === 0) ? 1500 : 3000 + Math.random() * 1000
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
    console.log('=== 高オッズcheckResult関数開始 ===')
    console.log(`autoSpin状態: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}`)
    console.log(`autoSpinCount: ${autoSpinCount}, maxAutoSpins: ${maxAutoSpins}`)
    console.log(`freeSpins: ${freeSpins}`)
    console.log('spinning状態をfalseに設定')
    setSpinning(false) // 確実にspinning状態を解除
    
    const { totalMultiplier, winningLines } = checkPaylines(finalReels)
    const bonusTriggered = checkBonus(finalReels)
    
    // フリースピン時もオリジナルのベット額で計算
    let winAmount = originalBetAmount * totalMultiplier * multiplier

    if (totalMultiplier > 0) {
      setLastWin(winAmount)
      console.log('🎯 高オッズスロット: 勝利金追加', {
        currentBalance: currentBalanceRef.current,
        winAmount: winAmount,
        newBalance: currentBalanceRef.current + winAmount
      })
      
      try {
        onUpdateBalance(currentBalanceRef.current + winAmount)
        // 内部残高も更新
        currentBalanceRef.current = currentBalanceRef.current + winAmount
        console.log('✅ 高オッズスロット: 勝利金追加成功')
      } catch (error) {
        console.error('❌ 高オッズスロット: 勝利金追加失敗:', error)
        setMessage('勝利金の追加に失敗しました')
      }
      
      if (!autoSpinRef.current || freeSpins > 0) {
        // 連続スピン中でない場合、またはフリースピン中の場合のみメッセージを表示
        if (totalMultiplier >= 500) {
          setMessage(`🎉 メガウィン！ ${winAmount.toLocaleString()}コイン獲得！ 🎉`)
        } else if (totalMultiplier >= 100) {
          setMessage(`💎 ビッグウィン！ ${winAmount.toLocaleString()}コイン獲得！ 💎`)
        } else if (totalMultiplier >= 50) {
          setMessage(`👑 グレートウィン！ ${winAmount.toLocaleString()}コイン獲得！ 👑`)
        } else {
          setMessage(`⭐ ウィン！ ${winAmount.toLocaleString()}コイン獲得！ ⭐`)
        }
      }
    } else if (bonusTriggered) {
      setMessage('🎰 ボーナスラウンド開始！フリースピン5回！ 🎰')
    } else if (!autoSpinRef.current || freeSpins > 0) {
      const defaultMessage = freeSpins > 0 ? `フリースピン残り: ${freeSpins}回` : '残念！もう一度挑戦してください。'
      setMessage(defaultMessage)
    }

    console.log(`=== 高オッズ連続スピン条件チェック ===`)
    console.log(`autoSpin: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}, freeSpins: ${freeSpins}`)
    console.log(`pausedAutoSpin: ${pausedAutoSpin}, bonusTriggered: ${bonusTriggered}`)
    
    // ボーナス発生時に連続スピンを一時停止（フリースピンがセットされる前にキャッチ）
    if (bonusTriggered && autoSpinRef.current && !pausedAutoSpinRef.current) {
      console.log(`=== ボーナス発生により連続スピンを一時停止 ===`)
      console.log(`保存する値 - pausedAutoSpinCount: ${autoSpinCountRef.current}, pausedMaxAutoSpins: ${maxAutoSpinsRef.current}`)
      setPausedAutoSpin(true)
      setPausedAutoSpinCount(autoSpinCountRef.current)
      setPausedMaxAutoSpins(maxAutoSpinsRef.current) // refの値を使用
      pausedAutoSpinRef.current = true
      setMessage('🎰 ボーナスラウンド開始！フリースピン5回！ 🎰')
      return // 早期リターンでこれ以上の処理を停止
    }
    
    // フリースピン中の自動回転はuseEffectで処理（重複を避けるためコメントアウト）
    // if (freeSpins > 0 && pausedAutoSpinRef.current && !spinning) {
    //   console.log(`=== フリースピン中、次のフリースピンをスケジュール ===`)
    //   console.log(`現在のfreeSpins: ${freeSpins}`)
    //   setTimeout(() => {
    //     console.log(`=== フリースピンタイマー実行 ===`)
    //     console.log(`現在のfreeSpins（タイマー内）: ${freeSpins}, spinning: ${spinning}`)
    //     if (freeSpins > 0 && !spinning) {
    //       console.log(`=== 次のフリースピン実行 ===`)
    //       spin()
    //     }
    //   }, 2500) // 2.5秒後に次のフリースピン
    //   return
    // }
    
    // フリースピン終了は減算後にuseEffectで検出・処理される
    
    // 連続スピンの処理（フリースピン中は除く） - refの値を使用
    if (autoSpinRef.current && freeSpins === 0) {
      const newCount = autoSpinCountRef.current + 1
      console.log(`=== 高オッズ連続スピン処理開始 ===`)
      console.log(`現在のカウント: ${autoSpinCountRef.current}, 新しいカウント: ${newCount}, 最大回数: ${maxAutoSpinsRef.current}`)
      console.log(`autoSpin状態: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}`)
      setAutoSpinCount(newCount)
      autoSpinCountRef.current = newCount
      if (newCount >= maxAutoSpinsRef.current) {
        console.log(`連続スピン終了: ${newCount} >= ${maxAutoSpinsRef.current}`)
        setAutoSpin(false)
        autoSpinRef.current = false
        setAutoSpinCount(0)
        autoSpinCountRef.current = 0
        setMessage(`連続スピン完了！ ${maxAutoSpinsRef.current}回実行しました。`)
      } else {
        setMessage(`連続スピン中... (${newCount}/${maxAutoSpinsRef.current})`)
        console.log(`次のスピンをスケジュール: ${newCount}/${maxAutoSpンス}`)
        const shouldContinue = newCount < maxAutoSpinsRef.current && autoSpinRef.current && freeSpins === 0
        if (shouldContinue) {
          setTimeout(() => {
            console.log(`=== 高オッズタイマー実行 ===`)
            console.log(`現在の残高: ${currentBalanceRef.current}, ベット額: ${betAmount}`)
            console.log(`autoSpin状態（タイマー内）: ${autoSpinRef.current}`)
            console.log(`現在のカウント（タイマー内）: ${autoSpinCountRef.current}, 最大回数: ${maxAutoSpンス}`)
            console.log(`フリースピン状態: ${freeSpins}`)
            if (betAmount <= currentBalanceRef.current && autoSpinRef.current && autoSpinCountRef.current < maxAutoSpinsRef.current && freeSpins === 0) {
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
              } else if (freeSpins > 0) {
                setMessage('フリースピン開始により連続スピンを停止しました。')
              } else {
                setMessage(`連続スピン完了！`)
              }
            }
          }, 1500)
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
      console.log(`高オッズ連続スピン処理をスキップ（autoSpin: ${autoSpin}, autoSpinRef.current: ${autoSpinRef.current}, freeSpins: ${freeSpins}）`)
    }

    // フリースピン終了チェック（減算前に1の場合、減算後に0になる）
    if (freeSpins === 1 && bonusRound) {
      if (pausedAutoSpinRef.current) {
        // 連続スピンが一時停止中の場合は、フリースピン終了後の再開処理で処理される
        console.log(`=== フリースピン終了（連続スピン一時停止中） ===`)
      } else {
        // 通常のフリースピン終了
        setBonusRound(false)
        setMessage('ボーナスラウンド終了！')
      }
    }

    // ゲーム履歴に追加
    const isFreeSpin = freeSpins > 0 || (bonusRound && originalBetAmount === 0);
    const newHistory = {
      reels: finalReels,
      bet: isFreeSpin ? 0 : originalBetAmount,
      win: winAmount,
      multiplier: totalMultiplier,
      winningLines: winningLines,
      timestamp: new Date().toLocaleTimeString(),
      isFreeSpin: isFreeSpin
    }
    setGameHistory(prev => [newHistory, ...prev.slice(0, 4)])

    // ゲーム記録（安全な方法で）
    if (onRecordGame && currentUser?.id) {
      console.log('🎯 高オッズスロット: ゲーム履歴記録開始', {
        userId: currentUser.id,
        gameType: 'high_odds_slot',
        betAmount: originalBetAmount,
        winAmount: winAmount,
        result: winAmount > originalBetAmount ? 'win' : 'lose'
      })
      
      try {
        // オブジェクト形式で個別パラメータとして渡す
        onRecordGame({
          gameType: 'high_odds_slot',
          betAmount: originalBetAmount,
          winAmount: winAmount,
          result: winAmount > originalBetAmount ? 'win' : 'lose'
        })
        console.log('✅ 高オッズスロット: ゲーム履歴記録成功')
      } catch (error) {
        console.error('❌ 高オッズスロット: ゲーム履歴記録失敗:', error)
      }
    } else {
      console.warn('⚠️ 高オッズスロット: ゲーム履歴記録スキップ', {
        onRecordGame: !!onRecordGame,
        userId: currentUser?.id
      })
    }

    // フリースピンの場合は回数を減算（処理の最後に実行）
    if (freeSpins > 0) {
      console.log(`フリースピン減算前: ${freeSpins}`)
      setFreeSpins(prev => {
        const newCount = prev - 1
        console.log(`フリースピン減算後: ${newCount}`)
        return newCount
      })
    }
  }

  // 連続スピン制御関数
  const startAutoSpin = (count) => {
    if (spinning || autoSpin || freeSpins > 0) return
    if (currentBalanceRef.current < betAmount) {
      setMessage('残高が不足しています。')
      return
    }
    
    console.log(`=== 高オッズ連続スピン開始 ===`)
    console.log(`回数: ${count}回`)
    
    // 前回の一時停止状態をリセット
    setPausedAutoSpin(false)
    setPausedAutoSpinCount(0)
    setPausedMaxAutoSpンス(0)
    pausedAutoSpinRef.current = false
    
    setAutoSpin(true)
    autoSpinRef.current = true
    setAutoSpinCount(0)
    autoSpinCountRef.current = 0
    setMaxAutoSpins(count)
    maxAutoSpinsRef.current = count // refも更新
    spin()
  }

  const stopAutoSpin = () => {
    console.log(`=== 高オッズ連続スピン手動停止 ===`)
    setAutoSpin(false)
    autoSpinRef.current = false
    setAutoSpinCount(0)
    autoSpinCountRef.current = 0
    
    // 一時停止状態もクリア
    setPausedAutoSpin(false)
    pausedAutoSpinRef.current = false
    setPausedAutoSpinCount(0)
    setPausedMaxAutoSpンス(0)
    
    setMessage('連続スピンを停止しました。')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900 p-2 xs:p-4">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col xs:flex-row justify-between items-center mb-4 xs:mb-6 gap-2 xs:gap-0">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 xs:px-4 rounded-lg transition-colors duration-300 text-sm xs:text-base"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-yellow-300 text-center">💸 高オッズスロット 💸</h1>
          <div className="text-white text-center xs:text-right">
            <div className="text-sm xs:text-lg font-bold">👤 {currentUser.username}</div>
            <div className="text-yellow-300 font-bold text-sm xs:text-base">💰 {currentUser.balance.toLocaleString()}コイン</div>
          </div>
        </div>

        {/* ボーナス情報 */}
        {bonusRound && (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-3 xs:p-4 mb-4 xs:mb-6 text-center">
            <h2 className="text-lg xs:text-2xl font-bold text-white">🎰 ボーナスラウンド 🎰</h2>
            <p className="text-white text-sm xs:text-base">フリースピン残り: {freeSpins}回</p>
          </div>
        )}

        {/* スロットマシン */}
        <div className="bg-gradient-to-b from-yellow-400 to-amber-600 rounded-lg p-4 xs:p-6 sm:p-8 mb-4 xs:mb-6 shadow-2xl">
          <div className="bg-black rounded-lg p-3 xs:p-4 sm:p-6 mb-4 xs:mb-6">
            <div className="flex justify-center space-x-1 xs:space-x-2 sm:space-x-3 overflow-x-auto">
              {reels.map((reelIndex, index) => (
                <div key={index} className={`w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 bg-gradient-to-b from-yellow-100 to-yellow-300 rounded-lg flex items-center justify-center text-lg xs:text-2xl sm:text-3xl font-bold border-2 xs:border-4 border-yellow-500 shadow-lg flex-shrink-0 ${
                  spinning ? 'animate-pulse' : ''
                }`}>
                  {symbols[reelIndex].symbol}
                </div>
              ))}
            </div>
          </div>

          {/* コントロールパネル */}
          <div className="bg-black/50 rounded-lg p-3 xs:p-4">
            <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-3 xs:mb-4 gap-2 xs:gap-0">
              <div className="text-white">
                <label htmlFor="bet-amount" className="text-sm xs:text-lg font-bold">ベット額: {betAmount.toLocaleString()}コイン</label>
                {freeSpins > 0 && <span className="text-yellow-300 ml-2 xs:ml-4 text-sm xs:text-base">フリースピン中！</span>}
              </div>
              <div className="flex flex-wrap gap-1 xs:gap-2" role="group" aria-label="ベット額選択">
                {!freeSpins && (
                  <>
                    <button
                      id="bet-500"
                      onClick={() => setBetAmount(500)}
                      className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-white text-sm xs:text-base ${betAmount === 500 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額500コイン"
                    >
                      500
                    </button>
                    <button
                      id="bet-1000"
                      onClick={() => setBetAmount(1000)}
                      className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-white text-sm xs:text-base ${betAmount === 1000 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額1000コイン"
                    >
                      1000
                    </button>
                    <button
                      id="bet-2000"
                      onClick={() => setBetAmount(2000)}
                      className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-white text-sm xs:text-base ${betAmount === 2000 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額2000コイン"
                    >
                      2000
                    </button>
                    <button
                      id="bet-5000"
                      onClick={() => setBetAmount(5000)}
                      className={`px-2 py-1 xs:px-3 xs:py-2 rounded text-white text-sm xs:text-base ${betAmount === 5000 ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-700'}`}
                      aria-label="ベット額5000コイン"
                    >
                      5000
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 xs:gap-4">
              {/* メインスピンボタン */}
              <button
                id="main-spin-button"
                onClick={spin}
                disabled={spinning || (!freeSpins && betAmount > currentUser.balance) || autoSpinRef.current}
                className="px-6 py-3 xs:px-8 xs:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg xs:text-xl rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                aria-label={spinning ? 'スピン中' : freeSpins > 0 ? 'フリースピン実行' : 'スピン実行'}
              >
                {spinning ? 'スピン中...' : freeSpins > 0 ? 'フリースピン' : autoSpinRef.current ? '連続スピン中' : 'スピン'}
              </button>
              
              {/* 連続スピンコントロール */}
              <div className="flex flex-col items-center gap-2">
                {!autoSpinRef.current && !pausedAutoSpinRef.current ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => startAutoSpin(10)}
                      disabled={spinning || betAmount > currentUser.balance || freeSpins > 0}
                      className={`px-3 py-2 rounded font-medium text-sm ${
                        spinning || betAmount > currentUser.balance || freeSpins > 0
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      連続10回
                    </button>
                    <button
                      onClick={() => startAutoSpin(25)}
                      disabled={spinning || betAmount > currentUser.balance || freeSpins > 0}
                      className={`px-3 py-2 rounded font-medium text-sm ${
                        spinning || betAmount > currentUser.balance || freeSpins > 0
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      連続25回
                    </button>
                    <button
                      onClick={() => startAutoSpin(50)}
                      disabled={spinning || betAmount > currentUser.balance || freeSpins > 0}
                      className={`px-3 py-2 rounded font-medium text-sm ${
                        spinning || betAmount > currentUser.balance || freeSpins > 0
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      連続50回
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-white text-sm bg-blue-600/30 px-3 py-1 rounded">
                      {pausedAutoSpinRef.current 
                        ? `連続スピン一時停止: ${pausedAutoSpinCount}/${pausedAutoSpンス}` +
                          (freeSpins > 0 ? ` (フリースピン残り${freeSpins}回)` : '')
                        : `連続スピン: ${autoSpinCount}/${maxAutoSpンス}`
                      }
                    </div>
                    <button
                      onClick={stopAutoSpin}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm"
                    >
                      {pausedAutoSpinRef.current ? '連続スピン停止' : '停止'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 最後の勝利金 */}
          {lastWin > 0 && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 xs:py-3 rounded-lg mt-3 xs:mt-4">
              <span className="text-lg xs:text-2xl font-bold">🎉 {lastWin.toLocaleString()}コイン獲得！ 🎉</span>
            </div>
          )}
        </div>

        {/* メッセージエリア */}
        {message && (
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 xs:p-4 mb-4 xs:mb-6">
            <p className="text-white text-center text-sm xs:text-lg font-bold">{message}</p>
          </div>
        )}

        {/* ペイアウトテーブルとゲーム履歴 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
          {/* ペイアウトテーブル */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 xs:p-4">
            <h3 className="text-white font-bold mb-3 xs:mb-4 text-center text-sm xs:text-base">ペイアウトテーブル</h3>
            <div className="space-y-1 xs:space-y-2 text-xs xs:text-sm">
              <div className="text-yellow-300 font-bold border-b border-white/30 pb-1 xs:pb-2">3連続以上で勝利</div>
              {symbols.map((symbol, index) => (
                <div key={index} className="flex justify-between text-white">
                  <span>{symbol.symbol} {symbol.name}</span>
                  <span className="text-yellow-300 font-bold">{symbol.value}倍</span>
                </div>
              ))}
              
              <div className="border-t border-white/30 pt-1 xs:pt-2 mt-1 xs:mt-2">
                <div className="text-white font-bold text-xs xs:text-sm">連続ボーナス</div>
                <div className="flex justify-between text-white text-xs">
                  <span>5つ連続</span>
                  <span className="text-yellow-300">基本倍率×5</span>
                </div>
                <div className="flex justify-between text-white text-xs">
                  <span>4つ連続</span>
                  <span className="text-yellow-300">基本倍率×3</span>
                </div>
                <div className="flex justify-between text-white text-xs">
                  <span>3つ連続</span>
                  <span className="text-yellow-300">基本倍率×1</span>
                </div>
                <div className="border-t border-white/30 pt-1 mt-1">
                  <div className="flex justify-between text-white text-xs">
                    <span>{symbols[0].symbol}{symbols[1].symbol}{symbols[2].symbol} 3個以上</span>
                    <span className="text-purple-300">フリースピン5回</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ゲーム履歴 */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 xs:p-4">
            <h3 className="text-white font-bold mb-3 xs:mb-4 text-center text-sm xs:text-base">最近のゲーム</h3>
            <div className="space-y-1 xs:space-y-2 text-xs xs:text-sm">
              {gameHistory.length === 0 ? (
                <p className="text-gray-300 text-center">まだゲームをプレイしていません</p>
              ) : (
                gameHistory.map((game, index) => (
                  <div key={index} className="bg-white/5 rounded p-2">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-1">
                        {game.reels.map((reelIndex, i) => (
                          <span key={i} className="text-sm xs:text-lg">{symbols[reelIndex].symbol}</span>
                        ))}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold text-xs xs:text-sm ${game.win > 0 ? 'text-green-300' : 'text-red-300'}`}>
                          {game.isFreeSpin
                            ? (game.win > 0 ? `+${game.win.toLocaleString()}` : '+0')
                            : (game.win > 0 ? `+${game.win.toLocaleString()}` : `-${game.bet.toLocaleString()}`)
                          }
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
