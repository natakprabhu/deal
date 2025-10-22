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
const toTitleCase = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get("category");

  const [allCategories, setAllCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<number | null>(null);
  const [selectedAgeFilter, setSelectedAgeFilter] = useState<number | null>(null);
  const [selectedSort, setSelectedSort] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
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
      setSelectedCategory(categorySlug.toLowerCase());
    }
  }, [categorySlug]);

  // Fetch articles
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        let queryBuilder = supabase
          .from("articles")
          .select("*, categories(name)")
          .eq("status", "published");

        if (selectedCategory) {
          const { data: catData } = await supabase
            .from("categories")
            .select("id")
            .ilike("slug", selectedCategory)
            .maybeSingle();

          if (catData) queryBuilder = queryBuilder.eq("category_id", catData.id);
          else {
            setArticles([]);
            return;
          }
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;

        let filtered = data || [];

        // Price filter
        if (selectedPriceFilter) {
          filtered = filtered.filter((a: any) => (a.price || 0) <= selectedPriceFilter);
        }

        // Age filter
        if (selectedAgeFilter) {
          filtered = filtered.filter((a: any) =>
            dayjs(a.created_at).isAfter(dayjs().subtract(selectedAgeFilter, "month"))
          );
        }

        // Sort
        if (selectedSort === "newest") {
          filtered.sort((a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf());
        } else if (selectedSort === "oldest") {
          filtered.sort((a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf());
        } else if (selectedSort === "most_liked") {
          filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
        }

        setArticles(filtered);
      } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to fetch articles", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [selectedCategory, selectedPriceFilter, selectedAgeFilter, selectedSort, toast]);

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
                  onChange={() => setSelectedCategory(null)}
                />
                <span>All Categories</span>
              </label>

              {allCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.slug.toLowerCase()}
                    onChange={() => setSelectedCategory(cat.slug.toLowerCase())}
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
                    onClick={() => setSelectedPriceFilter(filter.value)}
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
                    onClick={() => setSelectedAgeFilter(filter.value)}
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
                    onClick={() => setSelectedSort(sort.value)}
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


              <p className="text-muted-foreground">{loading ? "Searching..." : `${articles.length} articles found`}</p>
            </div>

{paginatedArticles.map((article) => {
  const ageDays = dayjs().diff(dayjs(article.created_at), "day");

  return (
    <Card
      key={article.id}
      className="hover:shadow-md transition-all duration-300 w-full rounded-xl border border-gray-200 bg-white overflow-hidden group"
    >
      <Link
        to={`/articles/${article.slug}`}
        className="flex flex-row gap-3 p-3 items-start"
      >
        {/* 🖼️ Featured Image */}
        <div className="flex-shrink-0 w-28 h-20 overflow-hidden rounded-lg">
          <img
            src={article.featured_image}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        {/* 📄 Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* 🏷️ Category */}
            {article.categories && (
              <Badge
                variant="secondary"
                className="mb-1 text-xs bg-[hsl(10.1,67.8%,95%)] text-[hsl(10.1,67.8%,45%)] px-2 py-0.5 rounded"
              >
                {article.categories.name}
              </Badge>
            )}

            {/* 📰 Title */}
            <h3 className="font-semibold text-md text-gray-900 group-hover:text-[hsl(10.1,67.8%,45%)] transition-colors mb-1">
              {article.title}
            </h3>

            {/* 📘 Excerpt */}
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">
              {article.excerpt}
            </p>

            {/* 🌈 Filter Labels */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              {/* 💰 Price Filter */}
              <Badge
                className={`flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 shadow-sm ${
                  selectedPriceFilter
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}
              >
                💰{" "}
                {selectedPriceFilter
                  ? `Under ₹${selectedPriceFilter / 1000}K`
                  : "All Prices"}
              </Badge>

              {/* ⏳ Age Filter */}
              <Badge
                className={`flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 shadow-sm ${
                  selectedAgeFilter
                    ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}
              >
                ⏳{" "}
                {selectedAgeFilter
                  ? selectedAgeFilter === 1
                    ? "This Month"
                    : selectedAgeFilter === 6
                    ? "Past 6 Months"
                    : "Past Year"
                  : "All Time"}
              </Badge>

              {/* 🔽 Sort Filter */}
              <Badge
                className={`flex items-center gap-1 text-[11px] font-medium rounded-full px-2.5 py-0.5 shadow-sm ${
                  selectedSort
                    ? "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200"
                    : "bg-gray-50 text-gray-500 border border-gray-200"
                }`}
              >
                🔽{" "}
                {selectedSort
                  ? toTitleCase(selectedSort.replace("_", " "))
                  : "Default Sort"}
              </Badge>
            </div>
          </div>

          {/* 📆 Meta Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
            <div className="flex items-center gap-1">
              <span className="font-medium">
                {article.author_name || "Unknown Author"}
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

            {/* 🕒 Article Age */}
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
