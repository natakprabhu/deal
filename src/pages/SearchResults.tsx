import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";

// --- ADD THIS IMPORT ---
import { DynamicFilterGuide, SmartFilterMap } from "@/components/DynamicFilterGuide";
// ---

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  category_id: string | null;
  categories?: { name: string } | null;
  created_at: string;
  views: number;
  author?: string;
  price?: number;
  tags?: string[];
};

const priceFilters = [
  { label: "All Prices", value: null },
  { label: "Under ₹10K", value: 10000 },
  { label: "Under ₹20K", value: 20000 },
  { label: "Under ₹30K", value: 30000 },
  { label: "Cost No Bar", value: null },
];

const ageFilters = [
  { label: "All Time", value: null },
  { label: "This Month", value: 1 },
  { label: "Past 6 Months", value: 6 },
  { label: "Past Year", value: 12 },
];

const sortOptions = [
  { label: "Newest First", value: "newest" },
  { label: "Oldest First", value: "oldest" },
  { label: "Most Liked", value: "most_liked" },
];

const resultsPerPage = 20;
const toTitleCase = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";



 // --- NEW STRUCTURE FOR INLINE FILTERS ---
const smartFilterMap: {
  [key: string]: {
    groupTitle: string;
    // 'content' is now an array of text strings and filter names
    content: (string | { filter: string })[];
  }[];
} = {
  "Air Purifier": [
    {
      groupTitle: "Filter Technology",
      content: [
        "What are you trying to remove? A ", { filter: "HEPA Filter" }, " is essential for dust/allergens. An ", { filter: "Activated Carbon" }, " filter removes odors/gases. ", { filter: "Ionizer" }, "s help particles settle, and ", { filter: "UV-C Light" }, " neutralizes germs."
      ]
    },
    {
      groupTitle: "Features",
      content: [
        "Need extra convenience? A ", { filter: "Smart / Wi-Fi" }, " model offers app control, while a model ", { filter: "With Humidifier" }, " adds moisture to dry air."
      ]
    }
  ],
  "Chimney": [
    {
      groupTitle: "Filter Type",
      content: [
        "For heavy Indian cooking, a ", { filter: "Baffle Filter" }, " is most durable. For convenience, choose ", { filter: "Filterless (Auto-Clean)" }, ". A ", { filter: "Mesh / Cassette Filter" }, " is budget-friendly."
      ]
    },
    {
      groupTitle: "Suction Power",
      content: [
        "Match power to your stove: ", { filter: "Suction: 800-1000 m³/hr" }, " (2-3 burners), ", { filter: "Suction: 1100-1300 m³/hr" }, " (standard 3-4 burners), or ", { filter: "Suction: 1400+ m³/hr" }, " (heavy use)."
      ]
    },
    {
      groupTitle: "Installation & Features",
      content: [
        "A ", { filter: "Ducted" }, " chimney vents outside (most effective), while ", { filter: "Ductless" }, " recirculates air (good for apartments). Most are ", { filter: "Wall Mounted" }, ". Look for an ", { filter: "Auto-Clean Feature" }, "."
      ]
    }
  ],
  "Coffee Maker": [
    {
      groupTitle: "Brewing Style",
      content: [
        "How do you like your coffee? An ", { filter: "Espresso Machine" }, " makes strong, concentrated shots. A ", { filter: "Drip Coffee" }, " machine brews a classic pot. A ", { filter: "French Press" }, " or ", { filter: "Moka Pot" }, " offers a manual, rich brew, while a ", { filter: "Pod / Capsule" }, " machine is all about speed."
      ]
    },
    {
      groupTitle: "Automation & Input",
      content: [
        "How much work? A ", { filter: "Fully Automatic" }, { filter: "Bean-to-Cup" }, " machine does everything. A ", { filter: "Semi-Automatic" }, " gives more control. A ", { filter: "Manual Brewer" }, " is for the enthusiast."
      ]
    }
  ],
  "Juicer": [
    {
      groupTitle: "Mechanism",
      content: [
        "Choose your juicing method: ", { filter: "Centrifugal (Fast)" }, " is quick and affordable. ", { filter: "Masticating (Cold Press)" }, " is slower, quieter, and extracts more nutrients."
      ]
    },
    {
      groupTitle: "Design",
      content: [
        "Masticating styles: ", { filter: "Horizontal" }, " is great for greens, ", { filter: "Vertical" }, " is compact. Some offer ", { filter: "Multi-Function" }, " features (sorbets, etc.)."
      ]
    }
  ],
  "Laptop": [
    {
      groupTitle: "Primary Use Case",
      content: [
        "What's the main goal? An ", { filter: "Ultrabook" }, " for travel, ", { filter: "Gaming" }, " for power, ", { filter: "2-in-1 / Convertible" }, " for flexibility, or a ", { filter: "Chromebook" }, " for web tasks."
      ]
    },
    {
      groupTitle: "Platform & Size",
      content: [
        "Choose your OS: ", { filter: "Windows" }, " or ", { filter: "macOS" }, ". Size: ", { filter: "13-14 inch" }, " (portable), ", { filter: "15-16 inch" }, " (standard), ", { filter: "17+ inch" }, " (desktop replacement)."
      ]
    }
  ],
  "Microwave": [
    {
      groupTitle: "Function",
      content: [
        "What do you need? ", { filter: "Solo" }, " for reheating, ", { filter: "Grill" }, " for browning, or ", { filter: "Convection" }, " for baking/roasting."
      ]
    },
    {
      groupTitle: "Features & Installation",
      content: [
        "Most are ", { filter: "Countertop" }, ". An ", { filter: "Over-the-Range" }, " saves space. ", { filter: "Inverter Technology" }, " cooks more evenly."
      ]
    }
  ],
  "Mobile": [
    {
      groupTitle: "Platform & Price",
      content: [
        "Choose your OS: ", { filter: "Android" }, " or ", { filter: "iOS" }, ". Find your budget: ", { filter: "Budget (< ₹15,000)" }, ", ", { filter: "Mid-Range (₹15k-₹35k)" }, ", or ", { filter: "Flagship (> ₹50,000)" }, "."
      ]
    },
    {
      groupTitle: "Form Factor",
      content: [
        "Want something different? Consider a ", { filter: "Foldable" }, " phone or a dedicated ", { filter: "Gaming Phone" }, "."
      ]
    }
  ],
  "Refrigerator": [
    {
      groupTitle: "Door Style",
      content: [
        "Common styles include ", { filter: "Single Door" }, ", ", { filter: "Double Door (Top Freezer)" }, " (most popular), ", { filter: "Side-by-Side" }, " (good for narrow spaces), and ", { filter: "French Door" }, " (premium)."
      ]
    },
    {
      groupTitle: "Key Features",
      content: [
        "Look for ", { filter: "Frost-Free" }, " (no manual defrosting), ", { filter: "Convertible" }, " modes (change freezer to fridge), or a built-in ", { filter: "With Water/Ice Dispenser" }, "."
      ]
    }
  ],
  "TV": [
    {
      groupTitle: "Panel Technology",
      content: [
        "Picture quality king? Choose ", { filter: "OLED" }, " (perfect blacks). Bright room? Try ", { filter: "QLED" }, " or ", { filter: "Neo QLED" }, " (vibrant colors). Best value? Standard ", { filter: "LED-LCD" }, "."
      ]
    },
    {
      groupTitle: "Resolution & Smart TV",
      content: [
        "Resolution: ", { filter: "Full HD (1080p)" }, " is basic, ", { filter: "4K UHD (2160p)" }, " is standard, ", { filter: "8K" }, " is future-proof. Smart platforms: ", { filter: "Google TV" }, ", ", { filter: "webOS (LG)" }, ", ", { filter: "Tizen (Samsung)" }, "."
      ]
    }
  ],
  "Vaccum Cleaner": [
    {
      groupTitle: "Form Factor",
      content: [
        "How do you clean? ", { filter: "Stick / Cordless" }, " (convenient), ", { filter: "Canister" }, " (powerful), ", { filter: "Robotic" }, " (automatic), ", { filter: "Handheld" }, " (small messes)."
      ]
    },
    {
      groupTitle: "Function & Filtration",
      content: [
        "Need to clean spills? Get ", { filter: "Wet & Dry" }, ". Filtration: ", { filter: "Bagless" }, " (common), ", { filter: "Bagged" }, " (hygienic)."
      ]
    }
  ],
  "Water Purifier": [
    {
      groupTitle: "Purification Technology",
      content: [
        "Water source matters: Use ", { filter: "RO (Reverse Osmosis)" }, " for hard/borewell water (high TDS). Use ", { filter: "UV (Ultraviolet)" }, " or ", { filter: "UF (Ultrafiltration)" }, " for municipal water (low TDS) to kill germs."
      ]
    },
    {
      groupTitle: "Features & Combinations",
      content: [
        "Most combine tech, like ", { filter: "RO + UV" }, ". Look for models ", { filter: "With Mineralizer" }, " to add back healthy minerals. Installation: ", { filter: "Wall-Mounted" }, " or non-electric ", { filter: "Gravity-Based" }, "."
      ]
    }
  ]
};
// --- END OF DICTIONARY ---


const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<number | null>(null);
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag) // Remove tag
        : [...prevTags, tag] // Add tag
    );
    setPage(1); // Reset to first page
  };

  const handleCategoryChange = (newCategorySlug: string | null) => {
    setSelectedCategory(newCategorySlug);
    setSelectedTags([]); // Clear sub-category tags
    setPage(1); // Reset to first page
  };

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .neq('name', 'Uncategorized')
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }
      setAllCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Auto-select category from URL
  useEffect(() => {
    if (categorySlug) {
      handleCategoryChange(categorySlug.toLowerCase());
    } else {
      handleCategoryChange(null); // Clear category if URL slug is removed
    }
  }, [categorySlug]);

  // --- THIS IS THE FULLY CORRECTED useEffect HOOK ---
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        
        // 1. Start with 'queryBuilder' as your base query
        let queryBuilder = supabase
          .from("articles")
          .select("*, categories(name)")
          .eq("status", "published");

        // 2. Conditionally add category filter
        if (selectedCategory) {
          const { data: catData } = await supabase
            .from("categories")
            .select("id")
            .ilike("slug", selectedCategory)
            .maybeSingle();

          if (catData) {
            queryBuilder = queryBuilder.eq("category_id", catData.id);
          } else {
            // Category in URL doesn't exist
            setArticles([]);
            setLoading(false);
            return;
          }
        }

        // 3. Conditionally add tags filter

          if (selectedTags.length > 0) {
            //queryBuilder = queryBuilder.contains("tags", selectedTags);
            queryBuilder = queryBuilder.overlaps("tags", selectedTags); //OR Operation
          }

        // 4. Execute the query ONCE
        const { data, error } = await queryBuilder;
        
        if (error) {
          // This is where the .cs error would be caught
          console.error("Supabase query error:", error);
          throw error;
        }

        let filtered = data || [];

        // --- Client-side filtering (price, age, sort) ---
        if (selectedPriceFilter) {
          filtered = filtered.filter((a: any) => (a.price || 0) <= selectedPriceFilter);
        }

        if (selectedAgeFilter) {
          filtered = filtered.filter((a: any) =>
            dayjs(a.created_at).isAfter(dayjs().subtract(selectedAgeFilter, "month"))
          );
        }

        if (selectedSort === "newest") {
          filtered.sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf());
        } else if (selectedSort === "oldest") {
          filtered.sort((a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf());
        } else if (selectedSort === "most_liked") {
          filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        }

        setArticles(filtered);
      } catch (err) {
        // Handle any error
        console.error("Error in fetchArticles:", err);
        toast({ title: "Error", description: "Failed to fetch articles", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, [selectedCategory, selectedPriceFilter, selectedAgeFilter, selectedSort, selectedTags, toast]); // <-- `selectedTags` is in the dependency array
  // --- END OF CORRECTED HOOK ---


  const paginatedArticles = articles.slice((page - 1) * resultsPerPage, page * resultsPerPage);
  const totalPages = Math.ceil(articles.length / resultsPerPage);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 space-y-6 p-4 bg-[hsl(10.1,67.8%,97%)] border border-[hsl(10.1,67.8%,50%)] rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-[hsl(10.1,67.8%,50%)] mb-2">Filters</h2>

            <div>
              <h3 className="font-semibold mb-2">Categories</h3>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === null}
                    onChange={() => handleCategoryChange(null)}
                  />
                  <span>All Categories</span>
                </label>

                {allCategories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.slug.toLowerCase()}
                      onChange={() => handleCategoryChange(cat.slug.toLowerCase())}
                    />
                    <span>{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>


            <div>
              <h3 className="font-semibold mb-2">Price</h3>
              <div className="flex flex-col gap-2">
                {priceFilters.map((filter) => (
                  <Button
                    key={filter.label}
                    variant={selectedPriceFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => { setSelectedPriceFilter(filter.value); setPage(1); }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Article Age</h3>
              <div className="flex flex-col gap-2">
                {ageFilters.map((filter) => (
                  <Button
                    key={filter.label}
                    variant={selectedAgeFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => { setSelectedAgeFilter(filter.value); setPage(1); }}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Sort By</h3>
              <div className="flex flex-col gap-2">
                {sortOptions.map((sort) => (
                  <Button
                    key={sort.label}
                    variant={selectedSort === sort.value ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => { setSelectedSort(sort.value); setPage(1); }}
                  >
                    {sort.label}
                  </Button>
                ))}
              </div>
            </div>
          </aside>

          {/* Articles List */}
          <div className="flex-1 space-y-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 flex-wrap">
                {selectedCategory ? (
                  <>
                    All Articles in
                    <Button variant="outline" size="sm">
                      {toTitleCase(selectedCategory)}
                    </Button>
                    Category
                  </>
                ) : (
                  "All Articles"
                )}
              </h1>
              <p className="text-muted-foreground">{loading ? "Searching..." : ``}</p>
            </div>

{/* --- ADD THE DYNAMIC FILTER GUIDE HERE --- */}
            {selectedCategory && (
              <DynamicFilterGuide
                categoryName={
                  allCategories.find((c) => c.slug.toLowerCase() === selectedCategory)?.name || toTitleCase(selectedCategory)
                }
                allFilters={smartFilterMap}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
              />
            )}
            {/* --- END --- */}
            {/* --- ADD THIS RESULT COUNT --- */}
            {selectedTags.length > 0 && !loading && (
              <p className="text-sm text-muted-foreground mb-4">
                Found {articles.length} article{articles.length !== 1 ? 's' : ''} matching:{' '}
                {selectedTags.map((tag, index) => (
                  <span key={tag}>
                    <strong className="font-medium text-foreground">{tag}</strong>
                    {index < selectedTags.length - 1 ? ' , ' : ''}
                  </span>
                ))}
                .
              </p>
            )}
            {/* --- END RESULT COUNT --- */}

            {paginatedArticles.map((article) => {
              const ageDays = dayjs().diff(dayjs(article.created_at), "day");

              return (
                <Card
                  key={article.id}
                  className="hover:shadow-md transition-all duration-300 w-full rounded-xl border border-gray-200 bg-white overflow-hidden group"
                >
                  <Link
                    to={`/articles/${article.slug}`} // Make sure this route is correct
                    className="flex flex-row gap-3 p-3 items-start"
                  >
                    {/* Featured Image */}
                    <div className="flex-shrink-0 w-28 h-20 overflow-hidden rounded-lg">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Category */}
                        {article.categories && (
                          <Badge
                            variant="secondary"
                            className="mb-1 text-xs bg-[hsl(10.1,67.8%,95%)] text-[hsl(10.1,67.8%,45%)] px-2 py-0.5 rounded"
                          >
                            {article.categories.name}
                          </Badge>
                        )}
                        {/* Title */}
                        <h3 className="font-semibold text-md text-gray-900 group-hover:text-[hsl(10.1,67.8%,45%)] transition-colors mb-1">
                          {article.title}
                        </h3>
                        {/* Excerpt */}
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {article.excerpt}
                        </p>
                        {/* Filter Labels */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          {/* Show selected tags on the card */}
                          {article.tags && article.tags.map(tag => (
                             <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {article.author|| "Unknown Author"}
                          </span>
                          <span>|</span>
                          <span>
                            {new Date(article.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {/* Article Age */}
                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-50 to-red-50 text-[hsl(10.1,67.8%,45%)] border border-pink-100 shadow-sm">
                            🕒{" "}
                            {ageDays < 30
                              ? `${ageDays}d old`
                              : ageDays < 365
                              ? `${Math.floor(ageDays / 30)}mo old`
                              : `${Math.floor(ageDays / 365)}y old`}
                          </span>
                          <span className="ml-2">{article.views || 0} views</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </Card>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant={page === idx + 1 ? "default" : "outline"}
                    onClick={() => setPage(idx + 1)}
                  >
                    {idx + 1}
                  </Button>
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

export default SearchResults;