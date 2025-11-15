import { Settings, LogOut, ArrowRight } from "lucide-react";

export default function Projects(){
    const projects = [
        {
            id: 1,
            logo: "/logo-light.png",
            name: "KapryDEV",
            creator: "Alex Johnson",
            members: 15,
            status: "Active"
        },
        {
            id: 2,
            logo: "/default-avatar.png",
            name: "WebFlow",
            creator: "Sarah Chen",
            members: 8,
            status: "Active"
        },
        {
            id: 3,
            logo: "/default-avatar.png",
            name: "DataCore",
            creator: "Mike Rodriguez",
            members: 12,
            status: "Inactive"
        },
        {
            id: 4,
            logo: "/default-avatar.png",
            name: "CloudSync",
            creator: "Emma Wilson",
            members: 20,
            status: "Active"
        }
    ];

    return(
        <>
        <div className="container max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
                <p className="text-white/60">Manage your projects and access team workspaces</p>
            </div>

            {/* Projects Table */}
            <div className="bg-white/2 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 bg-white/3">
                    <div className="col-span-4">
                        <span className="text-white font-semibold">Project</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-white font-semibold">Creator</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-white font-semibold">Members</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-white font-semibold">Status</span>
                    </div>
                    <div className="col-span-2 text-center">
                        <span className="text-white font-semibold">Actions</span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-white/10">
                    {projects.map((project) => (
                        <div key={project.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-white/5 transition-colors">
                            {/* Project Info */}
                            <div className="col-span-4 flex items-center space-x-4">
                                <img
                                    src={project.logo}
                                    alt={project.name}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                                />
                                <div>
                                    <p className="text-white font-semibold">{project.name}</p>
                                </div>
                            </div>

                            {/* Creator */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className="text-white/70 text-sm">{project.creator}</span>
                            </div>

                            {/* Members */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className="text-white/70">{project.members}</span>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex items-center justify-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    project.status === "Active" 
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                                        : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                }`}>
                                    {project.status}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex items-center justify-center space-x-2">
                                <button className="bg-white/10 hover:bg-white/20 text-white/90 hover:text-white px-3 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 flex items-center space-x-1 text-sm">
                                    <ArrowRight size={16} />
                                    <span>Enter</span>
                                </button>
                                <button className="bg-white/10 hover:bg-white/20 text-white/90 hover:text-white p-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30">
                                    <LogOut size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        </>
    );
}