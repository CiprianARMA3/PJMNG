import { Plus } from "lucide-react";

export default function AddProjectButton() {
  return (
    <button
      className="
        flex 
        items-center 
        justify-center 
        w-12 
        h-12 
        bg-white/5 
        backdrop-blur-lg 
        border 
        border-white/10 
        rounded-full 
        text-white 
        hover:bg-white/10 
        shadow-lg 
        transition
      "
      title="Add Project"
    >
      <Plus size={20} />
    </button>
  );
}
