import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Product = {
  id: string;
  title: string;
  image_url: string | null;
  price: number;
  mrp: number | null;
  discount_percent: number | null;
  affiliate_url: string;
  categories: { name: string } | null;
};

const Deals = () => {
  const [deals, setDeals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id,
            title,
            image_url,
            price,
            mrp,
            discount_percent,
            affiliate_url,
            categories (name)
          `)
          .gte("discount_percent", 25)
          .order("discount_percent", { ascending: false })
          .limit(12);

        if (error) throw error;
        setDeals(data || []);
      } catch (error) {
        console.error("Error fetching deals:", error);
        toast({
          title: "Error",
          description: "Failed to load deals",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <Flame className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Today's Best Deals</h1>
          </div>
          
          {/* Deals Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading deals...</p>
            </div>
          ) : deals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No deals available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => (
                <Card key={deal.id} className="group hover:shadow-hover transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="relative mb-4">
                      <img
                        src={deal.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"}
                        alt={deal.title}
                        className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                        {deal.discount_percent}% OFF
                      </Badge>
                    </div>
                    
                    <div className="text-xs font-medium text-primary mb-2">
                      {deal.categories?.name || "Product"}
                    </div>
                    <h3 className="font-semibold text-lg mb-3 line-clamp-2">{deal.title}</h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">₹{deal.price.toLocaleString()}</span>
                        {deal.mrp && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{deal.mrp.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => window.open(deal.affiliate_url, "_blank")}
                    >
                      Buy Now
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Deals;
