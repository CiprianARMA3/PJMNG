import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-2xl font-bold">Page Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/" className="text-blue-500 underline">
        Return Home
      </Link>
    </div>
  )
}