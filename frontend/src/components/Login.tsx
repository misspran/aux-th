import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from 'antd'
import { login } from '../api'

export function Login() {
  const [username, setUserName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim()) return
    setLoading(true)
    try {
      const user = await login(username.trim())
      sessionStorage.setItem('userName', user.username)
      sessionStorage.setItem('userId', String(user.id))
      navigate('/board', { state: { username: user.username, userId: user.id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div  style={{display: 'grid', gridTemplateColumns: '1fr', gap: '10px', maxWidth: '600px',  margin: 'auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', justifyContent: 'center', alignItems: 'center'}}>
      <h3>Login</h3>
      <label htmlFor="username">Username:</label>
      <Input
        id="username"
        type="text"
        name="username"
        value={username}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="Enter your user name"
      />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <Button type="primary" onClick={handleSubmit} loading={loading} disabled={!username.trim()}>
        Login
      </Button>
    </div>
  )
}
