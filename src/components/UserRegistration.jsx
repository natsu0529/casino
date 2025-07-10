import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const UserRegistration = ({ onBack, onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLogin, setIsLogin] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { signUp, signIn } = useAuth()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    if (isLogin) {
      // ログイン処理
      if (!formData.email || !formData.password) {
        setMessage('メールアドレスとパスワードを入力してください。')
        setLoading(false)
        return
      }

      const { data, error } = await signIn(formData.email, formData.password)
      
      if (error) {
        setMessage(`ログインエラー: ${error.message}`)
      } else {
        setMessage('ログインに成功しました！')
        setTimeout(() => {
          onLogin(data.user)
        }, 1000)
      }
    } else {
      // 新規登録処理
      if (!formData.username || !formData.email || !formData.password) {
        setMessage('すべての項目を入力してください。')
        setLoading(false)
        return
      }
      
      if (formData.password !== formData.confirmPassword) {
        setMessage('パスワードが一致しません。')
        setLoading(false)
        return
      }
      
      if (formData.password.length < 6) {
        setMessage('パスワードは6文字以上で入力してください。')
        setLoading(false)
        return
      }
      
      const { data, error } = await signUp(formData.email, formData.password, formData.username)
      
      if (error) {
        setMessage(`登録エラー: ${error.message}`)
      } else {
        setMessage('ユーザー登録が完了しました！確認メールをチェックしてください。')
        setTimeout(() => {
          if (data.user) {
            onLogin(data.user)
          }
        }, 2000)
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isLogin ? 'ログイン' : 'ユーザー登録'}
          </h1>
          <p className="text-gray-300">
            {isLogin ? 'アカウントにログインしてください' : '新しいアカウントを作成してください'}
          </p>
        </div>

        {/* フォーム */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="username" className="block text-white font-medium mb-2">
                  ユーザー名
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ユーザー名を入力"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-white font-medium mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="メールアドレスを入力"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white font-medium mb-2">
                パスワード
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="パスワードを入力"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-white font-medium mb-2">
                  パスワード確認
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="パスワードを再入力"
                  required
                />
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-lg text-center ${
                message.includes('成功') || message.includes('完了') 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              {loading ? '処理中...' : (isLogin ? 'ログイン' : 'アカウント作成')}
            </button>
          </form>

          {/* モード切り替え */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setMessage('')
                setFormData({ username: '', email: '', password: '', confirmPassword: '' })
              }}
              className="text-blue-300 hover:text-blue-200 underline"
            >
              {isLogin ? '新規アカウントを作成' : '既存アカウントでログイン'}
            </button>
          </div>

          {/* 戻るボタン */}
          <div className="mt-4 text-center">
            <button
              onClick={onBack}
              className="text-gray-300 hover:text-white underline"
            >
              ホームに戻る
            </button>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            ※ このアプリは仮想通貨を使用しており、実際のお金は使用されません
          </p>
        </div>
      </div>
    </div>
  )
}

export default UserRegistration

