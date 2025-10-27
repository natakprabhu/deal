import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/ProductCard";
import { SmartPick } from "@/components/SmartPick";
import { CommentSection } from "@/components/CommentSection";
import { Calendar, User } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, Cell } from "recharts";

// FIX 1: Updated Top10Product type to match Supabase schema
type Top10Product = {
  id: string;
  article_id: string;
  rank: number;
  name: string;
  image: string;
  rating: string; // From Supabase data, this is a string
  short_description: string;
  pros: string[]; // From Supabase data
  cons: string[]; // From Supabase data
  amazon_price: string; // From Supabase data
  amazon_discount: string; // From Supabase data
  amazon_price_change: string; // From Supabase data (seems to be previous price)
  amazon_link: string;
  flipkart_price: string; // From Supabase data
  flipkart_discount: string; // From Supabase data
  flipkart_price_change: string; // From Supabase data (seems to be previous price)
  flipkart_link: string;
  badge: string | null; // From Supabase data
};

// FIX 2: Updated SmartPick type to match Supabase schema
type SmartPick = {
  id: string;
  article_id: string;
  filters: any; // Assuming JSONB or text, 'any' is safe
  recommendation: string;
};

type RelatedArticle = {
  id: string;
  title: string;
  url: string; // Assuming this is a full URL, not a slug
};

// FIX 3: Updated Article type to match Supabase schema
type Article = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null; // Added excerpt, as it's used in the JSX
  featured_image: string | null;
  author_id: string | null;
  status: string;
  views: number;
  created_at: string;
  updated_at: string;
  author: string | null; // Assuming 'author' is a name/string
  category: string | null;
  date: string;
  category_id: string | null;
};

// FIX 4: Removed the hardcoded 'products' array. We will use 'top10Products' from state.

// This data is for the sidebar chart, not the main product list. It's fine to keep.
const topProductsChartData = [
  { name: "Elica 90cm Auto Clean", orders: 120 },
  { name: "Faber 60cm Curved Glass", orders: 95 },
  { name: "Hindware Smart 90cm", orders: 80 },
  { name: "Glen Filterless 60cm", orders: 60 },
  { name: "Sunflame 75cm Chimney", orders: 50 },
];

/**
 * Helper function to determine price change direction.
 * Assumes 'priceChange' is the *previous* price.
 */
const getPriceChangeDirection = (currentPrice: string, previousPrice: string): "up" | "down" | undefined => {
  const current = parseFloat(currentPrice);
  const previous = parseFloat(previousPrice);
  if (isNaN(current) || isNaN(previous)) return undefined;
  if (current < previous) return "down";
  if (current > previous) return "up";
  return undefined;
};


const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [top10Products, setTop10Products] = useState<Top10Product[]>([]);
  const [smartPick, setSmartPick] = useState<SmartPick | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [filters, setFilters] = useState<{
    usage?: string;
    maintenance?: string;
    priceRange?: string;
  }>({});


  const handleFilterChange = (category: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [category]: prev[category as keyof typeof prev] === value ? undefined : value,
    }));
  };

  // FIX 5: Updated getRecommendation to use the fetched smartPick as a fallback.
  const getRecommendation = () => {
    if (filters.usage === "high" && filters.maintenance === "easy") {
      return "For high oil usage with easy maintenance, we recommend models with auto-clean technology and powerful suction (1200+ m³/hr).";
    }
    if (filters.priceRange === "5-10" && filters.usage === "low") {
      return "For budget-conscious buyers with low oil usage, the Glen filterless models offer excellent value.";
    }
    if (filters.maintenance === "frequent") {
      return "If you prefer manual control and frequent cleaning, baffle filter models give you the best balance of performance and longevity.";
    }
    // Use the recommendation from Supabase as the default, or a final fallback.
    return smartPick?.recommendation || "Select your preferences above to get personalized recommendations. Our smart algorithm will suggest the best chimney models based on your specific needs.";
  };
  
useEffect(() => {
    const fetchArticleDetails = async () => {
      if (!slug) return;
      setLoading(true);

      try {
        // --- THIS IS THE NEW, EFFICIENT QUERY ---
        const { data, error } = await supabase
          .from("articles")
          .select(`
            *,
            categories(name, slug),
            top10_products(*),
            smart_pick_recommendations(*),
            related_articles(*)
          `)
          .eq("slug", slug)
          //.eq("status", "published") // Ensure only published are visible
          .single();
        // --- END OF NEW QUERY ---

        if (error) {
          throw error;
        }

        if (data) {
          // All data (article, products, smart_pick, etc.)
          // is now available in this single 'data' object.
          // Supabase will automatically nest them as arrays.
          
          // Example:
          // data.top10_products will be an array
          // data.smart_picks will be an object
          
          setArticle(data);
          
          // You may need to adjust your state if you were
          // storing products/picks in separate states before.
        } else {
          setNotFound(true);
        }

      } catch (err: any) {
        console.error("Error fetching article:", err.message);
        setError("Failed to load article.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetails();
  }, [slug]);

  if (loading) return <p className="text-center py-12">Loading article...</p>;
  if (!article) return <p className="text-center py-12">Article not found</p>;


return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 grid grid-cols-12 gap-8">
          {/* Left Content */}
          <div className="col-span-12 md:col-span-8 space-y-8">
            {/* Article Header */}
            <header className="bg-gradient-to-r from-orange-400 to-orange-600 text-white p-6 rounded-lg shadow-md">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-white text-orange-600">
                  {/* Using category from fetched article */}
                  {article.category || "Uncategorized"}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{article.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {/* Using author from fetched article or a fallback */}
                  <span>By {article.author || "Our Team"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="mt-4 text-white/90">
                {/* Using excerpt from fetched article */}
                {article.excerpt}
              </p>
            </header>

            {/* Smart Pick */}
            <SmartPick activeFilters={filters} onFilterChange={handleFilterChange} recommendation={getRecommendation()} />

            <Separator className="my-8" />

          {/* Product Reviews */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Detailed Reviews</h2>
            
            {/* FIX 6: Render article.content as HTML, not in a <code> tag */}
            <div
              className="prose prose-orange max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            
            {/* FIX 7: Map over 'top10Products' from state, not the hardcoded array.
                We also transform the props to match what ProductCard expects
                (e.g., converting string prices/ratings to numbers). */}
            {top10Products.map((product) => (
              <ProductCard 
                key={product.id}
                rank={product.rank}
                name={product.name}
                image={product.image}
                rating={parseFloat(product.rating)} // Convert string to number
                pros={product.pros}
                cons={product.cons}
                amazonPrice={parseFloat(product.amazon_price)} // Convert string to number
                amazonDiscount={parseFloat(product.amazon_discount)} // Convert string to number
                amazonPriceChange={getPriceChangeDirection(product.amazon_price, product.amazon_price_change)}
                amazonLink={product.amazon_link}
                flipkartPrice={parseFloat(product.flipkart_price)} // Convert string to number
                flipkartDiscount={parseFloat(product.flipkart_discount)} // Convert string to number
                flipkartPriceChange={getPriceChangeDirection(product.flipkart_price, product.flipkart_price_change)}
                flipkartLink={product.flipkart_link}
                badge={product.badge}
              />
            ))}
          </section>

            <Separator className="my-8" />

            {/* Comments */}
            <CommentSection />
          </div>

          {/* Right Sidebar */}
          <aside className="col-span-12 md:col-span-4 space-y-6">
            {/* Top Products Orders Chart */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Top Products by Orders</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={topProductsChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  barCategoryGap="8%"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fontWeight: 500 }}
                  />
                  <Tooltip formatter={(value: number) => [`${value}`, "Orders"]} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Bar dataKey="orders" fill="#f97316" radius={4} barSize={22}>
                    {/* FIX 8: Simplified LabelList formatter */}
                    <LabelList
                      dataKey="orders"
                      position="insideRight"
                      fill="white"
                      fontWeight="bold"
                      formatter={(value: number) => `${value}`}
                    />
                    {topProductsChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#f97316" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* FIX 9: Replaced placeholder with dynamic Related Articles from state */}
            <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
              <h2 className="text-lg font-bold">Related Articles</h2>
              {relatedArticles.length > 0 ? (
                <ul className="space-y-2">
                  {relatedArticles.map((related) => (
                    <li key={related.id}>
                      {/* Assuming 'related.url' is a full external URL. If it's an internal
                          slug (e.g., /my-other-post), use <Link to={related.url}> */}
                      <a 
                        href={related.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-orange-600 hover:underline"
                      >
                        {related.title}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No related articles found.</p>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
