"use client";

export default function Breadcrumb({ items }: { items: string[] }) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <span
            className={`${index === items.length - 1
                ? "text-white font-medium"
                : "hover:text-gray-300 cursor-pointer"
              }`}
          >
            {item}
          </span>
          {index < items.length - 1 && (
            <span className="mx-2 text-gray-600">› </span>
          )}
        </div>

      ))}
    </nav>
  );
}
