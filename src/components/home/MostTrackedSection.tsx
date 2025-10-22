import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Product = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
  discount_percent: number | null;
  affiliate_url: string;
};

const MostTrackedSection = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, title, image_url, price, discount_percent, affiliate_url")
        .not("discount_percent", "is", null)
        .order("discount_percent", { ascending: false })
        .limit(3);

      if (data) setProducts(data);
    };

    fetchProducts();
  }, []);

  return (
    <section className="py-12 bg-muted/20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8">🔥 Most Tracked Products</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="hover:shadow-hover transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={product.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"}
                    alt={product.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">{product.title}</h3>
                    {product.discount_percent && (
                      <Badge variant="secondary" className="text-xs">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        {product.discount_percent}% off
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Current Price:</span>
                    <span className="font-bold text-primary">₹{product.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    className="flex-1" 
                    size="sm"
                    onClick={() => window.open(product.affiliate_url, "_blank")}
                  >
                    Buy Now
                  </Button>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MostTrackedSection;
