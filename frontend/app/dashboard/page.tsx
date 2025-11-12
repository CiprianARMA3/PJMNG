'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }
      
      // Fetch user data from public.users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', session.user.id)
        .single()
      
      if (error || !userData) {
        router.push('/auth/login')
        return
      }

      // Check if profile needs completion
      if (!userData.name || !userData.surname) {
        router.push('/auth/complete-profile')
        return
      }

      setUser(session.user)
      setUserData(userData)
      setLoading(false)
    }

    checkAuthAndProfile()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/auth/login')
        } else if (session) {
          // Re-check profile completion on auth state change
          const { data: userData } = await supabase
            .from('users')
            .select('name, surname')
            .eq('auth_id', session.user.id)
            .single()

          if (!userData?.name || !userData?.surname) {
            router.push('/auth/complete-profile')
          } else {
            setUser(session.user)
            setLoading(false)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-4">
            {userData?.metadata?.profile_picture ? (
              <img
                src={userData.metadata.profile_picture}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm">No PFP</span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">
                Welcome, {userData?.name} {userData?.surname}!
              </h2>
              <p className="text-gray-600">{user?.email}</p>
              <p className="text-sm text-green-600 mt-1">✓ Profile completed</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-blue-700">
              User ID: {user?.id}
            </p>
            {userData?.metadata?.profile_picture && (
              <p className="text-blue-700 mt-2">
                Profile Picture: {userData.metadata.profile_picture}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}