import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Crown, Star, Medal, Award, Trophy } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'

const ShopPage = ({ user, onNavigateHome }) => {
  const [purchasing, setPurchasing] = useState(null)
  const { profile, purchaseTitle } = useProfile(user?.id)

  const titles = [
    {
      name: '公爵',
      price: 10000000,
      icon: Crown,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      fontClass: 'font-serif text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent',
      description: '最高位の爵位。究極の威厳と栄光の象徴'
    },
    {
      name: '侯爵',
      price: 5000000,
      icon: Trophy,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
      fontClass: 'font-serif text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent',
      description: '高貴なる爵位。卓越した地位の証'
    },
    {
      name: '伯爵',
      price: 3000000,
      icon: Award,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      fontClass: 'font-serif text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent',
      description: '名誉ある爵位。優雅さと品格の象徴'
    },
    {
      name: '子爵',
      price: 1000000,
      icon: Medal,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      fontClass: 'font-serif text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent',
      description: '尊敬される爵位。社会的威信の証'
    },
    {
      name: '男爵',
      price: 500000,
      icon: Star,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 border-gray-200',
      fontClass: 'font-serif text-base font-medium bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent',
      description: '入門の爵位。新たなステータスの始まり'
    }
  ]

  const handlePurchase = async (title) => {
    if (!user) {
      alert('購入するにはログインが必要です。')
      return
    }

    if (profile?.balance < title.price) {
      alert('残高が不足しています。')
      return
    }

    if (profile?.title === title.name) {
      alert('すでにこの爵位を所有しています。')
      return
    }

    // より高い爵位を持っている場合は購入不可
    const currentTitleIndex = titles.findIndex(t => t.name === profile?.title)
    const newTitleIndex = titles.findIndex(t => t.name === title.name)
    
    if (currentTitleIndex !== -1 && currentTitleIndex < newTitleIndex) {
      alert('現在の爵位より低い爵位は購入できません。')
      return
    }

    const confirmed = window.confirm(
      `${title.name}を${title.price.toLocaleString()}コインで購入しますか？`
    )

    if (!confirmed) return

    setPurchasing(title.name)
    try {
      const result = await purchaseTitle(title.name, title.price)
      if (result.error) {
        alert('購入に失敗しました: ' + result.error.message)
      } else {
        alert(`${title.name}の購入が完了しました！`)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('購入に失敗しました。')
    } finally {
      setPurchasing(null)
    }
  }

  const formatBalance = (balance) => {
    return balance ? balance.toLocaleString() : '0'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      {/* ホームに戻るボタン */}
      <div className="max-w-6xl mx-auto mb-4">
        <Button 
          onClick={onNavigateHome}
          className="bg-gray-600 hover:bg-gray-700 text-white"
        >
          ← ホームに戻る
        </Button>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🏛️ 爵位ショップ
          </h1>
          <p className="text-gray-600 text-lg">
            爵位を購入して特別なステータスを手に入れよう
          </p>
          {profile && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-sm border">
              <p className="text-lg">
                残高: <span className="font-bold text-green-600">
                  {formatBalance(profile.balance)} コイン
                </span>
              </p>
              {profile.title && (
                <p className="text-lg mt-2">
                  現在の爵位: <span className={titles.find(t => t.name === profile.title)?.fontClass}>
                    {profile.title}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {titles.map((title) => {
            const Icon = title.icon
            const isOwned = profile?.title === title.name
            const canAfford = profile?.balance >= title.price
            const isCurrentlyPurchasing = purchasing === title.name

            return (
              <Card key={title.name} className={`${title.bgColor} transition-all duration-300 hover:shadow-lg ${isOwned ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-2">
                    <Icon className={`w-12 h-12 ${title.color}`} />
                  </div>
                  <CardTitle className={`text-2xl ${title.fontClass}`}>
                    {title.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {title.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-800">
                      {title.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">コイン</p>
                  </div>
                  
                  {isOwned ? (
                    <Badge variant="secondary" className="w-full py-2 bg-green-100 text-green-800">
                      所有中
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(title)}
                      disabled={!canAfford || isCurrentlyPurchasing || !user}
                      className={`w-full py-2 ${
                        canAfford 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isCurrentlyPurchasing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          購入中...
                        </div>
                      ) : !user ? (
                        'ログインが必要'
                      ) : !canAfford ? (
                        '残高不足'
                      ) : (
                        '購入'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">爵位について</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">特典</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• 名前に特別な爵位が表示されます</li>
                <li>• ランキングで目立つ表示になります</li>
                <li>• 掲示板でのコメントが豪華になります</li>
                <li>• 高位の爵位ほど高級感のあるフォントです</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">注意事項</h3>
              <ul className="text-gray-600 space-y-1">
                <li>• 爵位は一度購入すると永続的に保持されます</li>
                <li>• 上位の爵位を購入すると自動的にアップグレードされます</li>
                <li>• 購入後の返金はできません</li>
                <li>• 残高は各ゲームで獲得できます</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">爵位は段階的にしか購入できません。例えば、男爵保持者のみ子爵を購入できます。</p>
        </div>
      </div>
    </div>
  )
}

export default ShopPage
