'use client'
import { supabase } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export default function TestPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...')
        console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
        
        const { data, error } = await supabase.from('users').select('*').limit(1)
        
        if (error) {
          setStatus('error')
          setMessage(`Error: ${error.message}`)
          console.error('Supabase error:', error)
        } else {
          setStatus('success')
          setMessage(`Success! Connected to Supabase. Found ${data?.length} users.`)
          console.log('Supabase success:', data)
        }
      } catch (err: any) {
        setStatus('error')
        setMessage(`Connection failed: ${err.message}`)
        console.error('Connection error:', err)
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase Connection Test</h1>
      <div style={{ 
        padding: '10px', 
        backgroundColor: status === 'loading' ? 'yellow' : status === 'success' ? 'green' : 'red',
        color: 'white'
      }}>
        Status: {status}
      </div>
      <p>{message}</p>
    </div>
  )
}