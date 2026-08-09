import { Construction } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description?: string;
}

export default function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Construction size={48} className="text-gray-300 mx-auto mb-3" />
        <h2 className="text-lg font-medium text-admin-text mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-admin-muted">{description}</p>
        )}
        <p className="text-xs text-admin-muted mt-4">页面开发中...</p>
      </div>
    </div>
  );
}
