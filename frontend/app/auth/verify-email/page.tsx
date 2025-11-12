'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const [checking, setChecking] = useState(true)
  const [message, setMessage] = useState('Waiting for email verification...')
  const [userId, setUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState('')
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // If we're already redirecting, don't start the verification process again
    if (isRedirecting) return

    const pendingUserId = sessionStorage.getItem('pending_verification_user_id')
    
    console.log('🔍 Pending user ID from session storage:', pendingUserId)
    setDebugInfo(`UserID: ${pendingUserId || 'Not found'}`)
    
    if (!pendingUserId) {
      console.log('❌ No pending user ID found, checking if user is already verified...')
      
      // Check if user might already be verified and we just lost the session storage
      checkIfAlreadyVerified()
      return
    }

    setUserId(pendingUserId)
    checkEmailVerification(pendingUserId)
  }, [router, isRedirecting])

  const checkIfAlreadyVerified = async () => {
    try {
      console.log('🔍 Checking if user is already verified...')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email_confirmed_at) {
        console.log('✅ User is already verified, redirecting to complete profile')
        handleSuccessfulVerification(user.id)
        return
      }
      
      // If not verified and no pending ID, redirect to register
      setMessage('No verification session found. Please register again.')
      setTimeout(() => {
        router.push('/auth/register')
      }, 3000)
    } catch (error) {
      console.error('Error checking verification status:', error)
      router.push('/auth/register')
    }
  }

  const forceSessionRefresh = async () => {
    try {
      console.log('🔄 Force refreshing session...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
      }
      
      if (!session) {
        console.log('⚠️ No active session found, attempting to restore...')
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('User error:', userError)
        }
        
        console.log('👤 Direct user fetch:', user?.id, 'Email confirmed:', user?.email_confirmed_at)
        
        setDebugInfo(`No session. User: ${user?.email_confirmed_at || 'null'}`)
        return { session: null, user }
      }
      
      console.log('📧 Session found - email confirmed:', session.user.email_confirmed_at)
      setDebugInfo(`Session: ${session.user.email_confirmed_at || 'null'}`)
      
      return { session, user: session.user }
    } catch (error) {
      console.error('Error refreshing session:', error)
      return { session: null, user: null }
    }
  }

  const handleSuccessfulVerification = async (verifiedUserId: string) => {
    if (isRedirecting) {
      console.log('🛑 Already redirecting, skipping...')
      return
    }

    setIsRedirecting(true)
    setChecking(false)
    
    console.log('🎉 Email verified! Updating database...')
    setMessage('✅ Email verified successfully! Updating your account...')
    
    // Update user record to mark as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('auth_id', verifiedUserId)

    if (updateError) {
      console.error('❌ Failed to update user:', updateError)
    } else {
      console.log('📊 User database record updated successfully')
    }
    
    // Clear the pending verification from storage
    sessionStorage.removeItem('pending_verification_user_id')
    localStorage.removeItem('pending_verification_user_id')
    
    setMessage('✅ Email verified successfully! Redirecting...')
    
    // Use replace instead of push to prevent going back to this page
    setTimeout(() => {
      console.log('🚀 Redirecting to complete profile...')
      router.replace('/auth/complete-profile')
    }, 1500)
  }

  const checkEmailVerification = async (userId: string) => {
    let verified = false
    let attempts = 0
    const maxAttempts = 60

    console.log('🚀 Starting email verification checks...')

    const checkInterval = setInterval(async () => {
      // If we're already redirecting, stop checking
      if (isRedirecting) {
        clearInterval(checkInterval)
        return
      }

      attempts++
      
      try {
        console.log(`🔍 Verification check ${attempts}/${maxAttempts}`)
        
        // Force refresh session and get latest auth state
        const { session, user } = await forceSessionRefresh()
        
        // Check if email is confirmed in either location
        const emailConfirmed = session?.user?.email_confirmed_at || user?.email_confirmed_at
        
        console.log('📧 Email confirmed status:', emailConfirmed)
        
        if (emailConfirmed) {
          verified = true
          console.log('✅ Email verification confirmed!')
        } else {
          // Alternative method: Check database directly
          console.log('🔄 Trying alternative verification check...')
          
          const { data: userData, error: dbError } = await supabase
            .from('users')
            .select('email_verified, auth_id')
            .eq('auth_id', userId)
            .single()
            
          if (!dbError && userData?.email_verified) {
            console.log('✅ Database shows email verified!')
            verified = true
          }
        }

        if (verified) {
          clearInterval(checkInterval)
          await handleSuccessfulVerification(userId)
          return
        }

        setMessage(`Waiting for email verification... (${attempts}/60 checks)`)
        console.log(`⏳ Verification check ${attempts}: Not verified yet`)

        if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          setChecking(false)
          setMessage('⏰ Verification timeout. Please check your email and click the link, then try signing in.')
          console.log('🛑 Maximum verification attempts reached')
        }
      } catch (error) {
        console.error('❌ Error checking verification:', error)
        setMessage('Error checking verification status. Please try the manual check.')
        setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }, 5000)

    return () => {
      console.log('🧹 Cleaning up verification interval')
      clearInterval(checkInterval)
    }
  }

  const handleManualCheck = async () => {
    if (!userId) {
      setMessage('❌ No user ID found. Please try registering again.')
      return
    }
    
    if (isRedirecting) {
      console.log('🛑 Already redirecting, please wait...')
      return
    }
    
    setChecking(true)
    setMessage('🔍 Checking verification status manually...')
    console.log('🔄 Manual verification check triggered')
    
    try {
      // Try multiple methods to check verification
      const { session, user } = await forceSessionRefresh()
      
      // Check database directly
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('email_verified, auth_id, email')
        .eq('auth_id', userId)
        .single()
      
      console.log('📊 Database check:', userData)
      
      const isVerified = session?.user?.email_confirmed_at || 
                        user?.email_confirmed_at || 
                        userData?.email_verified

      if (isVerified) {
        console.log('✅ Manual check: Email verified!')
        await handleSuccessfulVerification(userId)
      } else {
        setChecking(false)
        setMessage('❌ Not verified yet. Please:\n1. Check your email and click the verification link\n2. Check your spam folder\n3. Wait a few minutes after clicking the link\n4. Try signing in instead')
        console.log('❌ Manual check: Still not verified')
      }
    } catch (error) {
      setChecking(false)
      setMessage('❌ Error checking verification. Please try signing in instead.')
      console.error('❌ Manual check error:', error)
    }
  }

  const handleSignInInstead = async () => {
    console.log('🔀 Redirecting to sign in page')
    sessionStorage.removeItem('pending_verification_user_id')
    router.replace('/auth/login')
  }

  const handleRestartRegistration = async () => {
    console.log('🔄 Restarting registration process')
    sessionStorage.removeItem('pending_verification_user_id')
    router.replace('/auth/register')
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <img
          alt="Your Company"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Verify Your Email
        </h2>
        
        <div className="mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            {checking && !isRedirecting ? (
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : null}
            
            <p className="text-blue-800 font-medium mb-2">
              {isRedirecting ? 'Redirecting...' : (checking ? 'Check Your Email' : 'Verification Status')}
            </p>
            
            <p className="text-blue-700 text-sm mb-4 whitespace-pre-line">
              {message}
            </p>

            {!checking && !isRedirecting && (
              <div className="space-y-3">
                <p className="text-orange-600 text-sm font-medium">
                  Still having issues?
                </p>
                <button
                  onClick={handleManualCheck}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
                >
                  Check Verification Status
                </button>
                <button
                  onClick={handleSignInInstead}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  Try Signing In Instead
                </button>
                <button
                  onClick={handleRestartRegistration}
                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 text-sm font-medium transition-colors"
                >
                  Restart Registration
                </button>
              </div>
            )}

            {isRedirecting && (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
          <p className="text-gray-800 text-sm font-mono">
            <strong>Debug Info:</strong><br />
            {debugInfo || 'No debug info yet'}<br />
            UserID: {userId || 'Not found'}<br />
            Checking: {checking ? 'Yes' : 'No'}<br />
            Redirecting: {isRedirecting ? 'Yes' : 'No'}
          </p>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-medium mb-2">What to do:</p>
          <ol className="list-decimal list-inside text-left space-y-1 bg-white p-4 rounded-lg border">
            <li><strong>Check your email inbox</strong> (and spam folder)</li>
            <li>Look for an email from Supabase</li>
            <li>Click the <strong>"Confirm your email"</strong> button/link</li>
            <li>Wait 30 seconds after clicking the link</li>
            <li>Return to this page or use the buttons above</li>
            <li>If still not working, try "Sign In Instead"</li>
          </ol>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Important:</strong> After clicking the verification link, you need to wait a few moments for the system to process the verification. If it doesn't work automatically, use the "Try Signing In Instead" button.
          </p>
        </div>
      </div>
    </div>
  )
}