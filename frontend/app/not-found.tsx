import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center ">
      <h2 className="text-[200px] font-bold">404</h2>
      <h3 className='text-[60px] font-bold'>Page Not Found</h3>
      
      <Link href="/" className="text-blue-500 underline font-bold text-2xl mt-10">
        Return Home
      </Link>
    </div>
  )
}