import React from 'react'

const BridgeGame = ({ onNavigateHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-4xl font-bold text-white">🃏 コントラクトブリッジ 🃏</h1>
          <div className="w-20"></div> {/* スペーサー */}
        </div>

        {/* Coming Soon メインコンテンツ */}
        <div className="bg-gradient-to-br from-purple-800/50 to-indigo-800/50 backdrop-blur-md rounded-lg p-12 text-center">
          <div className="mb-8">
            <div className="text-8xl mb-6">🚧</div>
            <h2 className="text-5xl font-bold text-white mb-6">Coming Soon</h2>
            <p className="text-2xl text-purple-200 mb-8">
              コントラクトブリッジは現在開発中です
            </p>
          </div>

          <div className="bg-black/20 rounded-lg p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">予定機能</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg text-purple-100">
              <div className="bg-purple-700/30 rounded-lg p-4">
                <div className="text-xl mb-2">🎯</div>
                <div>本格的なビディングシステム</div>
              </div>
              <div className="bg-purple-700/30 rounded-lg p-4">
                <div className="text-xl mb-2">🤖</div>
                <div>AIパートナー対戦</div>
              </div>
              <div className="bg-purple-700/30 rounded-lg p-4">
                <div className="text-xl mb-2">📊</div>
                <div>スコア計算システム</div>
              </div>
              <div className="bg-purple-700/30 rounded-lg p-4">
                <div className="text-xl mb-2">🏆</div>
                <div>トーナメントモード</div>
              </div>
            </div>
          </div>

          <div className="text-lg text-purple-200 mb-8">
            しばらくお待ちください。より楽しいゲーム体験をお届けします！
          </div>

          <button
            onClick={() => onNavigateHome()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105"
          >
            他のゲームを楽しむ
          </button>
        </div>

        {/* フッター情報 */}
        <div className="text-center mt-8">
          <p className="text-purple-300 text-sm">
            ブリッジのリリース予定についてご質問がございましたら、お気軽にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}

export default BridgeGame
