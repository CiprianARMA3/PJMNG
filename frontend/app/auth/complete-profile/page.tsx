'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function CompleteProfilePage() {
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [profilePicture, setProfilePicture] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }
      
      // Check if user is verified in our database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', session.user.id)
        .single()

      if (error || !userData) {
        router.push('/auth/login')
        return
      }

      if (!userData.email_verified) {
        // If not verified, redirect to verification page
        sessionStorage.setItem('pending_verification_user_id', session.user.id)
        router.push('/auth/verify-email')
        return
      }

      setUser(session.user)
      setUserData(userData)
    }

    checkAuthAndVerification()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB')
        return
      }

      setProfilePicture(file)
      setPreviewUrl(URL.createObjectURL(file))
      setError('')
    }
  }

  const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/pfp.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')  // Updated bucket name
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')  // Updated bucket name
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!name.trim() || !surname.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      let pfpUrl = ''

      // Upload profile picture if selected
      if (profilePicture && user) {
        pfpUrl = await uploadProfilePicture(profilePicture, user.id)
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          surname: surname.trim(),
          metadata: {
            profile_picture: pfpUrl,
            profile_completed: true,
            profile_completed_at: new Date().toISOString()
          }
        })
        .eq('auth_id', user.id)

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`)
      }

      // Redirect to dashboard
      router.push('/dashboard')
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Complete Your Profile
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Almost there! Just a few more details.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleCompleteProfile} className="space-y-6">
          {/* Profile Picture Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Profile Picture (Optional)
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No image</span>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-900">
              First Name *
            </label>
            <div className="mt-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                placeholder="Enter your first name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900">
              Last Name *
            </label>
            <div className="mt-2">
              <input
                type="text"
                required
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving profile...' : 'Complete Profile'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  )
}