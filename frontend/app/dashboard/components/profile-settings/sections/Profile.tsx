// sections/Profile.tsx
"use client";

interface ProfilePageProps {
  user: any | null;
}

export default function PublicProfilePage({ user }: ProfilePageProps) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-white mb-8">Public Profile</h1>
      <div className="bg-[#141417] border border-[#1e1e22] rounded-lg p-8">
        <p className="text-gray-300">Public profile settings coming soon...</p>
      </div>
    </div>
  );
}
