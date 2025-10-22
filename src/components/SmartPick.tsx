import { Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FilterButton } from "./FilterButton";

interface SmartPickProps {
  activeFilters: {
    usage?: string;
    maintenance?: string;
    priceRange?: string;
  };
  onFilterChange: (category: string, value: string) => void;
  recommendation: string;
}

export const SmartPick = ({ activeFilters, onFilterChange, recommendation }: SmartPickProps) => {
  return (
    <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-accent/20 p-6 mb-8">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold text-foreground">Smart Pick Recommendation</h3>
          
          {/* Usage Filters */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Usage Pattern:</p>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="High Oil"
                active={activeFilters.usage === "high"}
                onClick={() => onFilterChange("usage", "high")}
              />
              <FilterButton
                label="Medium Oil"
                active={activeFilters.usage === "medium"}
                onClick={() => onFilterChange("usage", "medium")}
              />
              <FilterButton
                label="Low Oil"
                active={activeFilters.usage === "low"}
                onClick={() => onFilterChange("usage", "low")}
              />
            </div>
          </div>

          {/* Maintenance Filters */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Maintenance Preference:</p>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="Easy Maintenance"
                active={activeFilters.maintenance === "easy"}
                onClick={() => onFilterChange("maintenance", "easy")}
              />
              <FilterButton
                label="Moderate"
                active={activeFilters.maintenance === "moderate"}
                onClick={() => onFilterChange("maintenance", "moderate")}
              />
              <FilterButton
                label="Frequent Cleaning"
                active={activeFilters.maintenance === "frequent"}
                onClick={() => onFilterChange("maintenance", "frequent")}
              />
            </div>
          </div>

          {/* Price Range Filters */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Budget Range:</p>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                label="₹5K-10K"
                active={activeFilters.priceRange === "5-10"}
                onClick={() => onFilterChange("priceRange", "5-10")}
              />
              <FilterButton
                label="₹10K-20K"
                active={activeFilters.priceRange === "10-20"}
                onClick={() => onFilterChange("priceRange", "10-20")}
              />
              <FilterButton
                label="₹20K+"
                active={activeFilters.priceRange === "20+"}
                onClick={() => onFilterChange("priceRange", "20+")}
              />
            </div>
          </div>

          {/* Recommendation Text */}
          <div className="pt-4 border-t border-accent/20">
            <p className="text-foreground leading-relaxed">{recommendation}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};