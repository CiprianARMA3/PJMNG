import { useRouter } from "next/navigation";

export default function SettingsSection() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 text-white light:text-black">Settings</h1>
      <p className="text-gray-400 light:text-gray-600 mb-8">Manage your account preferences</p>
      <div className="bg-[#1a1a1d] light:bg-gray-100 p-6 rounded-lg border border-gray-800 light:border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="text-white light:text-black block mb-2">Profile Settings</label>
            <button
              onClick={() => router.push("/profile")}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}