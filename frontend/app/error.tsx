'use client' // Error components must be Client Components

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold">Something went wrong!</h2>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded mt-4"
        onClick={
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  )
}