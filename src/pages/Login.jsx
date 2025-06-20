import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

const Login = () => {
  const { user, signIn, getRoleFromSubdomain } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const currentRole = getRoleFromSubdomain()

  // 既にログイン済みの場合はダッシュボードにリダイレクト
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError('ログインに失敗しました: ' + error.message)
      }
    } catch (err) {
      setError('ログインエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDescription = (role) => {
    switch (role) {
      case 'admin':
        return '案内所管理者'
      case 'staff':
        return '案内所スタッフ'
      case 'customer':
        return 'ホストクラブ担当者'
      default:
        return 'ユーザー'
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem' }}>
            ホストクラブ案内所システム
          </h1>
          <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
            {getRoleDescription(currentRole)} ログイン
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">メールアドレス</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">パスワード</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#6c757d' }}>
          <p><strong>開発用テスト:</strong></p>
          <p>URL に <code>?role=admin</code> または <code>?role=staff</code> または <code>?role=customer</code> を追加してロールをテストできます。</p>
        </div>
      </div>
    </div>
  )
}

export default Login 