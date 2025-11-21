// /components/menu.tsx
import {
  LayoutGrid,
  BookOpen,
  KanbanSquare,
  Calendar,
  Bug,
  Workflow,
  Bot,
  Code,
  ChevronRight,
  Bell,
  LogOut,
  Search,
} from "lucide-react";
import Link from "next/link";

interface MenuProps {
  project: any;
  user: any;
}

export default function Menu({ project, user }: MenuProps) {
  const getAvatarUrl = () =>
    user?.user_metadata?.avatar_url || "/default-avatar.png";

  const sections = [
    {
      title: "Project",
      items: [
        {
          label: "Dashboard",
          icon: LayoutGrid,
          href: `/dashboard/projects/${project.id}`,
        },
        // {
        //   label: "Concepts",
        //   icon: BookOpen,
        //   href: `/dashboard/projects/${project.id}/concepts`,
        // },
        {
          label: "Board",
          icon: KanbanSquare,
          href: `/dashboard/projects/${project.id}/board`,
        },
        {
          label: "Calendar",
          icon: Calendar,
          href: `/dashboard/projects/${project.id}/calendar`,
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Issues",
          icon: Bug,
          href: `/dashboard/projects/${project.id}/issues`,
        },
        {
          label: "Workflow",
          icon: Workflow,
          href: `/dashboard/projects/${project.id}/workflow`,
        },
      ],
    },
    {
      title: "AI Tools",
      items: [
        {
          label: "AI",
          icon: Bot,
          href: `/dashboard/projects/${project.id}/ai`,
        },
        {
          label: "AI Code Review",
          icon: Code,
          href: `/dashboard/projects/${project.id}/code-review`,
        },
      ],
    },
        {
      title: "Workspace Management",
      items: [
        {
          label: "Manage Project",
          icon: Bot,
          href: `/dashboard/projects/${project.id}/ai`,
        },
        {
          label: "Manage Collaborators",
          icon: Code,
          href: `/dashboard/projects/${project.id}/code-review`,
        },
      ],
    },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a]/20 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-6 ml-64">
        {/* Left: search bar */}
        <div className="flex items-center gap-2 w-1/2">
          <Search className="w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent placeholder-white/50 text-white rounded-lg px-3 py-1 w-full focus:outline-none focus:ring-1 focus:ring-transparent"
          />
        </div>

        {/* Right: notifications, profile, logout */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-white/70 hover:text-white" />
          </button>

          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors">
            <img
              src={getAvatarUrl()}
              alt="User Avatar"
              className="w-8 h-8 rounded-full border border-white/20"
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs text-white/50">{user?.email}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/60" />
          </div>

          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <LogOut className="w-5 h-5 text-white/70 hover:text-white" />
          </button>

        </div>
      </header>

      {/* Sidebar */}
      <aside className="w-64 bg-[#0c0c0c] border-r border-white/10 flex flex-col fixed inset-y-0 top-0 z-40 mt-[-50px]">


        <div>
          {/* Project Header */}
          <div className="p-6 flex items-center gap-3 mt-16">
            {project.metadata?.["project-icon"] && (
              <img
                src={project.metadata["project-icon"]}
                width={42}
                height={42}
                alt="Project Logo"
                className="rounded-lg object-cover border border-white/20"
              />
            )}
            <h2 className="text-lg font-semibold">{project.name}</h2>
          </div>

          {/* Navigation Sections */}
          <nav className="p-4 space-y-6">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs text-white/40 uppercase font-medium px-3 mb-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Removed bottom user profile section */}
      </aside>
    </>
  );
}
