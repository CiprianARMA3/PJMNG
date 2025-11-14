export default function SearchSection() {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 text-white">Search</h1>
      <p className="text-gray-400 mb-8">Find anything in your workspace</p>
      <div className="relative">
        <input
          type="text"
          placeholder="Search projects, files, messages..."
          className="w-full bg-[#1a1a1d] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
        />
      </div>
    </div>
  );
}