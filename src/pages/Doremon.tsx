import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Eye, Save, X, Package, Lightbulb, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

 interface Top10Product {
  rank: number;
  name: string;
  short_description: string;
  image: string;
  rating: number;
  pros: string[];
  cons: string[];
  amazon_price: number;
  amazon_discount: number | null;
  amazon_price_change: number | null;
  amazon_link: string;
  flipkart_price: number;
  flipkart_discount: number | null;
  flipkart_price_change: number | null;
  flipkart_link: string;
  badge: string | null;
}

interface SmartPick {
  recommendation: string;
}

interface RelatedArticle {
  title: string;
  url: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  category: string;
  status: "draft" | "published";
  views: number;
  date: string;
  top10_products: Top10Product[];
  smart_pick: SmartPick;
  related_articles: RelatedArticle[];
}

const AdminDashboard = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    fetchArticlesFromSupabase();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Top10Product | null>(null);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const fetchArticlesFromSupabase = async () => {
    const { data, error } = await supabase.from("articles").select("*");
    if (error) console.error(error);
    else setArticles(data ?? []);
  };




  const handleCreateNew = () => {
    const newArticle: Article = {
      title: "top LED TV 2025",
      slug: "led-2025",
      content: "you should definetly buy a LED TV",
      excerpt: "hahahaha",
      featured_image: "",
      category: "Uncategorized",
      status: "draft",
      views: 0,
      date: new Date().toISOString().slice(0, 10),
      top10_products: [],
      smart_pick: { recommendation: "" },
      related_articles: [],
    };
    setSelectedArticle(newArticle);
    setIsEditing(true);
  };


  const handleEdit = (article: Article) => {
    setSelectedArticle({ ...article, top10_products: [] }); // show UI quickly
    setIsEditing(true);
    if (article.id) loadTop10Products(article.id);
  };


const handleSave = async () => {
  if (!selectedArticle) return;
  try {
    let articleData;
    if (selectedArticle.id) {
      const { data, error } = await supabase
        .from("articles")
        .update({
          title: selectedArticle.title,
          slug: selectedArticle.slug,
          content: selectedArticle.content,
          excerpt: selectedArticle.excerpt,
          featured_image: selectedArticle.featured_image,
          category: selectedArticle.category,
          status: selectedArticle.status,
          views: selectedArticle.views,
          date: selectedArticle.date,
        })
        .eq("id", selectedArticle.id)
        .select()
        .single();
      if (error) throw error;
      articleData = data;
    } else {
      const { data, error } = await supabase
        .from("articles")
        .insert([{
          title: selectedArticle.title,
          slug: selectedArticle.slug,
          content: selectedArticle.content,
          excerpt: selectedArticle.excerpt,
          featured_image: selectedArticle.featured_image,
          category: selectedArticle.category,
          status: selectedArticle.status,
          views: selectedArticle.views,
          date: selectedArticle.date,
        }])
        .select()
        .single();
      if (error) throw error;
      articleData = data;
    }

    const article_id = articleData.id;

    // Save top10_products (delete+insert approach)
    if (selectedArticle.top10_products && selectedArticle.top10_products.length > 0) {
      await saveTop10Products(article_id, selectedArticle.top10_products);
    } else {
      // Optional: if no top10 products now, remove any existing DB rows
      await deleteTop10ProductsForArticle(article_id);
    }

    // Smart pick and related articles save (keep as you had)
    // ...
    alert("Saved");
    fetchArticlesFromSupabase();
    setIsEditing(false);
    setSelectedArticle(null);
  } catch (err: any) {
    console.error(err);
    alert("Save failed: " + err.message);
  }
};

  // Add new product (keeps sensible defaults)
  const addProduct = () => {
    if (!selectedArticle) return;
    const newProduct: Top10Product = {
      rank: selectedArticle.top10_products.length + 1,
      name: "",
      short_description: "",
      image: "",
      rating: 4.0,
      pros: [""],
      cons: [""],
      amazon_price: 0,
      amazon_discount: null,
      amazon_price_change: null,
      amazon_link: "",
      flipkart_price: 0,
      flipkart_discount: null,
      flipkart_price_change: null,
      flipkart_link: "",
      badge: null,
    };
    setSelectedArticle({
      ...selectedArticle,
      top10_products: [...selectedArticle.top10_products, newProduct],
    });
  };

  // Remove product and re-rank
  const removeProduct = (index: number) => {
    if (!selectedArticle) return;
    const updated = selectedArticle.top10_products.filter((_, i) => i !== index);
    setSelectedArticle({
      ...selectedArticle,
      top10_products: reRankProducts(updated),
    });
  };

  // Update field in a product
  const updateProduct = (index: number, field: keyof Top10Product, value: any) => {
    if (!selectedArticle) return;
    const updated = [...selectedArticle.top10_products];
    // If pros/cons provided as CSV or textarea, ensure array shape at caller
    updated[index] = { ...updated[index], [field]: value };
    setSelectedArticle({ ...selectedArticle, top10_products: updated });
  };



  const loadTop10Products = async (articleId: string) => {
    try {
      setLoadingTop10(true);
      const { data, error } = await supabase
        .from("top10_products")
        .select("*")
        .eq("article_id", articleId)
        .order("rank", { ascending: true });

      if (error) throw error;

      // Map DB rows to Top10Product shape if names differ
      const products: Top10Product[] = (data || []).map((row: any, idx: number) => ({
        rank: row.rank ?? idx + 1,
        name: row.name ?? "",
        short_description: row.short_description ?? "",
        image: row.image ?? "",
        rating: typeof row.rating === "number" ? row.rating : parseFloat(row.rating ?? "0") || 0,
        pros: Array.isArray(row.pros) ? row.pros : (row.pros ? JSON.parse(row.pros) : []),
        cons: Array.isArray(row.cons) ? row.cons : (row.cons ? JSON.parse(row.cons) : []),
        amazon_price: row.amazon_price ?? 0,
        amazon_discount: row.amazon_discount ?? null,
        amazon_price_change: row.amazon_price_change ?? null,
        amazon_link: row.amazon_link ?? "",
        flipkart_price: row.flipkart_price ?? 0,
        flipkart_discount: row.flipkart_discount ?? null,
        flipkart_price_change: row.flipkart_price_change ?? null,
        flipkart_link: row.flipkart_link ?? "",
        badge: row.badge ?? null,
      }));

      setSelectedArticle((prev) => prev ? { ...prev, top10_products: products } : null);
    } catch (err) {
      console.error("Error loading top10_products:", err);
    } finally {
      setLoadingTop10(false);
    }
  };





  const deleteTop10ProductsForArticle = async (articleId: string) => {
    const { error } = await supabase.from("top10_products").delete().eq("article_id", articleId);
      if (error) throw error;
    };

    const saveTop10Products = async (articleId: string, products: Top10Product[]) => {
      try {
        if (!articleId) throw new Error("Missing articleId");
        // Ensure rank order
        const normalized = reRankProducts(products);

        // Delete old -> insert new
        await deleteTop10ProductsForArticle(articleId);

        const payload = normalized.map((p) => sanitizeProductForDb(p, articleId));
        const { data, error } = await supabase.from("top10_products").insert(payload);

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("saveTop10Products error:", err);
        throw err;
      }
    };


  // Re-rank products in-place (1..N)
  const reRankProducts = (products: Top10Product[]) =>
    products.map((p, i) => ({ ...p, rank: i + 1 }));

  // Clean product for DB insert (ensures nulls instead of undefined)
  const sanitizeProductForDb = (p: Top10Product, article_id: string) => ({
    article_id,
    rank: p.rank,
    name: p.name ?? "",
    short_description: p.short_description ?? "",
    image: p.image ?? "",
    rating: p.rating ?? 0,
    pros: p.pros ?? [],
    cons: p.cons ?? [],
    amazon_price: p.amazon_price ?? 0,
    amazon_discount: p.amazon_discount ?? null,
    amazon_price_change: p.amazon_price_change ?? null,
    amazon_link: p.amazon_link ?? "",
    flipkart_price: p.flipkart_price ?? 0,
    flipkart_discount: p.flipkart_discount ?? null,
    flipkart_price_change: p.flipkart_price_change ?? null,
    flipkart_link: p.flipkart_link ?? "",
    badge: p.badge ?? null,
  });

  const addRelatedArticle = () => {
    if (!selectedArticle) return;
    setSelectedArticle({
      ...selectedArticle,
      related_articles: [...selectedArticle.related_articles, { title: "", url: "" }],
    });
  };

  const removeRelatedArticle = (index: number) => {
    if (!selectedArticle) return;
    setSelectedArticle({
      ...selectedArticle,
      related_articles: selectedArticle.related_articles.filter((_, i) => i !== index),
    });
  };

  const updateRelatedArticle = (index: number, field: keyof RelatedArticle, value: string) => {
    if (!selectedArticle) return;
    const updated = [...selectedArticle.related_articles];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedArticle({ ...selectedArticle, related_articles: updated });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Article Manager
                </h1>
                <p className="text-xs text-muted-foreground">Content Management Dashboard</p>
              </div>
            </div>
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              New Article
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-3">
              <CardDescription>Total Articles</CardDescription>
              <CardTitle className="text-3xl">{articles.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-3">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-3xl">{articles.filter(a => a.status === "published").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/80">
            <CardHeader className="pb-3">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-3xl">{articles.reduce((sum, a) => sum + a.views, 0)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="grid gap-6">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={article.featured_image || "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400"}
                    alt={article.title}
                    className="w-full md:w-48 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{article.title || "Untitled Article"}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      </div>
                      <Badge variant={article.status === "published" ? "default" : "secondary"}>
                        {article.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.views} views
                      </span>
                      <span>•</span>
                      <span>{article.category}</span>
                      <span>•</span>
                      <span>{article.date}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleEdit(article)} variant="outline" size="sm" className="gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button onClick={() => setDeleteId(article.id)} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredArticles.length === 0 && (
            <Card className="border-0 shadow-lg">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No articles found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.title ? "Edit Article" : "Create New Article"}</DialogTitle>
            <DialogDescription>Fill in the article details and manage associated content</DialogDescription>
          </DialogHeader>
          
          {selectedArticle && (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={selectedArticle.title}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, title: e.target.value })}
                      placeholder="Article title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={selectedArticle.slug}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, slug: e.target.value })}
                      placeholder="article-slug"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={selectedArticle.category}
                      onChange={(e) => setSelectedArticle({ ...selectedArticle, category: e.target.value })}
                      placeholder="Category"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={selectedArticle.status} onValueChange={(value: "draft" | "published") => setSelectedArticle({ ...selectedArticle, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured_image">Featured Image URL</Label>
                  <Input
                    id="featured_image"
                    value={selectedArticle.featured_image}
                    onChange={(e) => setSelectedArticle({ ...selectedArticle, featured_image: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={selectedArticle.excerpt}
                    onChange={(e) => setSelectedArticle({ ...selectedArticle, excerpt: e.target.value })}
                    placeholder="Brief description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={selectedArticle.content}
                    onChange={(e) => setSelectedArticle({ ...selectedArticle, content: e.target.value })}
                    placeholder="Article content"
                    rows={6}
                  />
                </div>
              </div>

              {/* Top 10 Products */}
              <Card>
                <CardHeader className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>Top 10 Products</CardTitle>
                  </div>
                  <Button onClick={addProduct} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Add Product
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedArticle.top10_products.map((product, index) => (
                    <Card key={index} className="p-4 bg-secondary/50">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Rank #{product.rank}</span>
                          <Button onClick={() => removeProduct(index)} size="sm" variant="ghost" className="text-destructive">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={product.name}
                            onChange={(e) => updateProduct(index, "name", e.target.value)}
                            placeholder="Product Name"
                          />
                          <Input
                            value={product.image}
                            onChange={(e) => updateProduct(index, "image", e.target.value)}
                            placeholder="Image URL"
                          />
                          <Input
                            value={product.short_description}
                            onChange={(e) => updateProduct(index, "short_description", e.target.value)}
                            placeholder="Short Description"
                            className="col-span-2"
                          />
                          <Input
                            type="number"
                            value={product.rating}
                            onChange={(e) => updateProduct(index, "rating", parseFloat(e.target.value))}
                            placeholder="Rating"
                          />
                          <Input
                            value={product.pros.join(", ")}
                            onChange={(e) => updateProduct(index, "pros", e.target.value.split(",").map((v) => v.trim()))}
                            placeholder="Pros (comma separated)"
                            className="col-span-2"
                          />
                          <Input
                            value={product.cons.join(", ")}
                            onChange={(e) => updateProduct(index, "cons", e.target.value.split(",").map((v) => v.trim()))}
                            placeholder="Cons (comma separated)"
                            className="col-span-2"
                          />
                          <Input
                            type="number"
                            value={product.amazon_price}
                            onChange={(e) => updateProduct(index, "amazon_price", parseFloat(e.target.value))}
                            placeholder="Amazon Price"
                          />
                          <Input
                            type="number"
                            value={product.amazon_discount ?? ""}
                            onChange={(e) => updateProduct(index, "amazon_discount", e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Amazon Discount"
                          />
                          <Input
                            type="number"
                            value={product.amazon_price_change ?? ""}
                            onChange={(e) => updateProduct(index, "amazon_price_change", e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Amazon Price Change"
                          />
                          <Input
                            value={product.amazon_link}
                            onChange={(e) => updateProduct(index, "amazon_link", e.target.value)}
                            placeholder="Amazon Link"
                          />
                          <Input
                            type="number"
                            value={product.flipkart_price}
                            onChange={(e) => updateProduct(index, "flipkart_price", parseFloat(e.target.value))}
                            placeholder="Flipkart Price"
                          />
                          <Input
                            type="number"
                            value={product.flipkart_discount ?? ""}
                            onChange={(e) => updateProduct(index, "flipkart_discount", e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Flipkart Discount"
                          />
                          <Input
                            type="number"
                            value={product.flipkart_price_change ?? ""}
                            onChange={(e) => updateProduct(index, "flipkart_price_change", e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder="Flipkart Price Change"
                          />
                          <Input
                            value={product.flipkart_link}
                            onChange={(e) => updateProduct(index, "flipkart_link", e.target.value)}
                            placeholder="Flipkart Link"
                            className="col-span-2"
                          />
                          <Input
                            value={product.badge ?? ""}
                            onChange={(e) => updateProduct(index, "badge", e.target.value)}
                            placeholder="Badge"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            
              {/* Smart Pick */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <CardTitle>Smart Pick Recommendation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={selectedArticle.smart_pick.recommendation}
                    onChange={(e) => setSelectedArticle({ ...selectedArticle, smart_pick: { recommendation: e.target.value } })}
                    placeholder="Expert recommendation for readers"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Related Articles */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <CardTitle>Related Articles</CardTitle>
                    </div>
                    <Button onClick={addRelatedArticle} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Article
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedArticle.related_articles.map((article, index) => (
                    <div key={index} className="flex gap-3">
                      <Input
                        value={article.title}
                        onChange={(e) => updateRelatedArticle(index, "title", e.target.value)}
                        placeholder="Article title"
                        className="flex-1"
                      />
                      <Input
                        value={article.url}
                        onChange={(e) => updateRelatedArticle(index, "url", e.target.value)}
                        placeholder="URL"
                        className="flex-1"
                      />
                      <Button onClick={() => removeRelatedArticle(index)} size="icon" variant="ghost" className="text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the article.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;