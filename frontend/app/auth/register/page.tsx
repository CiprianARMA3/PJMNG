'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterBox() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Password requirements state
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  // Check password strength in real-time
  useEffect(() => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
    setPasswordChecks(checks)
  }, [password])

  // Calculate password strength score
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length
  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200'
    if (passwordStrength <= 2) return 'bg-red-500'
    if (passwordStrength <= 3) return 'bg-orange-500'
    if (passwordStrength === 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthText = () => {
    if (password.length === 0) return 'Enter a password'
    if (passwordStrength <= 2) return 'Weak'
    if (passwordStrength <= 3) return 'Fair'
    if (passwordStrength === 4) return 'Good'
    return 'Strong'
  }

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
    }
    checkUser()
  }, [router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength < 3) {
      setError('Please meet all password requirements')
      return
    }

    setLoading(true)

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (!authData.user) {
        setError('Registration failed - no user data returned')
        return
      }

      // 2. Store user ID for verification page
      sessionStorage.setItem('pending_verification_user_id', authData.user.id)

      // 3. Add to public.users table with minimal data
      const { error: dbError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        email: authData.user.email,
        name: null,
        surname: null,
        plan_id: null,
        active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        password_hash: 'supabase_auth_managed',
        metadata: {},
      })

      if (dbError) {
        // If user already exists in our table, still proceed to verification
        if (!dbError.message.includes('duplicate key')) {
          setError(`Database error: ${dbError.message}`)
          return
        }
      }

      // 4. Success - redirect to verification page
      router.push('/auth/verify-email')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${met ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span className={`text-sm ${met ? 'text-green-600' : 'text-red-600'}`}>
        {text}
      </span>
    </div>
  )

  // Eye SVG Icons
  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg 
      className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      {show ? (
        // Eye open (visible)
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      ) : (
        // Eye closed (hidden)
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </>
      )}
    </svg>
  )

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Email address
            </label>
            <div className="mt-2 relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm pr-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password
            </label>
            <div className="mt-2 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm pr-10"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                <EyeIcon show={showPassword} />
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Password strength:</span>
                  <span className={`text-sm font-semibold ${
                    passwordStrength <= 2 ? 'text-red-600' :
                    passwordStrength <= 3 ? 'text-orange-600' :
                    passwordStrength === 4 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {getStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${(passwordStrength / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Password Requirements */}
            <div className="mt-3 space-y-2">
              <PasswordRequirement 
                met={passwordChecks.length} 
                text="At least 8 characters" 
              />
              <PasswordRequirement 
                met={passwordChecks.uppercase} 
                text="One uppercase letter (A-Z)" 
              />
              <PasswordRequirement 
                met={passwordChecks.lowercase} 
                text="One lowercase letter (a-z)" 
              />
              <PasswordRequirement 
                met={passwordChecks.number} 
                text="One number (0-9)" 
              />
              <PasswordRequirement 
                met={passwordChecks.special} 
                text="One special character (!@#$% etc.)" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
              Confirm Password
            </label>
            <div className="mt-2 relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full rounded-md bg-white px-3 py-1.5 text-base outline outline-1 -outline-offset-1 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 sm:text-sm pr-10 ${
                  confirmPassword && password !== confirmPassword 
                    ? 'text-red-900 outline-red-300 focus:outline-red-600' 
                    : confirmPassword && password === confirmPassword
                    ? 'text-green-900 outline-green-300 focus:outline-green-600'
                    : 'text-gray-900 outline-gray-300 focus:outline-indigo-600'
                }`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <EyeIcon show={showConfirmPassword} />
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && passwordStrength >= 3 && (
              <p className="mt-1 text-sm text-green-600">Passwords match!</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || passwordStrength < 3 || password !== confirmPassword}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-center text-sm text-red-600">{error}</p>
          </div>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/auth/login" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}