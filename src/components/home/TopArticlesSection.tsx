import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const sampleArticles = [
  {
    id: 1,
    title: "Top 10 Kitchen Chimneys in 2025",
    category: "Home Appliances",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=300&fit=crop",
    excerpt: "Expert-curated list of the best kitchen chimneys with powerful suction and modern design.",
  },
  {
    id: 2,
    title: "Best Smart TVs Under ₹30,000",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=300&fit=crop",
    excerpt: "Compare the top-rated smart TVs that deliver great value without breaking the bank.",
  },
  {
    id: 3,
    title: "Top 10 Air Purifiers for 2025",
    category: "Health & Wellness",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop",
    excerpt: "Breathe clean air with these highly-rated air purifiers for your home.",
  },
];

const TopArticlesSection = () => {
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
          {sampleArticles.map((article) => (
            <Card key={article.id} className="group overflow-hidden hover:shadow-hover transition-all duration-300">
              <div className="aspect-video overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6">
                <div className="text-xs font-medium text-primary mb-2">{article.category}</div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{article.excerpt}</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/articles/${article.id}`}>
                    Read More
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopArticlesSection;
