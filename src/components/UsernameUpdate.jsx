import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

const UsernameUpdate = ({ onClose }) => {
  const { user } = useAuth()
  const { profile, updateUsername } = useProfile(user?.id)
  const [newUsername, setNewUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newUsername.trim()) {
      setMessage('ユーザー名を入力してください')
      return
    }

    setLoading(true)
    setMessage('')

    const { data, error } = await updateUsername(newUsername.trim())
    
    if (error) {
      setMessage(`エラー: ${error.message}`)
    } else {
      setMessage('ユーザー名を更新しました！')
      setTimeout(() => {
        onClose()
      }, 1500)
    }
    
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">ユーザー名の変更</h2>
        
        <div className="mb-4">
          <p className="text-gray-300 text-sm mb-2">現在のユーザー名:</p>
          <p className="text-white font-semibold">{profile?.username}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newUsername" className="block text-white font-medium mb-2">
              新しいユーザー名
            </label>
            <input
              type="text"
              id="newUsername"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="新しいユーザー名を入力"
              required
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-center ${
              message.includes('エラー') 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {message}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
            >
              {loading ? '更新中...' : '更新'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsernameUpdate
