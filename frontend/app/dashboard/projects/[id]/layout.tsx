import React from 'react';
import ProjectAuthGuard from '../../components/ProjectAuthGuard';
// import Menu from ... (your existing menu import)

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <ProjectAuthGuard>
      {/* Your existing layout structure usually goes here */}
      {/* For example, if you have a sidebar menu: */}
      <div className="flex h-screen bg-[#0a0a0a] light:bg-gray-50">
        {/* <Menu projectId={params.id} /> */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ProjectAuthGuard>
  );
}