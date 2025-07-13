import { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { UserNameWithTitle } from './TitleDisplay'

const MessageBoard = ({ currentUser, user }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { getMessages, postMessage } = useProfile(user?.id)

  // メッセージを取得
  useEffect(() => {
    if (!user?.id) return
    
    const fetchMessages = async () => {
      setLoading(true)
      try {
        const messageData = await getMessages(10) // 最新10件を取得
        setMessages(messageData || [])
      } catch (error) {
        console.error('Error fetching messages:', error)
      }
      setLoading(false)
    }
    
    fetchMessages()
    
    // 30秒ごとに自動更新
    const interval = setInterval(fetchMessages, 30000)
    return () => clearInterval(interval)
  }, [user?.id, getMessages]) // getMessagesをuseCallbackで安定化したので依存配列に含める

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) return
    if (!currentUser) {
      alert('メッセージを投稿するにはログインが必要です。')
      return
    }

    setSubmitting(true)
    try {
      await postMessage(newMessage.trim())
      setNewMessage('')
      
      // メッセージを再取得
      const messageData = await getMessages(10)
      setMessages(messageData || [])
    } catch (error) {
      console.error('Error posting message:', error)
      alert('メッセージの投稿に失敗しました。')
    }
    setSubmitting(false)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'たった今'
    if (diffInMinutes < 60) return `${diffInMinutes}分前`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`
    return date.toLocaleDateString('ja-JP')
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-4 text-center">
        💬 掲示板
      </h2>
      
      {/* メッセージ投稿フォーム */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力してください..."
              maxLength={200}
              className="flex-1 px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || !newMessage.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors duration-300"
            >
              {submitting ? '投稿中...' : '投稿'}
            </button>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {newMessage.length}/200文字
          </div>
        </form>
      )}

      {/* ログインしていない場合のメッセージ */}
      {!currentUser && (
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-300 text-center">
            メッセージを投稿するにはログインが必要です
          </p>
        </div>
      )}

      {/* メッセージ一覧 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2">メッセージを読み込み中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-300 py-8">
            <p>まだメッセージがありません</p>
            <p className="text-sm">最初のメッセージを投稿してみましょう！</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-white/5 rounded-lg p-4 border border-white/10"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold flex items-center">
                    👤 <UserNameWithTitle 
                      username={message.username} 
                      title={message.title} 
                    />
                  </span>
                  {message.balance && (
                    <span className="text-yellow-300 text-sm">
                      💰 {message.balance.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 text-sm">
                  {formatTimestamp(message.created_at)}
                </span>
              </div>
              <p className="text-white whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* 自動更新の表示 */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          自動更新: 30秒ごと
        </p>
      </div>
    </div>
  )
}

export default MessageBoard
