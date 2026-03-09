import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { type ReactNode } from 'react'
import { useAuth } from './AuthContext'

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Spin size="large" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
