import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const res = await api.get('/auth/me')
                    setUser(res.data.user)
                } catch (error) {
                    localStorage.removeItem('token')
                    setToken(null)
                }
            }
            setLoading(false)
        }
        initAuth()
    }, [token])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        const { token: newToken, user: userData } = res.data
        localStorage.setItem('token', newToken)
        setToken(newToken)
        setUser(userData)
        return userData
    }

    const logout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
    }

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
