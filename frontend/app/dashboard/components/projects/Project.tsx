import { Github, Plus, Users, Settings } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import AddProjectButton from "./component/addMore"; 
import Image from 'next/image';

export default function ProjectTemplate() {
  return (
    <>
      <div className="container max-w-lg mx-auto bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden">
        
        {/* Banner Section - No padding, sits on border */}
        <div className="relative mb-16">
          {/* Banner with fade out effect */}
          <div className="h-32 w-full relative">
            {/* Settings Icon - Positioned above the image */}
            <div className="absolute top-2 right-2 z-10">
              <Settings 
                size={24} 
                className="text-white/80 cursor-pointer hover:text-white hover:rotate-90 transition-transform duration-300" 
              />
            </div>
            <div className="absolute inset-0">

            <Image
              src="/cassiuscover.jpg"
              alt="Project Banner"
              width={1200}
              height={600}
              className="w-full h-full object-cover"
              loading="eager"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              quality={60}
            />

              <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent"></div>
            </div>
          </div>
          
          {/* Project Logo and Name Container */}
          <div className="absolute -bottom-16 left-6 flex items-end">
            {/* Project Logo */}
            <div className="border-4 border-gray-300/1 rounded-full p-1 bg-gray-800/50">
          <Image
            src="/logo-light.png"
            alt="Project"
            width={100}          // approximate width matching Tailwind w-25 (25 * 4px = 100px)
            height={100}         // approximate height matching Tailwind h-25
            className="rounded-full object-cover border-2 border-white/20"
            priority             // optional: use if this image is above-the-fold or critical
          />
            </div>
            
            {/* Project Name - Bottom right of logo */}
            <div className="ml-[30px] mb-2 mt-[-50px]">
              <p className="project-title text-white text-2xl font-semibold">
                KapryDEV
              </p>
            </div>
          </div>
        </div>

        {/* Content Area with padding */}
        <div className="px-6 pb-6">
          {/* Description */}
          <div className="mb-6 text-white/80 text-center mt-[90px]">
            <p className="text-lg">
              This is a short description of the project. Explain what it does,
              why it exists, or any other relevant info.
            </p>
          </div>

          {/* Project Info */}
          <div className="project-info flex justify-around text-white/80 mb-6">
            <div className="flex flex-col items-center">
              <p className="font-semibold text-lg">Since</p>
              <p className="text-lg">2025</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-semibold text-lg">Collaborators</p>
              <div className="flex items-center gap-1">
                <Users size={24} />
                <span className="text-lg">20</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <p className="font-semibold text-lg">Links</p>
              <div className="flex gap-2 mt-1">
                <Github size={24} className="cursor-pointer hover:text-white" />
                <FaDiscord size={28} className="hover:text-white cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="text-white/80 flex justify-between border-t border-white/10 pt-4">
            <p className="text-lg">Created by</p>
            <p className="font-semibold text-lg">Creator name</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center ml-[-200px]">
        <AddProjectButton />
        <p className="ml-[20px] text-white/100"></p>
      </div>
    </>
  );
}