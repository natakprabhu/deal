import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
  mrp: number | null;
  discount_percent: number | null;
  rating: number | null;
  affiliate_url: string;
  stores: {
    name: string;
    logo_url: string | null;
  };
};

type Article = {
  id: string;
  title: string;
  content: string;
  featured_image: string | null;
  views: number;
  created_at: string;
  categories: {
    name: string;
  } | null;
};

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchArticleAndProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch article
        const { data: articleData, error: articleError } = await supabase
          .from("articles")
          .select(`
            id,
            title,
            content,
            featured_image,
            views,
            created_at,
            categories (
              name
            )
          `)
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (articleError) throw articleError;
        setArticle(articleData);

        // Increment view count
        await supabase
          .from("articles")
          .update({ views: (articleData.views || 0) + 1 })
          .eq("id", articleData.id);

        // Fetch related products
        const { data: productData, error: productError } = await supabase
          .from("article_products")
          .select(`
            products (
              id,
              title,
              image_url,
              price,
              mrp,
              discount_percent,
              rating,
              affiliate_url,
              stores (
                name,
                logo_url
              )
            )
          `)
          .eq("article_id", articleData.id)
          .order("position", { ascending: true });

        if (productError) throw productError;
        setProducts(productData?.map((item: any) => item.products).filter(Boolean) || []);
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

    if (slug) {
      fetchArticleAndProducts();
    }
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading article...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <Button asChild>
              <Link to="/articles">Back to Articles</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <article className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            {article.categories && (
              <Badge variant="secondary" className="mb-4">
                {article.categories.name}
              </Badge>
            )}
            <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{new Date(article.created_at).toLocaleDateString("en-IN", { 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}</span>
              <span>•</span>
              <span>{article.views} views</span>
            </div>
          </div>

          {/* Featured Image */}
          {article.featured_image && (
            <img
              src={article.featured_image}
              alt={article.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg leading-relaxed whitespace-pre-line">{article.content}</p>
          </div>

          {/* Related Products */}
          {products.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Recommended Products</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-hover transition-all duration-300">
                    <img
                      src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"}
                      alt={product.title}
                      className="w-full h-48 object-cover"
                    />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {product.stores.logo_url && (
                          <img src={product.stores.logo_url} alt={product.stores.name} className="h-4" />
                        )}
                        <span className="text-xs text-muted-foreground">{product.stores.name}</span>
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold">₹{product.price.toLocaleString()}</span>
                        {product.mrp && product.mrp > product.price && (
                          <>
                            <span className="text-xs text-muted-foreground line-through">₹{product.mrp.toLocaleString()}</span>
                            {product.discount_percent && (
                              <Badge variant="secondary" className="text-xs">
                                {product.discount_percent}% OFF
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => window.open(product.affiliate_url, "_blank")}
                      >
                        View Deal
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default ArticleDetail;
