import { Github, Plus, Users } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import AddProjectButton from "./component/addMore"; 

export default function ProjectTemplate() {
  return (
    <>
      <div className="container max-w-md mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-lg">
      
        {/* Title Section */}
        <div className="flex flex-col items-center mb-4">
          <img
            className="project-pic w-32 h-32 rounded-full object-cover mb-2 border-2 border-white/20"
            src="/placeholder.png"
            alt="Project"
          />
          <p className="project-title text-white text-xl font-semibold">
            Project Name
          </p>
        </div>

        {/* Description */}
        <div className="mb-4 text-white/80">
          <p>
            This is a short description of the project. Explain what it does,
            why it exists, or any other relevant info.
          </p>
        </div>

        {/* Project Info */}
<div className="project-info flex justify-around text-white/80 mb-4">
  <div className="flex flex-col items-center">
    <p className="font-semibold">Since</p>
    <p>2025</p>
  </div>
  <div className="flex flex-col items-center">
    <p className="font-semibold">Collaborators</p>
    <div className="flex items-center gap-1">
      <Users size={20} />
      <span>20</span>
    </div>
  </div>
  <div className="flex flex-col items-center space-x-2">
    <p className="font-semibold">Links</p>
    <div className="flex gap-2 mt-1">
      <Github size={20} className="cursor-pointer hover:text-white" />
      <FaDiscord size={24} className=" hover:text-white" />
    </div>
  </div>
</div>

        {/* Creator Info */}
        <div className="text-white/80 flex justify-between border-t border-white/10 pt-3">
          <p>Created by</p>
          <p className="font-semibold">Creator Name</p>
        </div>
      </div>

        <div className="flex justify-center items-center ml-[-200px]">
        <AddProjectButton />
        <p className="ml-[20px] text-white/100"></p>
        </div>
         
      {/* it has to go here! */}
      </>
  );
}
