"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FiCpu, FiTv, FiCoffee, FiPhone, FiZap, FiHome, FiBox } from "react-icons/fi";

type Category = {
  name: string;
  slug: string;
  icon?: string;
};

const ArticlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Expanded curated categories
const categories: Category[] = [
  { name: "Chimney", slug: "chimney" },
  { name: "Microwave", slug: "microwave" },
  { name: "Juicer", slug: "juicer" },
  { name: "Water Purifier", slug: "water-purifier" },
  { name: "TV", slug: "tv" },
  { name: "Laptop", slug: "laptop" },
  { name: "Mobile", slug: "mobile" },
  { name: "Coffee Maker", slug: "coffee-maker" },
  { name: "Refrigerator", slug: "refrigerator" },
  { name: "Air Purifier", slug: "air-purifier" },
  { name: "Vacuum Cleaner", slug: "vacuum-cleaner" },
];

  // Recommendations JSON
  const recommendations: Record<string, string[]> = {
    mobile: ["phone", "mobile", "smartphone", "android", "ios"],
    laptop: ["laptop", "notebook", "macbook", "dell", "hp", "lenovo"],
    tv: ["tv", "led tv", "smart tv", "oled", "lcd"],
    microwave: ["microwave", "otg", "oven", "convection oven"],
    chimney: ["chimney", "kitchen chimney", "exhaust"],
    juicer: ["juicer", "mixer grinder", "blender", "juice extractor"],
    "water-purifier": ["water purifier", "ro purifier", "uv purifier", "uf purifier"],
    "hair-dryer": ["hair dryer", "blow dryer", "styler"],
    oven: ["oven", "baking oven", "electric oven"],
    blender: ["blender", "smoothie maker", "nutri blender"],
    "coffee-maker": ["coffee maker", "espresso", "filter coffee"],
    dishwasher: ["dishwasher", "automatic dishwasher"],
    refrigerator: ["fridge", "refrigerator", "double door fridge"],
    "air-purifier": ["air purifier", "hepa", "dust purifier"],
    iron: ["iron", "steam iron", "dry iron"],
    "vacuum-cleaner": ["vacuum cleaner", "robot vacuum", "upright vacuum"],
    "led-lights": ["led lights", "bulbs", "tube light"],
    fan: ["fan", "ceiling fan", "table fan", "tower fan"],
    "mixer-grinder": ["mixer grinder", "wet grinder", "kitchen grinder"],
  };

  // Search logic
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const filtered: string[] = [];
      const keyword = val.toLowerCase();

      for (const [catSlug, keywords] of Object.entries(recommendations)) {
        if (keywords.some(k => k.toLowerCase().includes(keyword))) {
          const catName = categories.find(c => c.slug === catSlug)?.name;
          if (catName) filtered.push(catName);
        }
      }

      setSuggestions([...new Set(filtered)].slice(0, 8));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (s: string) => {
    const cat = categories.find(c => c.name === s);
    if (cat) navigate(`/search?category=${cat.slug}`);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const openCategory = (slug: string) => navigate(`/search?category=${slug}`);

  // Highlight matching keyword
  const highlightMatch = (text: string, query: string) => {
    const regex = new RegExp(`(${query})`, "ig");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="bg-yellow-200 rounded px-1">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16 bg-muted/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Explore Products & Reviews</h1>
          <p className="text-muted-foreground mb-6">
            Explore articles featuring curated top 10 product lists or search for recommendations.
          </p>

          {/* Category Chips */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {categories.map(c => (
              <Button
                key={c.slug}
                variant="outline"
                className="px-4 py-2 rounded-full"
                onClick={() => openCategory(c.slug)}
              >
                {c.icon} {c.name}
              </Button>
            ))}
          </div>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(searchQuery.length > 0)}
              placeholder="Search categories..."
              className="pl-10 pr-4 py-4 rounded-xl"
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-card border rounded-lg shadow-lg z-20">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
                  >
                    {highlightMatch(s, searchQuery)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ArticlesPage;
