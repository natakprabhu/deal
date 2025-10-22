import { cn } from "@/lib/utils";

interface FilterButtonProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export const FilterButton = ({ label, active, onClick }: FilterButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
        "border hover:shadow-md",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background text-foreground border-border hover:border-primary/50"
      )}
    >
      {label}
    </button>
  );
};