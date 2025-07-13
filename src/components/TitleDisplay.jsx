import React from 'react'

const TitleDisplay = ({ title, className = "" }) => {
  if (!title) return null

  const getTitleStyle = (titleName) => {
    switch (titleName) {
      case '公爵':
        return 'font-serif text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm'
      case '侯爵':
        return 'font-serif text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent drop-shadow-sm'
      case '伯爵':
        return 'font-serif text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'
      case '子爵':
        return 'font-serif text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'
      case '男爵':
        return 'font-serif text-base font-medium bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent'
      default:
        return ''
    }
  }

  return (
    <span className={`${getTitleStyle(title)} ${className}`}>
      {title}
    </span>
  )
}

// ユーザー名と爵位を一緒に表示するコンポーネント
const UserNameWithTitle = ({ username, title, className = "" }) => {
  return (
    <span className={className}>
      {title && (
        <>
          <TitleDisplay title={title} />
          <span className="mx-1 text-gray-400">·</span>
        </>
      )}
      {username}
    </span>
  )
}

export { TitleDisplay, UserNameWithTitle }
