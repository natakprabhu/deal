import { useState, useEffect, useMemo } from "react"; // <-- Added useMemo
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Plus, Edit, Trash2, Eye, Save, X, Package, Lightbulb, FileText, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// This is the new master product interface
interface Product {
  id: string;
  created_at: string;
  name: string;
  slug: string; // <-- Added slug
  short_description: string;
  image: string;
  pros: string[];
  cons: string[];
  amazon_link: string;
  flipkart_link: string;
  badge: string | null;
  category_id: string | null;
  tags: string[]; // <-- Added tags
}

// This is the "Top 10" item for your React state
interface ArticleProduct {
  rank: number;
  product_id: string;
  product: Product; // This will be the nested product object
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
  tags: string[] | null;
  featured_image: string;
  category: string;
  category_id: string | null;
  status: "draft" | "published";
  views: number;
  date: string;
  article_products: ArticleProduct[]; // <-- Correct
  smart_pick: SmartPick;
  related_articles: RelatedArticle[];
  author: string; // Added author
}

interface Category {
  id: string;
  name: string;
  slug: string; // Added slug
}

const AdminDashboard = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingTop10, setIsLoadingTop10] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // State for the Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Helper function to generate slugs
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/ /g, '-')
      .replace(/[^\w-]+/g, ''); // Remove special characters
  };

  // Add this inside your AdminDashboard component in Doremon.tsx
  const subCategoryMap: { [key: string]: string[] } = {
    "Air Purifier": [
      "HEPA Filter",
      "Activated Carbon",
      "Ionizer",
      "UV-C Light",
      "Smart / Wi-Fi",
      "With Humidifier"
    ],
    "Chimney": [
      "Wall Mounted",
      "Island Hood",
      "Built-in",
      "Baffle Filter",
      "Filterless (Auto-Clean)",
      "Mesh / Cassette Filter",
      "Ducted",
      "Ductless",
      "Auto-Clean Feature",
      "Suction: 800-1000 m³/hr",
      "Suction: 1100-1300 m³/hr",
      "Suction: 1400+ m³/hr"
    ],
    "Coffee Maker": [
      "Fully Automatic",
      "Semi-Automatic",
      "Manual Brewer",
      "Espresso Machine",
      "Drip Coffee",
      "Pod / Capsule",
      "French Press",
      "Moka Pot",
      "Bean-to-Cup",
      "Cold Brew"
    ],
    "Juicer": [
      "Centrifugal (Fast)",
      "Masticating (Cold Press)",
      "Horizontal",
      "Vertical",
      "Multi-Function"
    ],
    "Laptop": [
      "Everyday Use",
      "Ultrabook",
      "Gaming",
      "2-in-1 / Convertible",
      "Professional / Workstation",
      "Chromebook",
      "Windows",
      "macOS",
      "13-14 inch",
      "15-16 inch",
      "17+ inch"
    ],
    "Microwave": [
      "Solo",
      "Grill",
      "Convection",
      "Countertop",
      "Over-the-Range",
      "Inverter Technology"
    ],
    "Mobile": [
      "Android",
      "iOS",
      "Budget (< ₹15,000)",
      "Mid-Range (₹15k-₹35k)",
      "Flagship (> ₹50,000)",
      "Foldable",
      "Gaming Phone"
    ],
    "Refrigerator": [
      "Single Door",
      "Double Door (Top Freezer)",
      "Double Door (Bottom Mount)",
      "Side-by-Side",
      "French Door",
      "Direct Cool",
      "Frost-Free",
      "Convertible",
      "With Water/Ice Dispenser"
    ],
    "TV": [
      "LED-LCD",
      "QLED",
      "Neo QLED",
      "OLED",
      "HD Ready (720p)",
      "Full HD (1080p)",
      "4K UHD (2160p)",
      "8K",
      "Google TV",
      "webOS (LG)",
      "Tizen (Samsung)"
    ],
    "Vaccum Cleaner": [
      "Canister",
      "Upright",
      "Stick / Cordless",
      "Robotic",
      "Handheld",
      "Dry Only",
      "Wet & Dry",
      "Bagged",
      "Bagless"
    ],
    "Water Purifier": [
      "RO (Reverse Osmosis)",
      "UV (Ultraviolet)",
      "UF (Ultrafiltration)",
      "RO + UV",
      "RO + UV + UF",
      "With Mineralizer",
      "Wall-Mounted",
      "Gravity-Based"
    ]
  };

  const authorNames = [
    "Rohan Gupta",
    "Priya Sharma",
    "Aditya Singh",
    "Ananya Reddy",
    "Vikram Patel",
    "Meera Iyer",
    "Arjun Desai",
    "Diya Mehta",
    "Karan Joshi",
    "Sneha Rao"
  ];

  const categoryExcerpts: { [key: string]: string } = {
    "Air Purifier": "Breathe cleaner air at home. We review the top air purifiers to help you find the best one for removing pollutants, allergens, and odors.",
    "Chimney": "Keep your kitchen smoke-free and fresh. This guide covers the best kitchen chimneys, comparing suction power, noise levels, and filter types.",
    "Coffee Maker": "Start your day with the perfect brew. Discover the best coffee makers, from simple drip machines to advanced espresso makers.",
    "Juicer": "Get your daily dose of fresh vitamins. We compare the best juicers, looking at ease of cleaning, yield, and performance with leafy greens.",
    "Laptop": "Find your next powerhouse for work or play. Our experts review the latest laptops for performance, battery life, and display quality.",
    "Microwave": "Reheat, defrost, or cook meals in minutes. We break down the best microwave ovens, including convection and grill models.",
    "Mobile": "Choosing a new smartphone? We review the latest models, testing camera quality, battery life, and overall performance to help you decide.",
    "Refrigerator": "Find the perfect fridge to keep your food fresh. We compare the best refrigerators on storage, energy efficiency, and smart features.",
    "TV": "Upgrade your home entertainment. This guide ranks the best TVs based on picture quality, smart features, and sound performance.",
    "Vaccum Cleaner": "Keep your floors spotless with less effort. Discover the best vacuum cleaners, from powerful corded models to convenient cordless sticks.",
    "Water Purifier": "Ensure your family drinks safe, clean water. We review the top water purifiers, comparing RO, UV, and UF technologies.",
  };

  const categoryContentTemplates: { [key: string]: string } = {
    "Air Purifier": `
When choosing an air purifier, the main types to consider are those with HEPA filters, which excel at capturing fine particles, and those with activated carbon filters for odors and gases. Many top models from brands like Philips, Dyson, and Mi combine these technologies. Entry-level personal purifiers start around ₹7,000, while high-capacity room models can go up to ₹30,000. Their primary purpose is to remove indoor air pollutants, allergens, and dust, significantly improving residential air quality.`,
    "Chimney": `
A kitchen chimney is essential for absorbing smoke and oil particles, keeping your kitchen air clean and preventing grime. The main types are wall-mounted, island, and built-in, which use filters like baffle or charcoal. Popular brands in India include Elica, Faber, and Hindware. Prices range from ₹5,000 for basic models to ₹25,000 for high-end, auto-clean chimneys, so choosing depends on your budget and suction power needs.`,
    "Coffee Maker": `
Starting your day with the perfect brew depends on the right machine. You can choose from simple Drip Coffee Makers and French Presses (which start as low as ₹500) or more advanced Espresso Machines from brands like De'Longhi and Morphy Richards, which can cost over ₹20,000. Each type serves a different purpose, from a light, quick cup to a rich, complex espresso shot.`,
    "Juicer": `
To get your daily dose of fresh vitamins, you'll need to choose between two main types of juicers: Centrifugal and Masticating (or cold-press). Centrifugal juicers from brands like Philips or Sujata are fast, affordable, and start around ₹2,500. Masticating juicers from brands like Kuvings are quieter, more efficient, and better at preserving nutrients, but typically start around ₹12,000.`,
    "Laptop": `
Finding your next laptop means balancing portability and power. Ultrabooks from Dell (XPS) and HP (Spectre) are thin, light, and great for work, while gaming laptops from Asus (ROG) pack powerful GPUs. Budget laptops start at ₹30,000, but high-end models like the MacBook Pro or top-tier gaming rigs can exceed ₹1,00,000. We test for performance, battery life, and display quality.`,
    "Microwave": `
A microwave is a kitchen staple for quickly reheating, defrosting, or even cooking meals. A 'Solo' model is the most basic, while 'Grill' models add browning capabilities. 'Convection' microwaves from brands like LG, Samsung, and IFB can also bake and roast, acting as a small oven. Prices range from ₹5,000 for solo models to ₹18,000 for larger convection units.`,
    "Mobile": `
Choosing a new smartphone involves navigating budget, mid-range, and flagship models from brands like Apple, Samsung, and OnePlus. The key differences often lie in camera quality, battery life, and processor speed. Budget phones under ₹15,000 offer great value, while flagships over ₹50,000 provide the absolute best performance and photography. We review the latest models to help you decide.`,
    "Refrigerator": `
A good refrigerator keeps your food fresh and can lower energy bills. Single-door fridges (starting at ₹12,000) are great for small families, while double-door and side-by-side models from LG, Samsung, and Whirlpool offer more storage and features like convertible freezers. Prices for larger models can range from ₹25,000 to over ₹50,000, depending on capacity and smart features.`,
    "TV": `
Upgrading your home entertainment setup means choosing between LED, QLED, and OLED panels. Standard 4K LED TVs from Mi or TCL offer great value, starting around ₹25,000. QLEDs from Samsung provide brighter, more vibrant colors, while OLEDs from Sony and LG are premium (starting ₹80,000+) and offer perfect blacks and the best contrast for a true cinematic experience.`,
    "Vaccum Cleaner": `
Keeping your floors spotless is easier with the right vacuum. Options range from portable handhelds (starting at ₹2,000) to powerful canister vacuums from Eureka Forbes. Lightweight, cordless stick vacuums are very convenient, with premium brands like Dyson offering high-end performance. Robotic vacuums offer automated cleaning for daily maintenance.`,
    "Water Purifier": `
Ensuring safe drinking water in India often requires a purifier. The technology you need depends on your water source. RO (Reverse Osmosis) is essential for hard water, while UV (Ultraviolet) kills bacteria and viruses. Top brands like Kent, Aquaguard, and Pureit often combine these in RO+UV models, which typically range from ₹8,0g00 to ₹20,000.`,
  };

  useEffect(() => {
    fetchArticlesFromSupabase();
    fetchCategories();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchArticlesFromSupabase = async () => {
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setArticles(data ?? []);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error.message);
        throw error;
      }
      setCategories(data ?? []);
    } catch (err: any) {
      console.error("An error occurred in fetchCategories:", err.message);
    }
  };

  const handleCreateNew = () => {
    const randomAuthor = authorNames[Math.floor(Math.random() * authorNames.length)];

    const newArticle: Article = {
      id: "", // No ID for a new article
      title: "top LED TV 2025",
      slug: "led-2025",
      content: "you should definetly buy a LED TV",
      excerpt: "",
      featured_image: "",
      category: "Uncategorized",
      category_id: "89d28265-b103-4638-b0c8-7ef0c0e6f6f0", // Default category
      author: randomAuthor,
      status: "draft",
      views: 0,
      date: new Date().toISOString().slice(0, 10),
      tags: [],
      article_products: [],
      smart_pick: { recommendation: "" },
      related_articles: [],
    };
    setSelectedArticle(newArticle);
    setIsEditing(true);
  };

  const handlePublish = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({ status: "published" })
        .eq("id", articleId);

      if (error) throw error;

      toast({
        title: "Article Published!",
        description: "The article is now live.",
      });
      fetchArticlesFromSupabase(); // Refresh
    } catch (err: any) {
      console.error("Publish failed:", err);
      toast({
        variant: "destructive",
        title: "Publish Failed",
        description: err.message || "An unknown error occurred.",
      });
    }
  };

  const loadFullArticleData = async (articleId: string) => {
    console.log(`[Debug] loadFullArticleData called with ID: ${articleId}`);
    try {
      setIsLoadingTop10(true);

      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          article_products (
            rank,
            product_id,
            products ( * ) 
          ),
          smart_pick_recommendations(*),
          related_articles(*)
        `)
        .eq("id", articleId)
        .order("rank", { referencedTable: "article_products", ascending: true }) // Corrected
        .single();

      console.log("[Debug] loadFullArticleData response:", { data, error });

      if (error) throw error;

      if (data) {
        // --- 1. Map Products ---
        const products: ArticleProduct[] = (data.article_products || []).map((ap: any) => ({
          rank: ap.rank,
          product_id: ap.product_id,
          product: ap.products,
        }));

        // --- 2. Extract Smart Pick ---
        const smartPick: SmartPick = (data.smart_pick_recommendations && data.smart_pick_recommendations[0])
          ? { recommendation: data.smart_pick_recommendations[0].recommendation ?? "" }
          : { recommendation: "" };

        // --- 3. Extract Related Articles ---
        const relatedArticles: RelatedArticle[] = (data.related_articles || []).map((row: any) => ({
          title: row.title ?? "",
          url: row.url ?? ""
        }));

        // --- 4. Set state ---
        setSelectedArticle((prev) => prev ? {
          ...prev,
          ...data,
          article_products: products, // Corrected
          smart_pick: smartPick,
          related_articles: relatedArticles
        } : null);
      }
    } catch (err: any) {
      console.error("Error loading full article data:", err.message);
      toast({
        variant: "destructive",
        title: "Failed to load article data",
        description: err.message,
      });
    } finally {
      setIsLoadingTop10(false);
    }
  };

  const handleEdit = (article: Article) => {
    console.log(`[Debug] Editing article with ID: ${article.id}`);
    setSelectedArticle({
      ...article,
      article_products: [], // Default empty
      smart_pick: { recommendation: "" },
      related_articles: []
    });
    setIsEditing(true);

    if (article.id) {
      loadFullArticleData(article.id);
    }
  };

  const handleSave = async () => {
    if (!selectedArticle) return;
    try {
      let articleData;
      const articlePayload = {
        title: selectedArticle.title,
        slug: selectedArticle.slug,
        content: selectedArticle.content,
        excerpt: selectedArticle.excerpt,
        featured_image: selectedArticle.featured_image,
        category: selectedArticle.category,
        category_id: selectedArticle.category_id,
        author: selectedArticle.author,
        status: selectedArticle.status,
        views: selectedArticle.views,
        date: selectedArticle.date,
        tags: selectedArticle.tags,
      };

      if (selectedArticle.id) {
        const { data, error } = await supabase
          .from("articles")
          .update(articlePayload)
          .eq("id", selectedArticle.id)
          .select()
          .single();
        if (error) throw error;
        articleData = data;
      } else {
        const { data, error } = await supabase
          .from("articles")
          .insert([articlePayload])
          .select()
          .single();
        if (error) throw error;
        articleData = data;
      }

      const article_id = articleData.id;

      // Save article_products
      if (selectedArticle.article_products && selectedArticle.article_products.length > 0) {
        await saveArticleProducts(article_id, selectedArticle.article_products);
      } else {
        await deleteArticleProducts(article_id);
      }

      // Save Smart Pick
      await saveSmartPick(article_id, selectedArticle.smart_pick);

      // Save Related Articles
      await saveRelatedArticles(article_id, selectedArticle.related_articles);

      toast({
        title: "Success!",
        description: "Your article has been saved.",
      });
      fetchArticlesFromSupabase();

      setIsEditing(false);
      setSelectedArticle(null);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: err.message || "An unknown error occurred.",
      });
    }
  };

  // Deletes all product links for a given article
  const deleteArticleProducts = async (articleId: string) => {
    const { error } = await supabase
      .from("article_products")
      .delete()
      .eq("article_id", articleId);

    if (error) throw error;
  };

  // Saves the new set of product links for an article
  const saveArticleProducts = async (articleId: string, products: ArticleProduct[]) => {
    try {
      if (!articleId) throw new Error("Missing articleId");

      const normalized = reRankProducts(products);
      await deleteArticleProducts(articleId);

      const payload = normalized.map((ap) => ({
        article_id: articleId,
        product_id: ap.product_id,
        rank: ap.rank,
      }));

      const { data, error } = await supabase.from("article_products").insert(payload);

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("saveArticleProducts error:", err);
      throw err;
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      // 1. Delete associated Products
      await deleteArticleProducts(articleId);

      // 2. Delete associated Smart Pick
      await supabase.from("smart_pick_recommendations").delete().eq("article_id", articleId);

      // 3. Delete associated Related Articles
      await supabase.from("related_articles").delete().eq("article_id", articleId);

      // 4. Now, delete the main article
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;

      toast({
        title: "Article Deleted",
        description: "The article has been permanently deleted.",
      });

      fetchArticlesFromSupabase(); // Refresh
      setDeleteId(null); // Close dialog
    } catch (err: any) {
      console.error("Delete failed:", err);
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: err.message || "An unknown error occurred.",
      });
    }
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    if (!selectedArticle) return;
    const currentTags = selectedArticle.tags || [];
    if (checked) {
      setSelectedArticle({
        ...selectedArticle,
        tags: [...currentTags, tag],
      });
    } else {
      setSelectedArticle({
        ...selectedArticle,
        tags: currentTags.filter((t) => t !== tag),
      });
    }
  };

  // Re-rank products in-place (1..N)
  const reRankProducts = (products: ArticleProduct[]) =>
    products.map((p, i) => ({ ...p, rank: i + 1 }));

  // Remove product and re-rank
  const removeProduct = (index: number) => {
    if (!selectedArticle) return;
    const updated = selectedArticle.article_products.filter((_, i) => i !== index);
    setSelectedArticle({
      ...selectedArticle,
      article_products: reRankProducts(updated),
    });
  };

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

  const saveSmartPick = async (articleId: string, smartPick: SmartPick) => {
    try {
      await supabase.from("smart_pick_recommendations").delete().eq("article_id", articleId);

      if (smartPick && smartPick.recommendation) {
        const { error } = await supabase.from("smart_pick_recommendations").insert({
          article_id: articleId,
          recommendation: smartPick.recommendation,
        });
        if (error) throw error;
      }
    } catch (err) {
      console.error("saveSmartPick error:", err);
      throw err;
    }
  };

  const saveRelatedArticles = async (articleId: string, articles: RelatedArticle[]) => {
    try {
      await supabase.from("related_articles").delete().eq("article_id", articleId);

      if (articles && articles.length > 0) {
        const payload = articles
          .filter(a => a.title && a.url)
          .map(article => ({
            article_id: articleId,
            title: article.title,
            url: article.url,
          }));

        if (payload.length > 0) {
          const { error } = await supabase.from("related_articles").insert(payload);
          if (error) throw error;
        }
      }
    } catch (err) {
      console.error("saveRelatedArticles error:", err);
      throw err;
    }
  };

// --- NEW COMPONENT for Product Search/Create ---
  const ProductSearchModal = () => {
    const [tab, setTab] = useState("search"); // 'search' or 'create'
    const [newProduct, setNewProduct] = useState({
      name: "",
      slug: "",
      short_description: "",
      image: "",
      amazon_link: "",
      flipkart_link: "",
      category_id: selectedArticle?.category_id || null,
      tags: [] as string[]
    });

    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
    const [filterQuery, setFilterQuery] = useState(""); // For instant filtering

    // Reset form when modal opens or category changes
    useEffect(() => {
        setNewProduct({
          name: "",
          slug: "",
          short_description: "",
          image: "",
          amazon_link: "",
          flipkart_link: "",
          category_id: selectedArticle?.category_id || null,
          tags: []
        });
    }, [isProductModalOpen, selectedArticle?.category_id]);
    
    // Fetch products ONCE when modal opens
    useEffect(() => {
      const fetchProductsByCategory = async () => {
        if (!isProductModalOpen || !selectedArticle?.category_id) {
          setCategoryProducts([]);
          return;
        }
        
        setIsLoadingProducts(true);
        setFilterQuery(""); // Reset filter
        try {
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("category_id", selectedArticle.category_id);
            
          if (error) throw error;
          setCategoryProducts(data || []);
        } catch (err: any) {
          console.error("Failed to fetch products:", err);
          toast({ variant: "destructive", title: "Failed to load products" });
        } finally {
          setIsLoadingProducts(false);
        }
      };

      fetchProductsByCategory();
    }, [isProductModalOpen, selectedArticle?.category_id]);

    // Instantly filter the loaded list
    const filteredProducts = useMemo(() => {
      if (!filterQuery) {
        return categoryProducts; // No filter? Show all.
      }
      return categoryProducts.filter(product =>
        product.name.toLowerCase().includes(filterQuery.toLowerCase())
      );
    }, [categoryProducts, filterQuery]);


    // Handle tag changes for the new product
    const handleProductTagChange = (tag: string, checked: boolean) => {
      const currentTags = newProduct.tags || [];
      if (checked) {
        setNewProduct({ ...newProduct, tags: [...currentTags, tag] });
      } else {
        setNewProduct({ ...newProduct, tags: newProduct.tags.filter((t) => t !== tag) });
      }
    };

    // Create a new product in the master 'products' table
    const handleCreateProduct = async () => {
      if (!newProduct.name || !newProduct.slug) {
        toast({ variant: "destructive", title: "Name and Slug are required" });
        return;
      }
      try {
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: newProduct.name,
            slug: newProduct.slug,
            short_description: newProduct.short_description,
            image: newProduct.image,
            amazon_link: newProduct.amazon_link,
            flipkart_link: newProduct.flipkart_link,
            tags: newProduct.tags,
            category_id: selectedArticle?.category_id || null
          })
          .select()
          .single();

        if (error) throw error;

        toast({ title: "Product Created!", description: data.name });
        onProductSelect(data);
      } catch (err: any) {
         console.error("Create product failed:", err);
        if (err.message.includes("duplicate key value violates unique constraint")) {
             toast({ variant: "destructive", title: "Create Failed", description: "A product with this slug already exists." });
        } else {
             toast({ variant: "destructive", title: "Create failed", description: err.message });
        }
      }
    };

    // Add a selected product to the article's state
    const onProductSelect = (product: Product) => {
      if (!selectedArticle) return;

      if (selectedArticle.article_products.find(ap => ap.product_id === product.id)) {
        toast({ variant: "destructive", title: "Product already added" });
        return;
      }

      const newArticleProduct: ArticleProduct = {
        rank: selectedArticle.article_products.length + 1,
        product_id: product.id,
        product: product,
      };

      setSelectedArticle({
        ...selectedArticle,
        article_products: [...selectedArticle.article_products, newArticleProduct],
      });

      setIsProductModalOpen(false);
    };

    return (
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Product to Article</DialogTitle>
            <DialogDescription>
              Search for an existing product or create a new one to track.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>

            {/* --- UPDATED SEARCH TAB --- */}
            <TabsContent value="search">
              <div className="p-4 space-y-4">
                <Input
                  placeholder="Filter products in this category..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                />
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {isLoadingProducts && (
                      <p className="text-center text-sm text-muted-foreground">Loading products...</p>
                    )}
                    
                    {!isLoadingProducts && filteredProducts.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        No products found. (Try the "Create New" tab)
                      </p>
                    )}
                    
                    {/* --- THIS IS THE UPDATED LIST --- */}
                    {!isLoadingProducts && filteredProducts.map((product, index) => ( // <-- Added 'index'
                      <div
                        key={product.id}
                        className="p-2 border rounded-md flex items-center justify-between hover:bg-secondary cursor-pointer"
                        onClick={() => onProductSelect(product)}
                      >
                        {/* This div now controls the left side, preventing overflow */}
                        <div className="flex items-center gap-3 flex-1 min-w-0"> {/* <-- ADDED flex-1 min-w-0 */}
                          
                          {/* 1. Added Serial Number */}
                          <span className="text-sm font-medium text-muted-foreground w-6 text-right">
                            {index + 1}.
                          </span>
                         
                        
                          {/* 3. Added flex-1 min-w-0 and truncate to text */}
                          <div className="flex-1 min-w-0"> {/* <-- ADDED */}
                            <p className="font-semibold truncate">{product.name}</p> {/* <-- ADDED truncate */}
                            <p className="text-xs text-muted-foreground truncate">{product.slug}</p> {/* <-- ADDED truncate */}
                          </div>
                        </div>
                        
                        {/* 4. Added margin to button for spacing */}
                        <Button size="sm" className="ml-4">Select</Button> {/* <-- ADDED ml-4 */}
                      </div>
                    ))}
                    {/* --- END OF UPDATED LIST --- */}

                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* --- CREATE TAB --- */}
            <TabsContent value="create">
              <ScrollArea className="h-[60vh]">
                <div className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    This will create a new master product in your database.
                    Category will be set to: <strong>{selectedArticle?.category || "Not set"}</strong>
                  </p>
                  
                  <Label htmlFor="new-name">Product Name *</Label>
                  <Input 
                    id="new-name" 
                    value={newProduct.name} 
                    onChange={(e) => {
                      const newName = e.target.value;
                      const newSlug = generateSlug(newName);
                      setNewProduct({...newProduct, name: newName, slug: newSlug });
                    }} 
                  />

                  <Label htmlFor="new-slug">Product Slug *</Label>
                  <Input 
                    id="new-slug" 
                    value={newProduct.slug} 
                    onChange={(e) => setNewProduct({...newProduct, slug: e.target.value})} 
                  />

                  <Label htmlFor="new-desc">Short Description</Label>
                  <Input id="new-desc" value={newProduct.short_description} onChange={(e) => setNewProduct({ ...newProduct, short_description: e.target.value })} />

                  <Label htmlFor="new-image">Image URL</Label>
                  <Input id="new-image" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />

                  <Label htmlFor="new-amz">Amazon Link</Label>
                  <Input id="new-amz" value={newProduct.amazon_link} onChange={(e) => setNewProduct({ ...newProduct, amazon_link: e.target.value })} />

                  <Label htmlFor="new-fk">Flipkart Link</Label>
                  <Input id="new-fk" value={newProduct.flipkart_link} onChange={(e) => setNewProduct({ ...newProduct, flipkart_link: e.target.value })} />
                  
                  <div className="space-y-2 pt-2">
                    <Label>Product Tags / Filters</Label>
                    <div className="rounded-md border p-4 space-y-2 max-h-48 overflow-y-auto">
                      {selectedArticle?.category && subCategoryMap[selectedArticle.category] ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {subCategoryMap[selectedArticle.category].map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`new-product-${tag}`}
                                checked={newProduct.tags.includes(tag)}
                                onCheckedChange={(checked) => handleProductTagChange(tag, !!checked)}
                              />
                              <Label
                                htmlFor={`new-product-${tag}`}
                                className="text-sm font-normal"
                              >
                                {tag}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Please select an article category first to see relevant tags.
                        </p>
                      )}
                    </div>
                  </div>

                  <Button onClick={handleCreateProduct} className="w-full mt-4">Create and Select Product</Button>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  };

  // The rest of your AdminDashboard component (return statement, etc.) goes here...

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
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
                        <Link to={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                          <h3 className="text-xl font-semibold mb-1 hover:underline hover:text-primary">
                            {article.title || "Untitled Article"}
                          </h3>
                        </Link>
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
                      {article.status === "draft" && (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePublish(article.id);
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                        >
                          <Send className="h-4 w-4" />
                          Publish
                        </Button>
                      )}

                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(article);
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeleteId(article.id);
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive"
                      >
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

      {/* Render the modal */}
      <ProductSearchModal />

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedArticle?.id ? "Edit Article" : "Create New Article"}</DialogTitle>
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
                    <Select
                      value={selectedArticle.category_id ?? ""}
                      onValueChange={(value) => {
                        const selectedCat = categories.find(cat => cat.id === value);

                        if (!selectedCat) {
                          setSelectedArticle({
                            ...selectedArticle,
                            category_id: null,
                            category: "",
                            excerpt: "",
                            slug: "",
                            content: ""
                          });
                          return;
                        }

                        const randInt = Math.floor(Math.random() * 100) + 1;
                        const date = new Date();
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();

                        const baseSlug = selectedCat.slug || selectedCat.name;
                        const categorySlug = baseSlug.toLowerCase().replace(/\s+/g, '-');
                        const newSlug = `${randInt}-${categorySlug}-${day}-${month}-${year}`;

                        const newCategoryName = selectedCat.name;
                        const newExcerpt = categoryExcerpts[newCategoryName] || "";
                        const newContent = categoryContentTemplates[newCategoryName] || "";

                        setSelectedArticle({
                          ...selectedArticle,
                          category_id: value,
                          category: newCategoryName,
                          excerpt: newExcerpt,
                          slug: newSlug,
                          content: newContent
                        });
                      }}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {/* --- Sub-Categories (Tags) Section --- */}
                <div className="space-y-2">
                  <Label>Sub-Categories / Tags</Label>
                  <div className="rounded-md border p-4 space-y-2">
                    {selectedArticle.category && subCategoryMap[selectedArticle.category] ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {subCategoryMap[selectedArticle.category].map((tag) => (
                          <div key={tag} className="flex items-center space-x-2">
                            <Checkbox
                              id={tag}
                              checked={(selectedArticle.tags || []).includes(tag)}
                              onCheckedChange={(checked) => handleTagChange(tag, !!checked)}
                            />
                            <Label
                              htmlFor={tag}
                              className="text-sm font-normal"
                            >
                              {tag}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Please select a main category first.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top 10 Products */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>Top 10 Products</CardTitle>
                  </div>
                  <Button onClick={() => setIsProductModalOpen(true)} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" /> Add Product
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedArticle.article_products
                    .sort((a, b) => a.rank - b.rank)
                    .map((articleProduct, index) => (
                      <Card key={articleProduct.product_id} className="p-3 bg-secondary/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-lg text-primary">{articleProduct.rank}.</span>
                            <img
                              src={articleProduct.product.image || "https://via.placeholder.com/100"}
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-semibold">{articleProduct.product.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{articleProduct.product.short_description}</p>
                              <div className="flex flex-wrap gap-1 pt-1">
                                {articleProduct.product.tags?.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeProduct(index)}
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                  {selectedArticle.article_products.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No products added yet.</p>
                  )}
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
