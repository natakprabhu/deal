import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react"; // <-- IMPORT
import { supabase } from "@/integrations/supabase/client"; // <-- IMPORT
import { Skeleton } from "@/components/ui/skeleton"; // <-- IMPORT

// 1. Define the type for the article data
type Article = {
  slug: string;
  title: string;
  featured_image: string;
  excerpt: string;
  categories: { name: string } | null;
};

// 2. A small component for the loading placeholder
const SkeletonCard = () => (
  <Card className="overflow-hidden">
    <Skeleton className="aspect-video w-full" />
    <CardContent className="p-6">
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <Skeleton className="h-9 w-24" />
    </CardContent>
  </Card>
);

const TopArticlesSection = () => {
  // 3. Set up state for articles and loading
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // 4. Add useEffect to fetch data on component mount
  useEffect(() => {
    const fetchRandomArticles = async () => {
      setLoading(true);

      // Get the date from 30 days ago
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      // Fetch the 20 newest articles from the last 30 days
      const { data, error } = await supabase
        .from("articles")
        .select("title, slug, featured_image, excerpt, categories(name)")
        .eq("status", "published")
        .gte("created_at", thirtyDaysAgo) // Filter for "This Month"
        .order("created_at", { ascending: false })
        .limit(20); // Fetch 20 to shuffle

      if (error) {
        console.error("Error fetching articles:", error);
      } else if (data) {
        // Shuffle the 20 articles and pick the first 6
        const shuffled = data.sort(() => 0.5 - Math.random());
        setArticles(shuffled.slice(0, 3));
      }
      setLoading(false);
    };

    fetchRandomArticles();
  }, []); // Empty array means this runs once

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold"> Top Articles This Month</h2>
          <Button variant="ghost" asChild>
            <Link to="/articles">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 5. Add loading state */}
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            // 6. Map over the fetched articles state
            articles.map((article) => (
              <Card
                key={article.slug} // Use slug as key
                className="group overflow-hidden hover:shadow-hover transition-all duration-300"
              >
                <Link to={`/articles/${article.slug}`}>
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={
                        article.featured_image ||
                        "public/test.jpg"
                      }
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                <CardContent className="p-6">
                  <div className="text-xs font-medium text-primary mb-2">
                    {article.categories?.name || "Uncategorized"}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                    <Link to={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {article.excerpt}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/articles/${article.slug}`}>Read More</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TopArticlesSection;
