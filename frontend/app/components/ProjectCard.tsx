interface Project {
  id: string;
  name: string;
  description: string;
}

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="border p-4 rounded shadow">
      <h2 className="font-bold">{project.name}</h2>
      <p>{project.description}</p>
    </div>
  );
}
