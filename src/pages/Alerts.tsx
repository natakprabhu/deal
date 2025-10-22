import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ExternalLink } from "lucide-react";

const sampleAlerts = [
  {
    id: 1,
    name: "Elica 60cm Auto Clean Kitchen Chimney",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=200&h=200&fit=crop",
    targetPrice: 8000,
    amazonPrice: 7999,
    flipkartPrice: 8499,
    lowestPrice: 7999,
    lowestPriceDate: "Today",
    bestDeal: "amazon",
  },
];

const Alerts = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Bell className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Price Alerts</h1>
            </div>
            
            {sampleAlerts.length > 0 ? (
              <div className="space-y-6">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-semibold text-primary mb-1">Good news!</div>
                    <p className="text-sm">Your Chimney price dropped on Amazon to match your target price.</p>
                  </div>
                </div>
                
                {sampleAlerts.map((alert) => (
                  <Card key={alert.id} className="hover:shadow-hover transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <img
                          src={alert.image}
                          alt={alert.name}
                          className="w-full md:w-48 h-48 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-2">{alert.name}</h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Amazon</div>
                                <div className="text-xl font-bold text-green-600">
                                  ₹{alert.amazonPrice.toLocaleString()}
                                </div>
                                {alert.bestDeal === "amazon" && (
                                  <Badge variant="default" className="text-xs">Best Deal!</Badge>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="text-xs text-muted-foreground">Flipkart</div>
                                <div className="text-xl font-bold">
                                  ₹{alert.flipkartPrice.toLocaleString()}
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-muted/30 p-3 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Your Target Price</div>
                                  <div className="text-lg font-bold text-primary">₹{alert.targetPrice.toLocaleString()}</div>
                                </div>
                                <Badge variant="default">Target Hit! 🎯</Badge>
                              </div>
                            </div>
                          </div>
                          
                          <Button className="w-full">
                            Buy Now on {alert.bestDeal === "amazon" ? "Amazon" : "Flipkart"}
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                  <p className="text-muted-foreground">
                    Add products to your wishlist and set target prices to get alerts.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Alerts;
