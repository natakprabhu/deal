import React from 'react'; // Import React for fragments
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

// 1. Define the updated data structure
export interface SmartFilterMap {
  [key: string]: {
    groupTitle: string;
    content: (string | { filter: string })[]; // Array of strings or filter objects
  }[];
}

// 2. Define the component props (no change)
interface DynamicFilterGuideProps {
  categoryName: string;
  allFilters: SmartFilterMap;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

// 3. The component
export const DynamicFilterGuide = ({
  categoryName,
  allFilters,
  selectedTags,
  onTagToggle,
}: DynamicFilterGuideProps) => {
  const filterGroups = allFilters[categoryName];

  if (!filterGroups) {
    return null;
  }

  // Helper function to render our inline filter buttons
  const renderFilterButton = (tag: string) => (
   <Button
  key={tag}
  variant={selectedTags.includes(tag) ? "default" : "outline"}
  size="sm"
  className={`h-auto px-2 py-1 mx-0 inline-block leading-normal align-baseline font-semibold rounded-full
    ${
      selectedTags.includes(tag)
        ? "bg-[hsl(24,100%,50%)] text-white border-transparent hover:bg-[hsl(24,100%,45%)]"
        : "text-[hsl(24,100%,45%)] border border-[hsl(24,100%,75%)] hover:bg-[hsl(24,100%,97%)]"
    }`}
  onClick={(e) => {
    e.preventDefault();
    onTagToggle(tag);
  }}
>
  {tag}
</Button>

  );

  return (
    <Card className="mb-6 bg-gradient-to-br from-accent/5 to-primary/5 border-2 shadow-lg">
    {/*<Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-2 border-accent/20 p-6 mb-8">*/}
   
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Lightbulb className="h-5 w-5 text-primary" />
          Refine Your Search for {categoryName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4"> {/* Space between passages */}
        
        {filterGroups.map((group) => (
          <div key={group.groupTitle} className="space-y-1"> {/* Space between title and passage */}
            <p className="font-medium text-foreground">{group.groupTitle}</p> {/* Title */}
            
            {/* --- PARSE AND RENDER THE PASSAGE --- */}
            <p className="text-base text-muted-foreground leading-relaxed">
              {group.content.map((item, index) => (
                <React.Fragment key={index}>
                  {typeof item === 'string' ? (
                    <span>{item}</span> // Render text directly
                  ) : (
                    renderFilterButton(item.filter) // Render the button
                  )}
                </React.Fragment>
              ))}
            </p>
            {/* --- END PASSAGE RENDERING --- */}
            
          </div>
        ))}
      </CardContent>
    </Card>
  );
};  