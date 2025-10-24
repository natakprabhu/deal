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

type Top10Product = {
  id: string;
  rank: number;
  name: string;
  short_description: string;
  image: string;
  rating: number;
  amazon_price: number;
  amazon_link: string;
  flipkart_price: number;
  flipkart_link: string;
};

type SmartPick = {
  id: string;
  recommendation: string;
};

type RelatedArticle = {
  id: string;
  title: string;
  url: string;
};

type Article = {
  id: string;
  title: string;
  content: string;
  featured_image: string | null;
  views: number;
  created_at: string;
  category: string | null;
};

const products = [
  {
    rank: 1,
    name: "Elica 90cm Auto Clean Chimney",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop",
    rating: 4.5,
    pros: ["Auto-clean technology saves time", "1200 m³/hr powerful suction", "Touch controls with LED display", "Energy efficient motor"],
    cons: ["Higher price point", "Installation requires professional help"],
    amazonPrice: 15999,
    amazonDiscount: 25,
    amazonPriceChange: "down" as const,
    amazonLink: "https://amazon.in",
    flipkartPrice: 16499,
    flipkartDiscount: 22,
    flipkartPriceChange: "up" as const,
    flipkartLink: "https://flipkart.com",
    badge: "Editor's Choice",
  },
  {
    rank: 2,
    name: "Faber 60cm Curved Glass Chimney",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop",
    rating: 4.3,
    pros: ["Sleek curved glass design", "1000 m³/hr suction power", "Baffle filters for easy cleaning", "Affordable price point"],
    cons: ["No auto-clean feature", "Slightly noisy at high speed"],
    amazonPrice: 8999,
    amazonDiscount: 30,
    amazonLink: "https://amazon.in",
    flipkartPrice: 9299,
    flipkartDiscount: 28,
    flipkartLink: "https://flipkart.com",
    badge: "Best Value",
  },
  {
    rank: 3,
    name: "Hindware Smart 90cm Kitchen Chimney",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop",
    rating: 4.4,
    pros: ["Smart motion sensor controls", "1150 m³/hr suction capacity", "Premium build quality", "5-year warranty"],
    cons: ["Premium pricing", "Motion sensor can be oversensitive"],
    amazonPrice: 18999,
    amazonDiscount: 20,
    amazonPriceChange: "down" as const,
    amazonLink: "https://amazon.in",
    flipkartPrice: 19499,
    flipkartDiscount: 18,
    flipkartLink: "https://flipkart.com",
    badge: "Smart Pick",
  },
];

const topProducts = [
  { name: "Elica 90cm Auto Clean", orders: 120 },
  { name: "Faber 60cm Curved Glass", orders: 95 },
  { name: "Hindware Smart 90cm", orders: 80 },
  { name: "Glen Filterless 60cm", orders: 60 },
  { name: "Sunflame 75cm Chimney", orders: 50 },
];


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
    return "Select your preferences above to get personalized recommendations. Our smart algorithm will suggest the best chimney models based on your specific needs.";
  };
  
  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        setLoading(true);

        // Fetch article
        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .single();

        if (articleError) throw articleError;
        setArticle(articleData);

        // Increment views
        await supabase
          .from("articles")
          .update({ views: (articleData.views || 0) + 1 })
          .eq("id", articleData.id);

        // Fetch Top 10 products
        const { data: top10Data, error: top10Error } = await supabase
          .from("top10_products")
          .select("*")
          .eq("article_id", articleData.id)
          .order("rank", { ascending: true });

        if (top10Error) throw top10Error;
        setTop10Products(top10Data || []);

        // Fetch Smart Pick recommendation
        const { data: smartPickData, error: smartPickError } = await supabase
          .from("smart_pick_recommendations")
          .select("*")
          .eq("article_id", articleData.id)
          .single();

        if (smartPickError && smartPickError.code !== "PGRST116") throw smartPickError; // ignore "no rows" error
        setSmartPick(smartPickData || null);

        // Fetch related articles
        const { data: relatedData, error: relatedError } = await supabase
          .from("related_articles")
          .select("*")
          .eq("article_id", articleData.id);

        if (relatedError) throw relatedError;
        setRelatedArticles(relatedData || []);
      } catch (error) {
        console.error("Error fetching article:", error);
        toast({
          title: "Error",
          description: "Failed to load article",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchArticleData();
  }, [slug, toast]);

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
                  Kitchen Appliances
                </Badge>
                <Badge variant="secondary" className="bg-white text-orange-600">
                  Chimney Reviews
                </Badge>
                <Badge variant="secondary" className="bg-white text-orange-600">
                  2025 Guide
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{article.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>By Priya Sharma</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="mt-4 text-white/90">
                {article.content}
              </p>
            </header>

            {/* Smart Pick */}
            <SmartPick activeFilters={filters} onFilterChange={handleFilterChange} recommendation={getRecommendation()} />

            <Separator className="my-8" />

         {/* Product Reviews */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Top 10 Kitchen Chimneys - Detailed Reviews</h2>
            {products.map((product) => (
              <ProductCard key={product.rank} {...product} />
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
                  data={topProducts}
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
                    <LabelList
                      dataKey="orders"
                      position="insideRight"
                      fill="white"
                      fontWeight="bold"
                      formatter={(value, _, props) => {
                        return props?.payload ? `${props.payload.name}: ${value}` : `${value}`;
                      }}
                    />
                    {topProducts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#f97316" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Related Articles Placeholder */}
            <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
              <h2 className="text-lg font-bold">Related Articles</h2>
              <ul className="space-y-2">
                <li><a href="#" className="text-orange-600 hover:underline">Top 5 Kitchen Chimneys under ₹10K</a></li>
                <li><a href="#" className="text-orange-600 hover:underline">How to Choose the Perfect Chimney for Indian Cooking</a></li>
                <li><a href="#" className="text-orange-600 hover:underline">Maintenance Tips for Your Kitchen Chimney</a></li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
