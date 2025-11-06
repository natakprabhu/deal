import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/ProductCard";
import { CommentSection } from "@/components/CommentSection";
import { Calendar, User, Lightbulb, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import ReactMarkdown from "react-markdown";

// --- NEW, CORRECTED INTERFACES ---

// This matches the 'products' table (from Doremon.tsx)
interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  image: string;
  pros: string[];
  cons: string[];
  amazon_link: string;
  flipkart_link: string;
  badge: string | null;
  category_id: string | null;
  tags: string[];
  rating: number; // You may need to add 'rating' to your 'products' table. Using 4.5 as fallback.
}

// This is the junction table data
interface ArticleProduct {
  rank: number;
  product_id: string;
  products: Product; // Supabase nests the 'products' data inside here
}

// This matches the 'product_price_history' table
interface PriceHistory {
  id: string;
  product_id: string;
  created_at: string;
  amazon_price: string;
  flipkart_price: string;
  amazon_discount: string | null;
  flipkart_discount: string | null;
}

// This is the final combined data structure we'll use
interface DisplayProduct {
  rank: number;
  product: Product;
  latestPrice: PriceHistory | null;
  previousPrice: PriceHistory | null;
}

interface SmartPick {
  id: string;
  recommendation: string;
}

interface RelatedArticle {
  id: string;
  title: string;
  url: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  author: string | null;
  category: string | null; // This will be populated by the 'categories' table
  category_id: string | null;
  date: string;
  created_at: string;
  tags: string[] | null;
  smart_pick_recommendations: SmartPick[] | null;
  related_articles: RelatedArticle[] | null;
}

interface TopSaleItem {
  model_name: string;
  sales_count: number;
}
// --- END OF INTERFACES ---


/**
 * Helper function to determine price change direction.
 */
const getPriceChangeDirection = (currentPrice: string | null | undefined, previousPrice: string | null | undefined): "up" | "down" | undefined => {
  if (!previousPrice || !currentPrice) return undefined;
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
  const [displayProducts, setDisplayProducts] = useState<DisplayProduct[]>([]);
  const [smartPick, setSmartPick] = useState<SmartPick | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [salesData, setSalesData] = useState<TopSaleItem[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [trivia, setTrivia] = useState<{ title?: string; content: string } | null>(null);
  const [triviaLoading, setTriviaLoading] = useState(false);


  // Fetch all article data using correct nested queries
  useEffect(() => {
    const fetchArticleDetails = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      setNotFound(false);
      setCategoryId(null);

      try {
        // --- QUERY 1: Fetch the Article and its direct relationships ---
        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .select(`
            *,
            categories (id, name, slug), 
            smart_pick_recommendations (*),
            related_articles (*)
          `)
          .eq("slug", slug)
          //.eq("status", "published")
          .single();

        if (articleError && articleError.code === 'PGRST116') {
           setNotFound(true);
           throw new Error("Article not found");
        }
        if (articleError) throw articleError;
        if (!articleData) {
            setNotFound(true);
            throw new Error("Article not found");
        }
        
        // Set Article data
        const fetchedArticle = {
            ...articleData,
            category: articleData.categories?.name || null // Flatten category name
        } as Article;

        setArticle(fetchedArticle);
        setCategoryId(articleData.category_id || null);
        setSmartPick(articleData.smart_pick_recommendations ? articleData.smart_pick_recommendations[0] : null);
        setRelatedArticles(articleData.related_articles || []);
        if (articleData.category_id) {
          fetchTriviaForCategory(articleData.category_id);
        }
        // Fetch random related articles in the same category
          if (articleData.category_id && articleData.id) {
            fetchRelatedArticlesByCategory(articleData.category_id, articleData.id);
          }


        
        // --- QUERY 2: Fetch the Article's Products (using the new schema) ---
        const { data: productsData, error: productsError } = await supabase
          .from("article_products")
          .select(`
            rank,
            product_id,
            products ( * ) 
          `)
          .eq("article_id", articleData.id)
          .order("rank", { ascending: true });
        
        if (productsError) throw productsError;
        
        console.log(productsData);
        const articleProducts = (productsData || []) as ArticleProduct[];
        const productIds = articleProducts.map(p => p.product_id);

        if (productIds.length === 0) {
            setDisplayProducts([]);
            return; // No products to fetch prices for
        }

        // --- QUERY 3: Fetch Price History for these products ---
        const { data: pricesData, error: pricesError } = await supabase
          .from("product_price_history")
          .select("*")
          .in("product_id", productIds)
          .order("created_at", { ascending: false });
        
        if (pricesError) throw pricesError;

        // --- COMBINE DATA: Process prices in JavaScript ---
        const priceHistoryMap = new Map<string, PriceHistory[]>();
        for (const price of pricesData || []) {
            if (!priceHistoryMap.has(price.product_id)) {
                priceHistoryMap.set(price.product_id, []);
            }
            priceHistoryMap.get(price.product_id)!.push(price as PriceHistory);
        }

        const finalDisplayProducts: DisplayProduct[] = articleProducts.map(ap => {
            const history = priceHistoryMap.get(ap.product_id);
            return {
                rank: ap.rank,
                product: ap.products,
                latestPrice: history ? history[0] : null,     // Most recent price
                previousPrice: history ? history[1] : null, // Second most recent price
            };
        });

        setDisplayProducts(finalDisplayProducts);

      } catch (err: any) {
        console.log("Error fetching article:", err.message);
        //console.log(err.message);
        // if (err.message !== "Article not found") {
        //     setError(err.message);
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchArticleDetails();
  }, [slug]);



const fetchRelatedArticlesByCategory = async (categoryId: string, currentArticleId: string) => {
  try {
    const { data, error } = await supabase
      .from("articles")
      .select("id, title, slug, featured_image, excerpt")
      .eq("category_id", categoryId)
      .eq("status", "published")
      .neq("id", currentArticleId)
      .limit(3);

    if (error) throw error;

    setRelatedArticles(data || []);
  } catch (err: any) {
    console.error("Error fetching related articles:", err.message);
    setRelatedArticles([]);
  }
};


const fetchTriviaForCategory = async (categoryId: string) => {
  try {
    setTriviaLoading(true);
    setTrivia(null);

    const { data, error } = await supabase
      .from("trivia")
      .select("id, title, content")
      .eq("category_id", categoryId);

    if (error) {
      console.error("Supabase error while fetching trivia:", error.message);
      throw error;
    }

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomTrivia = data[randomIndex];
      setTrivia(randomTrivia); // { title, content }
    } else {
      setTrivia(null);
    }
  } catch (err: any) {
    console.error("Error fetching trivia:", err.message);
    setTrivia(null);
  } finally {
    setTriviaLoading(false);
  }
};



  // Fetch Sales Data (This remains the same)
  useEffect(() => {
    const fetchTopSales = async () => {
      if (!categoryId) {
        setSalesLoading(false);
        setSalesData([]);
        return;
      }

      setSalesLoading(true);
      setSalesError(null);
      try {
        const { data, error } = await supabase
          .from('top_sales')
          .select('model_name, sales_count')
          .eq('category_id', categoryId)
          .order('sales_count', { ascending: false })
          .limit(5);

        if (error) throw error;
        setSalesData((data || []).reverse()); // .reverse() for horizontal chart
      } catch (err: any) {
        console.error("Error fetching top sales:", err.message);
        setSalesError("Could not load sales data.");
        setSalesData([]);
      } finally {
        setSalesLoading(false);
      }
    };

    fetchTopSales();
  }, [categoryId]); // This effect depends on categoryId

 

  if (loading) {
    // A more comprehensive loading skeleton
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <main className="flex-1 py-12">
                <div className="container mx-auto px-4 grid grid-cols-12 gap-8">
                    {/* Left Skeleton */}
                    <div className="col-span-12 md:col-span-8 space-y-8">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full" />
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <Separator />
                        <Skeleton className="h-96 w-full rounded-lg" />
                        <Skeleton className="h-96 w-full rounded-lg" />
                    </div>
                    {/* Right Skeleton */}
                    <aside className="col-span-12 md:col-span-4 space-y-6">
                        <Skeleton className="h-64 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </aside>
                </div>
            </main>
            <Footer />
        </div>
    );
  }
  
  if (notFound) return <p className="text-center py-12">Article not found</p>;
  if (error) return <p className="text-center py-12 text-destructive">{error}</p>;
  if (!article) return <p className="text-center py-12">An unexpected error occurred.</p>; // Fallback


return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 grid grid-cols-12 gap-8">
          {/* Left Content */}
          <div className="col-span-12 md:col-span-8 space-y-8">
            {/* Article Header */}
            <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 rounded-lg shadow-md">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="bg-primary-foreground text-primary">
                  {article.category || "Uncategorized"}
                </Badge>
                 <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="primary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{article.title}</h1>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>By {article.author || "Our Team"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <p className="mt-4 text-white/90">
                {article.excerpt}
              </p>
            </header>

{article.category_id && (
  <Card className="bg-gradient-to-br from-card to-card/80 border-0 shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-xl">
        <Lightbulb className="h-5 w-5 text-primary" /> 
        {trivia?.title
          ? trivia.title
          : `Did You Know? (${article.category || "Trivia"})`}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {triviaLoading && (
        <p className="text-muted-foreground italic">Loading trivia...</p>
      )}
      {!triviaLoading && trivia && (
        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm md:text-base leading-relaxed">
          <ReactMarkdown>{trivia.content}</ReactMarkdown>
        </div>
      )}
      {!triviaLoading && !trivia && (
        <p className="text-sm text-muted-foreground italic">
          No trivia available for this category yet.
        </p>
      )}
    </CardContent>
  </Card>
)}



            

          {/* --- Article Content --- */}
            <div
              className="prose prose-orange max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            <Separator className="my-8" />

          {/* --- Product Reviews --- */}
          <section className="space-y-8">
            <h2 className="text-3xl font-bold">Detailed Reviews</h2>
            
            {/* Map over the new 'displayProducts' state */}
            {displayProducts.map((item) => {
              const { product, latestPrice, previousPrice, rank } = item;
              return (
                <ProductCard 
                  key={product.id}
                  rank={rank}
                  name={product.slug}
                  image={product.image}
                  rating={product.rating || 4.5} // Use product rating or fallback
                  pros={product.pros}
                  cons={product.cons}
                  amazonPrice={parseFloat(latestPrice?.amazon_price || "0")}
                  amazonDiscount={parseFloat(latestPrice?.amazon_discount || "0")}
                  amazonPriceChange={getPriceChangeDirection(latestPrice?.amazon_price, previousPrice?.amazon_price)}
                  amazonLink={product.amazon_link}
                  flipkartPrice={parseFloat(latestPrice?.flipkart_price || "0")}
                  flipkartDiscount={parseFloat(latestPrice?.flipkart_discount || "0")}
                  flipkartPriceChange={getPriceChangeDirection(latestPrice?.flipkart_price, previousPrice?.flipkart_price)}
                  flipkartLink={product.flipkart_link}
                  badge={product.badge}
                />
              )
            })}
          </section>

            <Separator className="my-8" />

            {/* Comments */}
            <CommentSection articleId={article.id} />
          </div>

          {/* Right Sidebar */}
        <aside className="col-span-12 md:col-span-4 space-y-6">
          {/* Top Products Sales Chart */}
          <Card className="bg-white p-4 rounded-lg shadow-md">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                 <TrendingUp className="h-5 w-5 text-primary" />
                 Top Selling Models
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {salesLoading && (
                <div className="space-y-2 h-[220px]">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-5/6" />
                  <Skeleton className="h-8 w-4/6" />
                  <Skeleton className="h-8 w-3/6" />
                  <Skeleton className="h-8 w-2/6" />
                </div>
              )}
              {salesError && <p className="text-destructive text-center h-[220px] flex items-center justify-center">{salesError}</p>}
              {!salesLoading && !salesError && salesData.length === 0 && (
                <p className="text-muted-foreground text-center h-[220px] flex items-center justify-center">
                  No sales data available.
                </p>
              )}
              {!salesLoading && !salesError && salesData.length > 0 && (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={salesData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="model_name"
                      type="category"
                      width={140}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                    />
                    <Tooltip
                       formatter={(value: number) => [`${value}`, "Sales"]}
                       cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                       contentStyle={{
                         backgroundColor: 'hsl(var(--background))',
                         borderColor: 'hsl(var(--border))',
                         borderRadius: 'var(--radius)',
                         fontSize: '12px'
                       }}
                    />
                    <Bar
                      dataKey="sales_count"
                      fill="hsl(var(--primary))"
                      radius={4}
                      barSize={20}
                    >
                      <LabelList
                        dataKey="sales_count"
                        position="right"
                        offset={8}
                        fill="hsl(var(--foreground))"
                        fontSize={12}
                        fontWeight="500"
                        formatter={(value: number) => `${value}`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

            {/* Related Articles */}
{/* Related Articles */}
<div className="bg-white p-4 rounded-lg shadow-md space-y-3">
  <h2 className="text-lg font-bold">Related Articles</h2>
  {relatedArticles && relatedArticles.length > 0 ? (
    <ul className="space-y-3">
      {relatedArticles.map((related) => (
        <li key={related.id}>
          <Link 
            to={`/articles/${related.slug}`} 
            className="flex items-center gap-3 hover:bg-muted p-2 rounded-md transition"
          >
            <img
              src={related.featured_image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=100"}
              alt={related.title}
              className="w-16 h-16 rounded-md object-cover"
            />
            <div className="flex flex-col">
              <span className="font-medium text-sm text-foreground line-clamp-2">
                {related.title}
              </span>
              <span className="text-xs text-muted-foreground line-clamp-1">
                {related.excerpt || ""}
              </span>
            </div>
          </Link>
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
