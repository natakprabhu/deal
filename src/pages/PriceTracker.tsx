import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Product = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
  price_history: Array<{
    old_price: number;
    new_price: number;
    changed_at: string;
  }>;
};

const PriceTracker = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrackedProducts = async () => {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(`
            id,
            title,
            image_url,
            price
          `)
          .limit(5);

        if (productsError) throw productsError;

        if (productsData) {
          const productsWithHistory = await Promise.all(
            productsData.map(async (product) => {
              const { data: historyData } = await supabase
                .from("price_history")
                .select("old_price, new_price, changed_at")
                .eq("product_id", product.id)
                .order("changed_at", { ascending: false })
                .limit(10);

              return {
                ...product,
                price_history: historyData || [],
              };
            })
          );

          setProducts(productsWithHistory);
        }
      } catch (error) {
        console.error("Error fetching tracked products:", error);
        toast({
          title: "Error",
          description: "Failed to load tracked products",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedProducts();
  }, [toast]);

  const getLowestPrice = (product: Product) => {
    if (product.price_history.length === 0) return product.price;
    const allPrices = [
      product.price,
      ...product.price_history.map((h) => h.new_price),
    ];
    return Math.min(...allPrices);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-4">📊 Price Tracker</h1>
            <p className="text-muted-foreground mb-8">
              Track your products like stock charts – never miss a price drop!
            </p>
            
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading tracked products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No tracked products available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {products.map((product) => {
                  const lowestPrice = getLowestPrice(product);
                  const lastChange = product.price_history[0];

                  return (
                    <Card key={product.id} className="hover:shadow-hover transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          <img
                            src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"}
                            alt={product.title}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                                <div className="text-xl font-bold">₹{product.price.toLocaleString()}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Lowest Ever</div>
                                <div className="text-xl font-bold text-primary">₹{lowestPrice.toLocaleString()}</div>
                              </div>
                            </div>
                            
                            {lastChange && (
                              <div className="bg-muted/30 p-3 rounded-lg mb-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Last Price Change</div>
                                    <div className="text-sm">
                                      ₹{lastChange.old_price.toLocaleString()} → ₹{lastChange.new_price.toLocaleString()}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(lastChange.changed_at), "dd MMM yyyy")}
                                    </div>
                                  </div>
                                  <Badge variant="secondary">
                                    <TrendingDown className="w-3 h-3 mr-1" />
                                    Tracking
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PriceTracker;
