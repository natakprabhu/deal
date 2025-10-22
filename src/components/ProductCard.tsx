import { ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  rank: number;
  name: string;
  image: string;
  rating: number;
  pros: string[];
  cons: string[];
  amazonPrice: number;
  amazonDiscount?: number;
  amazonPriceChange?: "up" | "down";
  amazonLink: string;
  flipkartPrice: number;
  flipkartDiscount?: number;
  flipkartPriceChange?: "up" | "down";
  flipkartLink: string;
  badge?: string;
}

export const ProductCard = ({
  rank,
  name,
  image,
  rating,
  pros,
  cons,
  amazonPrice,
  amazonDiscount,
  amazonPriceChange,
  amazonLink,
  flipkartPrice,
  flipkartDiscount,
  flipkartPriceChange,
  flipkartLink,
  badge,
}: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-hover transition-all duration-300">
      <div className="flex flex-col md:flex-row gap-6 p-6">
        {/* Rank Badge */}
        <div className="absolute top-4 left-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
          {rank}
        </div>

        {/* Product Image */}
        <div className="relative w-full md:w-64 h-64 flex-shrink-0 mt-8 md:mt-0">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover rounded-lg"
          />
          {badge && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              {badge}
            </Badge>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">{name}</h3>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < rating ? "text-yellow-500" : "text-muted"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-muted-foreground">({rating}/5)</span>
            </div>
          </div>

          {/* Pros */}
          <div>
            <h4 className="font-semibold text-success mb-2">✓ Pros:</h4>
            <ul className="space-y-1">
              {pros.map((pro, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-success">•</span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div>
            <h4 className="font-semibold text-destructive mb-2">✗ Cons:</h4>
            <ul className="space-y-1">
              {cons.map((con, idx) => (
                <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  {con}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {/* Amazon */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Amazon:</span>
                <span className="text-xl font-bold text-foreground">
                  ₹{amazonPrice.toLocaleString()}
                </span>
                {amazonPriceChange && (
                  <span
                    className={`flex items-center text-sm ${
                      amazonPriceChange === "down" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {amazonPriceChange === "down" ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </span>
                )}
              </div>
              {amazonDiscount && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  {amazonDiscount}% OFF
                </Badge>
              )}
              <Button
                asChild
                className="w-full bg-gradient-accent hover:opacity-90"
              >
                <a href={amazonLink} target="_blank" rel="noopener noreferrer">
                  Check on Amazon
                  <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>

            {/* Flipkart */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Flipkart:</span>
                <span className="text-xl font-bold text-foreground">
                  ₹{flipkartPrice.toLocaleString()}
                </span>
                {flipkartPriceChange && (
                  <span
                    className={`flex items-center text-sm ${
                      flipkartPriceChange === "down" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {flipkartPriceChange === "down" ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </span>
                )}
              </div>
              {flipkartDiscount && (
                <Badge variant="secondary" className="bg-success/10 text-success">
                  {flipkartDiscount}% OFF
                </Badge>
              )}
              <Button
                asChild
                className="w-full bg-gradient-accent hover:opacity-90"
              >
                <a href={flipkartLink} target="_blank" rel="noopener noreferrer">
                  Check on Flipkart
                  <ExternalLink className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};