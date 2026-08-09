import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, extra, className }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between ${className || ""}`}>
      <div>
        <h2 className="text-base font-medium text-admin-text">{title}</h2>
        {subtitle && (
          <p className="text-xs text-admin-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {extra && <div className="flex items-center gap-2">{extra}</div>}
    </div>
  );
}

interface BackButtonProps {
  text?: string;
  onClick: () => void;
}

export function BackButton({ text = "返回", onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-admin-primary hover:text-blue-600 mb-4 transition-colors"
    >
      <ChevronLeft size={16} />
      {text}
    </button>
  );
}

interface CardProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, extra, children, className }: CardProps) {
  return (
    <div className={`admin-card ${className || ""}`}>
      {(title || extra) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-admin-border">
          {title && (
            <h3 className="text-sm font-medium text-admin-text">{title}</h3>
          )}
          {extra}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
