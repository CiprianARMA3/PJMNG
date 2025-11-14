import ProjectTempate from "../projects/Project" ;

interface HomeSectionProps {
  userName: string;
}

export default function HomeSection({ userName }: HomeSectionProps) {
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 text-white">
        Welcome back {userName || "there"}!
      </h1>
      <p className="text-gray-400 mb-8">Here are your projects:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProjectTempate />
      </div>
    </div>
  );
}