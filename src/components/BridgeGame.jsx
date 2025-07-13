import React from 'react'

const BridgeGame = ({ onNavigateHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-1 xs:p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col xs:flex-row justify-between items-center mb-2 xs:mb-4 sm:mb-6 gap-2 xs:gap-0">
          <button
            onClick={() => onNavigateHome()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 xs:px-3 xs:py-2 sm:px-4 sm:py-2 rounded-lg transition-colors duration-300 text-xs xs:text-sm sm:text-base order-1 xs:order-none"
          >
            ← ホームに戻る
          </button>
          <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white text-center order-2 xs:order-none">🃏 コントラクトブリッジ 🃏</h1>
          <div className="w-4 xs:w-16 sm:w-20 order-3 xs:order-none"></div> {/* スペーサー */}
        </div>

        {/* Coming Soon メインコンテンツ */}
        <div className="bg-gradient-to-br from-purple-800/50 to-indigo-800/50 backdrop-blur-md rounded-lg p-4 xs:p-6 sm:p-8 lg:p-12 text-center">
          <div className="mb-4 xs:mb-6 sm:mb-8">
            <div className="text-4xl xs:text-5xl sm:text-6xl lg:text-8xl mb-2 xs:mb-3 sm:mb-6">🚧</div>
            <h2 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 xs:mb-3 sm:mb-6">Coming Soon</h2>
            <p className="text-sm xs:text-base sm:text-lg lg:text-2xl text-purple-200 mb-4 xs:mb-6 sm:mb-8">
              コントラクトブリッジは現在開発中です
            </p>
          </div>

          <div className="bg-black/20 rounded-lg p-2 xs:p-3 sm:p-4 lg:p-6 mb-4 xs:mb-6 sm:mb-8">
            <h3 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 xs:mb-3 sm:mb-4">予定機能</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xs:gap-3 sm:gap-4 text-xs xs:text-sm sm:text-base lg:text-lg text-purple-100">
              <div className="bg-purple-700/30 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="text-sm xs:text-base sm:text-lg lg:text-xl mb-1 xs:mb-2">🎯</div>
                <div>本格的なビディングシステム</div>
              </div>
              <div className="bg-purple-700/30 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="text-sm xs:text-base sm:text-lg lg:text-xl mb-1 xs:mb-2">🤖</div>
                <div>AIパートナー対戦</div>
              </div>
              <div className="bg-purple-700/30 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="text-sm xs:text-base sm:text-lg lg:text-xl mb-1 xs:mb-2">📊</div>
                <div>スコア計算システム</div>
              </div>
              <div className="bg-purple-700/30 rounded-lg p-2 xs:p-3 sm:p-4">
                <div className="text-sm xs:text-base sm:text-lg lg:text-xl mb-1 xs:mb-2">🏆</div>
                <div>トーナメントモード</div>
              </div>
            </div>
          </div>

          <div className="text-sm xs:text-base sm:text-lg text-purple-200 mb-4 xs:mb-6 sm:mb-8">
            しばらくお待ちください。より楽しいゲーム体験をお届けします！
          </div>

          <button
            onClick={() => onNavigateHome()}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-4 xs:py-3 xs:px-6 sm:py-4 sm:px-8 rounded-lg text-sm xs:text-base sm:text-lg lg:text-xl transition-all duration-300 transform hover:scale-105"
          >
            他のゲームを楽しむ
          </button>
        </div>

        {/* フッター情報 */}
        <div className="text-center mt-4 xs:mt-6 sm:mt-8">
          <p className="text-purple-300 text-xs xs:text-sm">
            ブリッジのリリース予定についてご質問がございましたら、お気軽にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  )
}

export default BridgeGame
