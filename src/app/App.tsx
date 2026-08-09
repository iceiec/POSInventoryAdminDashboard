import { useState, useRef, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  LayoutDashboard,
  Package,
  ChevronDown,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Search,
  Plus,
  Upload,
  Download,
  Moon,
  Sun,
  X,
  Circle,
  Square,
  Triangle,
  Star,
  Hexagon,
  Menu,
  Settings,
  Bell,
  Filter,
  MoreVertical,
  ShoppingCart,
  Minus,
  CreditCard,
  Smartphone,
  DollarSign,
  User,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import type {
  Item,
  Category,
  Modifier,
  Discount,
  Analytics,
  CartItem,
  ItemCreateInput,
  CategoryCreateInput,
  ModifierCreateInput,
  DiscountCreateInput,
} from "../types";
import { itemsApi } from "../api/items";
import { categoriesApi } from "../api/categories";
import { modifiersApi } from "../api/modifiers";
import { discountsApi } from "../api/discounts";
import { analyticsApi } from "../api/analytics";
import { salesApi } from "../api/sales";

type View = "dashboard" | "items" | "pos" | "settings";
type ItemsTab = "list" | "categories" | "modifiers" | "discounts" | "low-stock";
type DashboardFilter = "summary" | "by-item" | "by-category" | "by-payment" | "receipt" | "discount";

interface AppSettings {
  storeName: string;
  storeTagline: string;
  lowStockThreshold: number;
  taxRate: number;
  receiptFooter: string;
  currencyCode: string;
  currencySymbol: string;
  currencyLocale: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  storeName: "PharmacyMed",
  storeTagline: "Pharmacy Management",
  lowStockThreshold: 30,
  taxRate: 0,
  receiptFooter: "Thank you for your purchase!",
  currencyCode: "PHP",
  currencySymbol: "₱",
  currencyLocale: "en-PH",
};

export default function App() {
  // ── Settings state (persisted to localStorage) ──────────────────────────────
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("pharmacymed_settings");
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem("pharmacymed_settings", JSON.stringify(next));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem("pharmacymed_settings");
  };

  // ── Draft settings (editable in the form, saved on Apply) ───────────────────
  const [draftSettings, setDraftSettings] = useState<AppSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const applySettings = () => {
    updateSettings(draftSettings);
    setSettingsSaved(true);
    setBannerDismissed(false);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [itemsExpanded, setItemsExpanded] = useState(false);
  const [itemsTab, setItemsTab] = useState<ItemsTab>("list");
  const [darkMode, setDarkMode] = useState(false);
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>("summary");

  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  // ── Data state ──────────────────────────────────────────────────────────────
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifiers, setModifiers] = useState<Modifier[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingModifiers, setLoadingModifiers] = useState(true);
  const [loadingDiscounts, setLoadingDiscounts] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // ── POS state ────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "wallet" | "">("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [customDiscountValue, setCustomDiscountValue] = useState("");
  const [customDiscountType, setCustomDiscountType] = useState<"percentage" | "amount">("percentage");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [completingSale, setCompletingSale] = useState(false);

  // ── Item filter state ────────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState("All items");
  const [stockFilter, setStockFilter] = useState("All items");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Low stock filter state ───────────────────────────────────────────────────
  const [lowStockCategoryFilter, setLowStockCategoryFilter] = useState("All items");
  const [lowStockThreshold, setLowStockThreshold] = useState(String(settings.lowStockThreshold));
  const [customThreshold, setCustomThreshold] = useState("");
  const [lowStockSearch, setLowStockSearch] = useState("");

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddModifierModal, setShowAddModifierModal] = useState(false);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [newItem, setNewItem] = useState<ItemCreateInput>({
    name: "",
    category: "",
    description: "",
    onSale: false,
    price: 0,
    cost: 0,
    sku: "",
    barcode: "",
    compositeItem: false,
    trackStock: true,
    color: "#3b82f6",
    shape: "circle",
    variants: [],
  });

  const [newCategory, setNewCategory] = useState<CategoryCreateInput>({ name: "", color: "#3b82f6" });

  const [newModifier, setNewModifier] = useState<ModifierCreateInput>({
    name: "",
    price: 0,
    appliesTo: "",
  });

  const [newDiscount, setNewDiscount] = useState<DiscountCreateInput>({
    name: "",
    type: "percentage",
    value: "",
  });

  // ── Dark mode ────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Keep draft in sync when settings are externally reset
  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [i, c, m, d] = await Promise.all([
          itemsApi.getAll(),
          categoriesApi.getAll(),
          modifiersApi.getAll(),
          discountsApi.getAll(),
        ]);
        setBackendOnline(true);
        setItems(i);
        setCategories(c);
        setModifiers(m);
        setDiscounts(d);
        if (c.length > 0) {
          setNewItem(prev => ({ ...prev, category: c[0].name }));
          setNewModifier(prev => ({ ...prev, appliesTo: c[0].name }));
        }
      } catch {
        setBackendOnline(false);
      } finally {
        setLoadingItems(false);
        setLoadingCategories(false);
        setLoadingModifiers(false);
        setLoadingDiscounts(false);
      }
    };
    load();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const data = await analyticsApi.getSummary({ startDate, endDate });
      setBackendOnline(true);
      setAnalytics(data);
    } catch {
      setBackendOnline(false);
      setAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (currentView === "dashboard") fetchAnalytics();
  }, [currentView, fetchAnalytics]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const allCategories = ["All items", ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === "All items" || item.category === categoryFilter;
    const matchesStock =
      stockFilter === "All items" ||
      (stockFilter === "Low stock" && item.status === "LOW_STOCK") ||
      (stockFilter === "In stock" && item.status === "IN_STOCK");
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesStock && matchesSearch;
  });

  const lowStockItems = items.filter(item => {
    const threshold =
      lowStockThreshold === "custom"
        ? parseInt(customThreshold) || 50
        : parseInt(lowStockThreshold);
    const matchesThreshold = item.stock <= threshold;
    const matchesCategory =
      lowStockCategoryFilter === "All items" || item.category === lowStockCategoryFilter;
    const matchesSearch =
      lowStockSearch === "" ||
      item.name.toLowerCase().includes(lowStockSearch.toLowerCase()) ||
      item.sku.toLowerCase().includes(lowStockSearch.toLowerCase());
    return matchesThreshold && matchesCategory && matchesSearch;
  });

  const filteredPosItems = items.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      posSearchQuery === "" ||
      item.name.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(posSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ── CRUD handlers ─────────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    try {
      const created = await itemsApi.create(newItem);
      setItems(prev => [...prev, created]);
      setShowAddItemModal(false);
      setNewItem({
        name: "", category: categories[0]?.name ?? "", description: "",
        onSale: false, price: 0, cost: 0, sku: "", barcode: "",
        compositeItem: false, trackStock: true, color: "#3b82f6",
        shape: "circle", variants: [],
      });
    } catch (err) {
      console.error("Failed to create item:", err);
    }
  };

  const handleAddCategory = async () => {
    try {
      const created = await categoriesApi.create(newCategory);
      setCategories(prev => [...prev, created]);
      setShowAddCategoryModal(false);
      setNewCategory({ name: "", color: "#3b82f6" });
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  };

  const handleAddModifier = async () => {
    try {
      const created = await modifiersApi.create(newModifier);
      setModifiers(prev => [...prev, created]);
      setShowAddModifierModal(false);
      setNewModifier({ name: "", price: 0, appliesTo: categories[0]?.name ?? "" });
    } catch (err) {
      console.error("Failed to create modifier:", err);
    }
  };

  const handleAddDiscount = async () => {
    try {
      const created = await discountsApi.create(newDiscount);
      setDiscounts(prev => [...prev, created]);
      setShowAddDiscountModal(false);
      setNewDiscount({ name: "", type: "percentage", value: "" });
    } catch (err) {
      console.error("Failed to create discount:", err);
    }
  };

  // ── CSV helpers ───────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = ["ID", "Name", "SKU", "Category", "Price", "Cost", "Stock", "Status"];
    const rows = items.map(item => [
      item._id, item.name, item.sku, item.category,
      item.price, item.cost, item.stock, item.status,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `items-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const parsed = lines.slice(1).filter(l => l.trim()).map(line => {
        const v = line.split(",");
        return {
          name: v[1]?.trim() ?? "",
          sku: v[2]?.trim() ?? "",
          category: v[3]?.trim() ?? "",
          price: parseFloat(v[4]) || 0,
          cost: parseFloat(v[5]) || 0,
          stock: parseInt(v[6]) || 0,
          status: (v[7]?.trim() as Item["status"]) ?? "IN_STOCK",
          description: "", onSale: false, compositeItem: false,
          trackStock: true, color: "#3b82f6", shape: "circle",
          variants: [], barcode: "",
        };
      });
      try {
        await itemsApi.importCSV(parsed);
        const updated = await itemsApi.getAll();
        setItems(updated);
      } catch (err) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Selection helpers ─────────────────────────────────────────────────────────
  const toggleSelectItem = (id: string) =>
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedItems(
      selectedItems.length === filteredItems.length ? [] : filteredItems.map(i => i._id)
    );

  const calculateMargin = (price: number, cost: number) =>
    price === 0 ? 0 : ((price - cost) / price) * 100;

  // ── POS helpers ───────────────────────────────────────────────────────────────
  const addToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item._id);
      if (existing) {
        return prev.map(c => c.id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item._id, name: item.name, price: item.price, quantity: 1, category: item.category }];
    });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
    } else {
      setCart(prev => prev.map(c => c.id === id ? { ...c, quantity } : c));
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setPaymentMethod("");
    setAmountReceived("");
    setShowCheckout(false);
    setSelectedDiscount(null);
    setCustomDiscountValue("");
    setCustomDiscountType("percentage");
  };

  const calculateSubtotal = () => cart.reduce((t, i) => t + i.price * i.quantity, 0);

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (selectedDiscount) {
      return selectedDiscount.type === "percentage"
        ? (subtotal * parseFloat(selectedDiscount.value)) / 100
        : parseFloat(selectedDiscount.value);
    }
    if (customDiscountValue) {
      return customDiscountType === "percentage"
        ? (subtotal * parseFloat(customDiscountValue)) / 100
        : parseFloat(customDiscountValue);
    }
    return 0;
  };

  const calculateTax = () => (calculateSubtotal() - calculateDiscount()) * (settings.taxRate / 100);
  const calculateTotal = () => calculateSubtotal() - calculateDiscount() + calculateTax();
  const calculateChange = () => (parseFloat(amountReceived) || 0) - calculateTotal();

  const completeSale = async () => {
    if (completingSale) return;
    setCompletingSale(true);
    try {
      await salesApi.complete({
        items: cart,
        subtotal: calculateSubtotal(),
        discountAmount: calculateDiscount(),
        discountLabel: selectedDiscount?.name,
        total: calculateTotal(),
        paymentMethod: paymentMethod as "cash" | "card" | "wallet",
        amountReceived: paymentMethod === "cash" ? parseFloat(amountReceived) : undefined,
        change: paymentMethod === "cash" ? calculateChange() : undefined,
        customerName: customerName || undefined,
      });
      // refresh items to reflect updated stock
      const updated = await itemsApi.getAll();
      setItems(updated);
      clearCart();
    } catch (err) {
      console.error("Sale failed:", err);
    } finally {
      setCompletingSale(false);
    }
  };

  // ── Formatting ────────────────────────────────────────────────────────────────
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(settings.currencyLocale, {
      style: "currency",
      currency: settings.currencyCode,
    }).format(value);

  // ── Sub-components ────────────────────────────────────────────────────────────
  const MetricCard = ({
    label, value, change,
  }: {
    label: string; value: number; change: number;
  }) => (
    <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">{label}</div>
      <div className="font-mono text-3xl font-bold leading-none mb-4">{formatCurrency(value)}</div>
      <div className="flex items-center gap-2">
        {change >= 0 ? (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10">
            <TrendingUp className="w-3.5 h-3.5 text-success" />
            <span className="font-mono text-sm font-semibold text-success">+{change}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10">
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
            <span className="font-mono text-sm font-semibold text-destructive">{change}%</span>
          </div>
        )}
        <span className="text-muted-foreground text-xs">vs last period</span>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      IN_STOCK: "bg-success/15 text-success border-success/20",
      LOW_STOCK: "bg-warning/15 text-warning border-warning/20",
      OUT_OF_STOCK: "bg-destructive/15 text-destructive border-destructive/20",
      ACTIVE: "bg-success/15 text-success border-success/20",
      INACTIVE: "bg-muted text-muted-foreground border-muted",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${colors[status] ?? ""}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  const EmptyAnalytics = () => (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${backendOnline === false ? "bg-destructive/10" : "bg-muted/30"}`}>
        {backendOnline === false
          ? <AlertTriangle className="w-8 h-8 text-destructive" />
          : <LayoutDashboard className="w-8 h-8 text-muted-foreground" />
        }
      </div>
      <div className="text-center">
        {backendOnline === false ? (
          <>
            <p className="text-sm font-medium mb-1">Backend not running</p>
            <p className="text-xs text-muted-foreground">Start your backend server to see analytics data</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">No sales data for this period</p>
            <p className="text-xs text-muted-foreground">Complete sales to see analytics</p>
          </>
        )}
      </div>
    </div>
  );

  const chartTooltipStyle = {
    fontSize: 13,
    fontFamily: "JetBrains Mono",
    border: "1px solid rgba(0,0,0,0.1)",
    borderRadius: "12px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  };

  const availableColors = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Orange", value: "#f97316" },
    { name: "Pink", value: "#ec4899" },
    { name: "Green", value: "#059669" },
    { name: "Red", value: "#dc2626" },
    { name: "Yellow", value: "#f59e0b" },
  ];

  const availableShapes = [
    { name: "Circle", value: "circle", icon: Circle },
    { name: "Square", value: "square", icon: Square },
    { name: "Triangle", value: "triangle", icon: Triangle },
    { name: "Star", value: "star", icon: Star },
    { name: "Hexagon", value: "hexagon", icon: Hexagon },
  ];

  return (
    <div className="size-full flex bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-72" : "w-20"} ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:relative z-50 h-full border-r border-border/50 bg-gradient-to-b from-sidebar to-sidebar/80 backdrop-blur-xl flex-shrink-0 transition-all duration-300`}
      >
        <div className="p-6 border-b border-sidebar-border/50">
          {sidebarOpen ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {settings.storeName}
                    </h1>
                    <p className="text-xs text-muted-foreground">{settings.storeTagline}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-sidebar-accent/30 rounded-xl border border-sidebar-border/30">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Dark Mode</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
                    darkMode ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${
                      darkMode ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  >
                    {darkMode ? (
                      <Moon className="w-3 h-3 text-primary" />
                    ) : (
                      <Sun className="w-3 h-3 text-muted-foreground" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Package className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        <nav className="p-4 space-y-2">
          <button
            onClick={() => setCurrentView("pos")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              currentView === "pos"
                ? "bg-gradient-to-r from-success to-success/80 text-white shadow-lg shadow-success/20 scale-105"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <ShoppingCart className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Sell Products</span>}
          </button>

          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              currentView === "dashboard"
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20 scale-105"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <div>
            <button
              onClick={() => {
                setItemsExpanded(!itemsExpanded);
                setCurrentView("items");
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                currentView === "items"
                  ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20 scale-105"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Package className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">Items</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${itemsExpanded ? "rotate-180" : ""}`}
                  />
                </>
              )}
            </button>

            {itemsExpanded && sidebarOpen && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-sidebar-border/30 pl-4">
                {[
                  { tab: "list", label: "Item List" },
                  { tab: "categories", label: "Categories" },
                  { tab: "modifiers", label: "Modifiers" },
                  { tab: "discounts", label: "Discounts" },
                  {
                    tab: "low-stock",
                    label: "Low Stock",
                    badge: lowStockItems.length,
                  },
                ].map(item => (
                  <button
                    key={item.tab}
                    onClick={() => setItemsTab(item.tab as ItemsTab)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                      itemsTab === item.tab
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-mono font-bold">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

          <button
            onClick={() => setCurrentView("settings")}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
              currentView === "settings"
                ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/20 scale-105"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </button>

        {sidebarOpen && (
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={() => setSidebarOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm bg-sidebar-accent/50 hover:bg-sidebar-accent transition-all duration-200 text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-4 h-4" />
              <span className="text-xs font-medium">Collapse</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto w-full">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                {currentView === "pos"
                  ? "Point of Sale"
                  : currentView === "dashboard"
                  ? "Analytics Dashboard"
                  : currentView === "settings"
                  ? "Settings"
                  : "Inventory Management"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
                {currentView === "pos"
                  ? "Fast and efficient checkout system"
                  : currentView === "dashboard"
                  ? "Real-time sales performance and insights"
                  : currentView === "settings"
                  ? `Configure ${settings.storeName} system preferences`
                  : "Manage your products, categories, and stock"}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {currentView === "pos" && cart.length > 0 && (
                <button
                  onClick={() => setShowMobileCart(!showMobileCart)}
                  className="lg:hidden relative p-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all duration-200"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full text-xs font-bold flex items-center justify-center">
                    {cart.length}
                  </span>
                </button>
              )}
              <button className="p-2 rounded-xl hover:bg-muted/50 transition-all duration-200 relative hidden sm:flex">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {lowStockItems.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full" />
                )}
              </button>
              <button className="p-2 rounded-xl hover:bg-muted/50 transition-all duration-200 hidden sm:flex">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Backend offline banner ─────────────────────────────────────────── */}
        {backendOnline === false && !bannerDismissed && (
          <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-warning/10 border-b border-warning/30 text-warning-foreground">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-sm flex-1">
              <span className="font-semibold">Backend unreachable</span>
              {" — "}the API server could not be reached. Make sure your backend is running.
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded-lg hover:bg-warning/20 transition-colors flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-warning" />
            </button>
          </div>
        )}

        <div className={currentView === "pos" ? "p-0 h-full" : "p-4 sm:p-6 lg:p-8"}>

          {/* ── POS View ───────────────────────────────────────────────────────── */}
          {currentView === "pos" && (
            <div className="h-full flex flex-col lg:flex-row gap-4 p-4">
              {/* Products panel */}
              <div className="flex-1 flex flex-col gap-4 min-h-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={posSearchQuery}
                      onChange={e => setPosSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {["All", ...Array.from(new Set(items.map(i => i.category)))].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        selectedCategory === cat
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "bg-card border border-border/50 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {cat === "All" ? "All Products" : cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-auto min-h-0">
                  {loadingItems ? (
                    <LoadingSpinner />
                  ) : backendOnline === false ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-16">
                      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-destructive" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Backend not running</p>
                        <p className="text-xs text-muted-foreground mt-1">Start your backend server to load products</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                      {filteredPosItems.map(item => (
                        <button
                          key={item._id}
                          onClick={() => addToCart(item)}
                          disabled={item.stock === 0 || backendOnline === false}
                          className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-4 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-200 text-left group disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                              <Package className="w-6 h-6 text-primary" />
                            </div>
                            {item.stock <= 30 && item.stock > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold">
                                {item.stock} left
                              </span>
                            )}
                            {item.stock === 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-semibold">
                                Out
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">{item.category}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-lg text-primary">
                              {formatCurrency(item.price)}
                            </span>
                            <Plus className="w-5 h-5 text-success opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cart panel */}
              <div
                className={`${
                  showMobileCart ? "fixed" : "hidden"
                } lg:flex lg:relative inset-0 lg:inset-auto z-50 lg:z-auto lg:w-[400px] flex-col bg-gradient-to-br from-card to-card/50 border border-border/50 lg:rounded-2xl shadow-xl`}
              >
                <div className="p-4 sm:p-6 border-b border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-bold">Current Order</h3>
                    <div className="flex items-center gap-2">
                      {cart.length > 0 && (
                        <button
                          onClick={clearCart}
                          className="p-2 hover:bg-destructive/10 rounded-lg text-destructive transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowMobileCart(false)}
                        className="lg:hidden p-2 hover:bg-muted/50 rounded-lg transition-all duration-200"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Customer name (optional)"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-xl text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-3 min-h-0">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                        <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium mb-1">Cart is empty</p>
                      <p className="text-xs text-muted-foreground">Add products to start a sale</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.id}
                        className="bg-muted/20 border border-border/30 rounded-xl p-3 hover:bg-muted/30 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 hover:bg-destructive/10 rounded-lg text-destructive transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-all duration-200"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-mono font-semibold text-sm w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-all duration-200"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">
                              {formatCurrency(item.price)} × {item.quantity}
                            </p>
                            <p className="font-mono font-bold text-primary">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-border/50 p-4 sm:p-6 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Apply Discount
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {discounts.filter(d => d.status === "ACTIVE").map(discount => (
                          <button
                            key={discount._id}
                            onClick={() => {
                              setSelectedDiscount(selectedDiscount?._id === discount._id ? null : discount);
                              setCustomDiscountValue("");
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              selectedDiscount?._id === discount._id
                                ? "bg-primary text-white shadow-md"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            {discount.name} ({discount.type === "percentage" ? `${discount.value}%` : `₱${discount.value}`})
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={customDiscountType}
                          onChange={e => setCustomDiscountType(e.target.value as "percentage" | "amount")}
                          className="px-3 py-2 border border-border/50 rounded-lg text-xs bg-card focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="percentage">%</option>
                          <option value="amount">₱</option>
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={customDiscountValue}
                          onChange={e => {
                            setCustomDiscountValue(e.target.value);
                            setSelectedDiscount(null);
                          }}
                          placeholder="Custom discount"
                          className="flex-1 px-3 py-2 border border-border/50 rounded-lg text-xs font-mono bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-mono">{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      {(selectedDiscount || customDiscountValue) && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-success">
                            Discount{selectedDiscount ? ` (${selectedDiscount.name})` : ""}
                          </span>
                          <span className="font-mono text-success">-{formatCurrency(calculateDiscount())}</span>
                        </div>
                      )}
                      {settings.taxRate > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tax ({settings.taxRate}%)</span>
                          <span className="font-mono">{formatCurrency(calculateTax())}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-border/50">
                        <span>Total</span>
                        <span className="font-mono text-primary">{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>

                    {!showCheckout ? (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { method: "cash" as const, icon: DollarSign, label: "Cash", color: "text-success" },
                          { method: "card" as const, icon: CreditCard, label: "Card", color: "text-primary" },
                          { method: "wallet" as const, icon: Smartphone, label: "Wallet", color: "text-purple-500" },
                        ].map(({ method, icon: Icon, label, color }) => (
                          <button
                            key={method}
                            onClick={() => { setPaymentMethod(method); setShowCheckout(true); }}
                            className="flex flex-col items-center gap-2 p-3 border-2 border-border/50 rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200"
                          >
                            <Icon className={`w-6 h-6 ${color}`} />
                            <span className="text-xs font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-xl">
                          {paymentMethod === "cash" && <DollarSign className="w-5 h-5 text-success" />}
                          {paymentMethod === "card" && <CreditCard className="w-5 h-5 text-primary" />}
                          {paymentMethod === "wallet" && <Smartphone className="w-5 h-5 text-purple-500" />}
                          <span className="font-medium capitalize">{paymentMethod} Payment</span>
                          <button
                            onClick={() => { setShowCheckout(false); setPaymentMethod(""); setAmountReceived(""); }}
                            className="ml-auto p-1 hover:bg-muted/50 rounded-lg transition-all duration-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {paymentMethod === "cash" && (
                          <>
                            <div>
                              <label className="block text-xs font-medium mb-2">Amount Received</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">₱</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={amountReceived}
                                  onChange={e => setAmountReceived(e.target.value)}
                                  className="w-full pl-7 pr-4 py-2.5 border border-border/50 rounded-xl text-sm font-mono bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                            {amountReceived && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                  <span className="text-sm font-medium">Amount Tendered</span>
                                  <span className="font-mono font-bold text-lg">
                                    {formatCurrency(parseFloat(amountReceived) || 0)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-success/10 rounded-xl">
                                  <span className="text-sm font-medium">Change</span>
                                  <span className="font-mono font-bold text-lg text-success">
                                    {formatCurrency(calculateChange())}
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        <button
                          onClick={completeSale}
                          disabled={
                            completingSale ||
                            (paymentMethod === "cash" && (!amountReceived || calculateChange() < 0))
                          }
                          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-success to-success/80 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          {completingSale ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                          {completingSale ? "Processing..." : "Complete Sale"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Dashboard View ─────────────────────────────────────────────────── */}
          {currentView === "dashboard" && (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1 sm:gap-2 p-1.5 bg-muted/30 border border-border/50 rounded-xl overflow-x-auto scrollbar-hide w-full sm:w-auto">
                  {[
                    { value: "summary", label: "Sales Summary" },
                    { value: "by-item", label: "By Item" },
                    { value: "by-category", label: "By Category" },
                    { value: "by-payment", label: "By Payment" },
                    { value: "receipt", label: "Receipt" },
                    { value: "discount", label: "Discount" },
                  ].map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setDashboardFilter(filter.value as DashboardFilter)}
                      className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        dashboardFilter === filter.value
                          ? "bg-primary text-white shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-card border border-border/50 rounded-xl shadow-sm w-full sm:w-auto">
                  <Calendar className="w-3 sm:w-4 h-3 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="text-xs sm:text-sm font-mono bg-transparent border-none outline-none min-w-0"
                  />
                  <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="text-xs sm:text-sm font-mono bg-transparent border-none outline-none min-w-0"
                  />
                </div>
              </div>

              {loadingAnalytics ? (
                <LoadingSpinner />
              ) : !analytics ? (
                <EmptyAnalytics />
              ) : (
                <>
                  {dashboardFilter === "summary" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                        <MetricCard label="Gross Sales" value={analytics.metrics.grossSales} change={analytics.metricsChange.grossSales} />
                        <MetricCard label="Refunds" value={analytics.metrics.refunds} change={analytics.metricsChange.refunds} />
                        <MetricCard label="Discounts" value={analytics.metrics.discounts} change={analytics.metricsChange.discounts} />
                        <MetricCard label="Net Sales" value={analytics.metrics.netSales} change={analytics.metricsChange.netSales} />
                        <MetricCard label="Gross Profit" value={analytics.metrics.grossProfit} change={analytics.metricsChange.grossProfit} />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                            Sales Trend
                          </h3>
                          {analytics.salesTrend.length === 0 ? (
                            <EmptyAnalytics />
                          ) : (
                            <ResponsiveContainer width="100%" height={280}>
                              <LineChart data={analytics.salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                                <Tooltip contentStyle={chartTooltipStyle} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} name="Sales" dot={{ fill: "#3b82f6", r: 5 }} activeDot={{ r: 7 }} />
                                <Line type="monotone" dataKey="profit" stroke="#059669" strokeWidth={3} name="Profit" dot={{ fill: "#059669", r: 5 }} activeDot={{ r: 7 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                            Sales by Category
                          </h3>
                          {analytics.salesByCategory.length === 0 ? (
                            <EmptyAnalytics />
                          ) : (
                            <ResponsiveContainer width="100%" height={280}>
                              <PieChart>
                                <Pie data={analytics.salesByCategory} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name.split(" ")[0]} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value">
                                  {analytics.salesByCategory.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={chartTooltipStyle} />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                          Top Selling Items
                        </h3>
                        {analytics.topItems.length === 0 ? (
                          <EmptyAnalytics />
                        ) : (
                          <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={analytics.topItems} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#737373" }} width={150} axisLine={false} />
                              <Tooltip contentStyle={chartTooltipStyle} />
                              <Legend wrapperStyle={{ fontSize: 12 }} />
                              <Bar dataKey="sold" fill="#3b82f6" name="Units Sold" radius={[0, 8, 8, 0]} />
                              <Bar dataKey="revenue" fill="#14b8a6" name="Revenue (₱)" radius={[0, 8, 8, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </>
                  )}

                  {dashboardFilter === "by-item" && (
                    <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        Sales by Item
                      </h3>
                      {analytics.topItems.length === 0 ? (
                        <EmptyAnalytics />
                      ) : (
                        <ResponsiveContainer width="100%" height={500}>
                          <BarChart data={analytics.topItems}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                            <Tooltip contentStyle={chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₱)" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}

                  {dashboardFilter === "by-category" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                          Category Distribution
                        </h3>
                        {analytics.salesByCategory.length === 0 ? (
                          <EmptyAnalytics />
                        ) : (
                          <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                              <Pie data={analytics.salesByCategory} cx="50%" cy="50%" labelLine outerRadius={110} label={({ name, value }) => `${name}: ₱${(value / 1000).toFixed(1)}k`} dataKey="value">
                                {analytics.salesByCategory.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={chartTooltipStyle} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                          Category Performance
                        </h3>
                        {analytics.salesByCategory.length === 0 ? (
                          <EmptyAnalytics />
                        ) : (
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={analytics.salesByCategory} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: "#737373" }} width={150} axisLine={false} />
                              <Tooltip contentStyle={chartTooltipStyle} />
                              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )}

                  {dashboardFilter === "by-payment" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                          Payment Methods
                        </h3>
                        {analytics.salesByPayment.length === 0 ? (
                          <EmptyAnalytics />
                        ) : (
                          <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                              <Pie data={analytics.salesByPayment} cx="50%" cy="50%" labelLine label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`} outerRadius={110} dataKey="value">
                                {analytics.salesByPayment.map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={chartTooltipStyle} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                          Payment Breakdown
                        </h3>
                        <div className="space-y-4">
                          {analytics.salesByPayment.map((payment, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/30 transition-all duration-200">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: payment.color }} />
                                <span className="font-medium">{payment.name}</span>
                              </div>
                              <span className="font-mono font-bold text-lg">{formatCurrency(payment.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardFilter === "receipt" && (
                    <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        Receipt Analysis
                      </h3>
                      {analytics.receiptData.length === 0 ? (
                        <EmptyAnalytics />
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={analytics.receiptData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                            <Tooltip contentStyle={chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="count" fill="#8b5cf6" name="Receipt Count" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="total" fill="#3b82f6" name="Total Sales (₱)" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}

                  {dashboardFilter === "discount" && (
                    <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                        Discount Usage
                      </h3>
                      {analytics.discountData.length === 0 ? (
                        <EmptyAnalytics />
                      ) : (
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={analytics.discountData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: "#737373" }} axisLine={false} />
                            <Tooltip contentStyle={chartTooltipStyle} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="usage" fill="#f97316" name="Usage Count" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="total" fill="#dc2626" name="Total Discount (₱)" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Items View ─────────────────────────────────────────────────────── */}
          {currentView === "items" && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
              {itemsTab === "list" && (
                <div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowAddItemModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-success to-success/80 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        Add Item
                      </button>
                      <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border/50 rounded-xl font-medium hover:bg-muted/50 transition-all duration-300 hover:shadow-md"
                      >
                        <Upload className="w-4 h-4" />
                        Import
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border/50 rounded-xl font-medium hover:bg-muted/50 transition-all duration-300 hover:shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                      <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      >
                        {allCategories.map(cat => <option key={cat}>{cat}</option>)}
                      </select>
                      <select
                        value={stockFilter}
                        onChange={e => setStockFilter(e.target.value)}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      >
                        <option>All items</option>
                        <option>In stock</option>
                        <option>Low stock</option>
                      </select>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 sm:py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm overflow-x-auto">
                    {loadingItems ? (
                      <LoadingSpinner />
                    ) : (
                      <table className="w-full min-w-[800px]">
                        <thead className="bg-muted/30 border-b border-border/50">
                          <tr>
                            <th className="px-6 py-4 w-12">
                              <input
                                type="checkbox"
                                checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                onChange={toggleSelectAll}
                                className="w-4 h-4 rounded border-border"
                              />
                            </th>
                            {["Item name", "Category", "Price", "Cost", "Margin", "In stock", ""].map((h, i) => (
                              <th
                                key={i}
                                className={`px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold ${
                                  i > 1 && i < 6 ? "text-right" : i === 0 ? "text-left" : "text-left"
                                }`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-16 text-center">
                                {backendOnline === false ? (
                                  <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                                      <AlertTriangle className="w-6 h-6 text-destructive" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Backend not running</p>
                                      <p className="text-xs text-muted-foreground mt-1">Start your backend server to load inventory</p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-sm">No items found</p>
                                )}
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map(item => (
                              <tr key={item._id} className="hover:bg-muted/20 transition-all duration-200 group">
                                <td className="px-6 py-4">
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item._id)}
                                    onChange={() => toggleSelectItem(item._id)}
                                    className="w-4 h-4 rounded border-border"
                                  />
                                </td>
                                <td className="px-6 py-4 font-medium">{item.name}</td>
                                <td className="px-6 py-4"><span className="text-sm text-muted-foreground">{item.category}</span></td>
                                <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(item.price)}</td>
                                <td className="px-6 py-4 text-right font-mono text-muted-foreground">{formatCurrency(item.cost)}</td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-mono font-semibold text-success">
                                    {calculateMargin(item.price, item.cost).toFixed(1)}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className={`font-mono font-semibold ${item.status === "LOW_STOCK" ? "text-warning" : ""}`}>
                                    {item.stock}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <button className="p-1.5 rounded-lg hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {itemsTab === "categories" && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={() => setShowAddCategoryModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-success to-success/80 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Add Category
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                    {loadingCategories ? (
                      <LoadingSpinner />
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border/50">
                          <tr>
                            <th className="px-6 py-4 w-12"><input type="checkbox" className="w-4 h-4 rounded border-border" /></th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Name</th>
                            <th className="px-6 py-4 w-12" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {categories.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground text-sm">No categories yet</td></tr>
                          ) : (
                            categories.map(cat => (
                              <tr key={cat._id} className="hover:bg-muted/20 transition-all duration-200 group">
                                <td className="px-6 py-4"><input type="checkbox" className="w-4 h-4 rounded border-border" /></td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full shadow-md" style={{ backgroundColor: cat.color }} />
                                    <span className="font-medium">{cat.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <button className="p-1.5 rounded-lg hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {itemsTab === "modifiers" && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={() => setShowAddModifierModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-success to-success/80 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Add Modifier
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                    {loadingModifiers ? (
                      <LoadingSpinner />
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border/50">
                          <tr>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Name</th>
                            <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Price</th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Applies To</th>
                            <th className="px-6 py-4 w-12" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {modifiers.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">No modifiers yet</td></tr>
                          ) : (
                            modifiers.map(mod => (
                              <tr key={mod._id} className="hover:bg-muted/20 transition-all duration-200 group">
                                <td className="px-6 py-4 font-medium">{mod.name}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium">{formatCurrency(mod.price)}</td>
                                <td className="px-6 py-4 text-muted-foreground">{mod.appliesTo}</td>
                                <td className="px-6 py-4">
                                  <button className="p-1.5 rounded-lg hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {itemsTab === "discounts" && (
                <div>
                  <div className="mb-6">
                    <button
                      onClick={() => setShowAddDiscountModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-success to-success/80 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-success/20 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      Add Discount
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                    {loadingDiscounts ? (
                      <LoadingSpinner />
                    ) : (
                      <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border/50">
                          <tr>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Name</th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Type</th>
                            <th className="text-right px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Value</th>
                            <th className="text-left px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</th>
                            <th className="px-6 py-4 w-12" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {discounts.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">No discounts yet</td></tr>
                          ) : (
                            discounts.map(discount => (
                              <tr key={discount._id} className="hover:bg-muted/20 transition-all duration-200 group">
                                <td className="px-6 py-4 font-medium">{discount.name}</td>
                                <td className="px-6 py-4 text-muted-foreground capitalize">{discount.type}</td>
                                <td className="px-6 py-4 text-right font-mono font-medium">
                                  {discount.type === "percentage" ? `${discount.value}%` : `₱${discount.value}`}
                                </td>
                                <td className="px-6 py-4"><StatusBadge status={discount.status} /></td>
                                <td className="px-6 py-4">
                                  <button className="p-1.5 rounded-lg hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {itemsTab === "low-stock" && (
                <div>
                  <div className="flex items-center gap-3 mb-6 flex-wrap p-6 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg backdrop-blur-sm">
                    <Filter className="w-5 h-5 text-muted-foreground" />
                    <select
                      value={lowStockCategoryFilter}
                      onChange={e => setLowStockCategoryFilter(e.target.value)}
                      className="px-4 py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    >
                      {allCategories.map(cat => <option key={cat}>{cat}</option>)}
                    </select>
                    <select
                      value={lowStockThreshold}
                      onChange={e => setLowStockThreshold(e.target.value)}
                      className="px-4 py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    >
                      <option value="10">≤ 10</option>
                      <option value="20">≤ 20</option>
                      <option value="30">≤ 30</option>
                      <option value="custom">Custom</option>
                    </select>
                    {lowStockThreshold === "custom" && (
                      <input
                        type="number"
                        placeholder="Enter threshold"
                        value={customThreshold}
                        onChange={e => setCustomThreshold(e.target.value)}
                        className="px-4 py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 w-40 font-mono"
                      />
                    )}
                    <div className="relative flex-1 min-w-[250px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={lowStockSearch}
                        onChange={e => setLowStockSearch(e.target.value)}
                        placeholder="Search items..."
                        className="w-full pl-10 pr-4 py-2.5 border border-border/50 rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {lowStockItems.length > 0 && (
                    <div className="border-l-4 border-warning bg-gradient-to-r from-warning/10 to-transparent rounded-2xl p-6 mb-6 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-warning mb-1">Low Stock Alert</h3>
                        <p className="text-sm text-muted-foreground">
                          {lowStockItems.length} item{lowStockItems.length !== 1 ? "s" : ""} require immediate attention
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                    <table className="w-full">
                      <thead className="bg-muted/30 border-b border-border/50">
                        <tr>
                          {["Item Name", "SKU", "Category", "Current Stock", "Status"].map((h, i) => (
                            <th key={i} className={`px-6 py-4 text-xs uppercase tracking-wider text-muted-foreground font-semibold ${i === 3 ? "text-right" : "text-left"}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {loadingItems ? (
                          <tr><td colSpan={5}><LoadingSpinner /></td></tr>
                        ) : lowStockItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                                  <Package className="w-8 h-8 text-success" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium mb-1">All items are adequately stocked</p>
                                  <p className="text-xs text-muted-foreground">No items below the threshold</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          lowStockItems.map(item => (
                            <tr key={item._id} className="hover:bg-muted/20 transition-all duration-200">
                              <td className="px-6 py-4 font-medium">{item.name}</td>
                              <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{item.sku}</td>
                              <td className="px-6 py-4 text-muted-foreground">{item.category}</td>
                              <td className="px-6 py-4 text-right">
                                <span className="font-mono font-bold text-warning text-lg">{item.stock}</span>
                              </td>
                              <td className="px-6 py-4"><StatusBadge status={item.status} /></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Settings View ─────────────────────────────────────────────────── */}
          {currentView === "settings" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">

              {/* General */}
              <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">General</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Branding shown across the system</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Store Name</label>
                    <p className="text-xs text-muted-foreground mb-2">Appears in the sidebar header and browser tab.</p>
                    <input
                      type="text"
                      value={draftSettings.storeName}
                      onChange={e => setDraftSettings(p => ({ ...p, storeName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      placeholder="e.g. PharmacyMed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Store Tagline</label>
                    <p className="text-xs text-muted-foreground mb-2">Subtitle shown beneath the store name in the sidebar.</p>
                    <input
                      type="text"
                      value={draftSettings.storeTagline}
                      onChange={e => setDraftSettings(p => ({ ...p, storeTagline: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      placeholder="e.g. Pharmacy Management"
                    />
                  </div>
                </div>
              </div>

              {/* Currency */}
              <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Currency</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Controls how prices and totals are formatted everywhere.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Currency Code</label>
                      <p className="text-xs text-muted-foreground mb-2">ISO 4217 code.</p>
                      <input
                        type="text"
                        value={draftSettings.currencyCode}
                        onChange={e => setDraftSettings(p => ({ ...p, currencyCode: e.target.value.toUpperCase() }))}
                        maxLength={3}
                        className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        placeholder="PHP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Symbol</label>
                      <p className="text-xs text-muted-foreground mb-2">Displayed in POS.</p>
                      <input
                        type="text"
                        value={draftSettings.currencySymbol}
                        onChange={e => setDraftSettings(p => ({ ...p, currencySymbol: e.target.value }))}
                        maxLength={4}
                        className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        placeholder="₱"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Locale</label>
                      <p className="text-xs text-muted-foreground mb-2">BCP 47 tag.</p>
                      <input
                        type="text"
                        value={draftSettings.currencyLocale}
                        onChange={e => setDraftSettings(p => ({ ...p, currencyLocale: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        placeholder="en-PH"
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-xl flex items-center gap-3 border border-border/30">
                    <span className="text-xs text-muted-foreground">Preview:</span>
                    <span className="font-mono font-bold text-primary text-sm">
                      {(() => {
                        try {
                          return new Intl.NumberFormat(draftSettings.currencyLocale, {
                            style: "currency",
                            currency: draftSettings.currencyCode,
                          }).format(1234.56);
                        } catch {
                          return "Invalid locale or currency code";
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Point of Sale */}
              <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Point of Sale</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Affects checkout calculations and receipt output.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Tax Rate (%)</label>
                    <p className="text-xs text-muted-foreground mb-2">Applied to every transaction total. Set to 0 to disable tax.</p>
                    <div className="relative w-48">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={draftSettings.taxRate}
                        onChange={e => setDraftSettings(p => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-4 pr-10 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold text-sm">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Receipt Footer Message</label>
                    <p className="text-xs text-muted-foreground mb-2">Shown at the bottom of every sale receipt.</p>
                    <input
                      type="text"
                      value={draftSettings.receiptFooter}
                      onChange={e => setDraftSettings(p => ({ ...p, receiptFooter: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      placeholder="Thank you for your purchase!"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-lg overflow-hidden backdrop-blur-sm">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/20">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Inventory</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Controls how stock levels are evaluated.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Default Low Stock Threshold</label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Items at or below this quantity are flagged as LOW_STOCK and shown in the Low Stock alert tab.
                      This also pre-fills the threshold dropdown in the Items → Low Stock view.
                    </p>
                    <div className="relative w-48">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={draftSettings.lowStockThreshold}
                        onChange={e => setDraftSettings(p => ({ ...p, lowStockThreshold: parseInt(e.target.value) || 1 }))}
                        className="w-full pl-4 pr-16 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                        placeholder="30"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">units</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-4 pb-8">
                <button
                  onClick={() => {
                    setDraftSettings(DEFAULT_SETTINGS);
                    resetSettings();
                  }}
                  className="px-5 py-2.5 border border-destructive/40 text-destructive rounded-xl text-sm font-medium hover:bg-destructive/5 transition-all duration-200"
                >
                  Reset to Defaults
                </button>

                <button
                  onClick={applySettings}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105"
                >
                  {settingsSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    "Apply Changes"
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Add Item Modal ─────────────────────────────────────────────────────── */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-b border-border/50 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold">Add New Item</h2>
              <button onClick={() => setShowAddItemModal(false)} className="p-2 hover:bg-muted/50 rounded-xl transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select
                    value={newItem.category}
                    onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  >
                    {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all duration-200"
                  placeholder="Enter item description"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                <input
                  type="checkbox"
                  id="onSale"
                  checked={newItem.onSale}
                  onChange={e => setNewItem({ ...newItem, onSale: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="onSale" className="text-sm font-medium">On Sale</label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.price || ""}
                      onChange={e => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Cost</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.cost || ""}
                      onChange={e => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">SKU</label>
                  <input
                    type="text"
                    value={newItem.sku}
                    onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    placeholder="Enter SKU"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Barcode</label>
                  <input
                    type="text"
                    value={newItem.barcode}
                    onChange={e => setNewItem({ ...newItem, barcode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    placeholder="Enter barcode"
                  />
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-sm font-semibold mb-4">Inventory</h3>
                <div className="space-y-4">
                  {[
                    { key: "compositeItem" as const, label: "Composite Item" },
                    { key: "trackStock" as const, label: "Track Stock" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                      <label className="text-sm font-medium">{label}</label>
                      <button
                        onClick={() => setNewItem({ ...newItem, [key]: !newItem[key] })}
                        className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
                          newItem[key] ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                            newItem[key] ? "translate-x-7" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-sm font-semibold mb-4">Variants</h3>
                <button className="flex items-center gap-2 px-4 py-2.5 border border-border/50 rounded-xl text-sm hover:bg-muted/30 transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  Add Variants
                </button>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h3 className="text-sm font-semibold mb-4">Representation on POS</h3>
                <div className="mb-6">
                  <label className="block text-sm mb-3">Color</label>
                  <div className="flex gap-3">
                    {availableColors.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setNewItem({ ...newItem, color: color.value })}
                        className={`w-12 h-12 rounded-2xl border-2 transition-all duration-200 ${
                          newItem.color === color.value ? "border-foreground scale-110 shadow-xl" : "border-border/50 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-3">Shape</label>
                  <div className="flex gap-3">
                    {availableShapes.map(({ name, value, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setNewItem({ ...newItem, shape: value })}
                        className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all duration-200 ${
                          newItem.shape === value ? "border-primary bg-primary/10 scale-110" : "border-border/50 hover:bg-muted/30 hover:scale-105"
                        }`}
                        title={name}
                      >
                        <Icon className={`w-7 h-7 ${newItem.shape === value ? "text-primary" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-t border-border/50 p-6 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddItemModal(false)} className="px-6 py-2.5 border border-border/50 rounded-xl text-sm font-medium hover:bg-muted/30 transition-all duration-200">
                Cancel
              </button>
              <button onClick={handleAddItem} className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Category Modal ─────────────────────────────────────────────────── */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-b border-border/50 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold">Add New Category</h2>
              <button onClick={() => setShowAddCategoryModal(false)} className="p-2 hover:bg-muted/50 rounded-xl transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3">Color</label>
                <div className="flex gap-3 flex-wrap">
                  {availableColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setNewCategory({ ...newCategory, color: color.value })}
                      className={`w-12 h-12 rounded-2xl border-2 transition-all duration-200 ${
                        newCategory.color === color.value ? "border-foreground scale-110 shadow-xl" : "border-border/50 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-t border-border/50 p-6 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddCategoryModal(false)} className="px-6 py-2.5 border border-border/50 rounded-xl text-sm font-medium hover:bg-muted/30 transition-all duration-200">
                Cancel
              </button>
              <button onClick={handleAddCategory} className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Modifier Modal ─────────────────────────────────────────────────── */}
      {showAddModifierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-b border-border/50 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold">Add New Modifier</h2>
              <button onClick={() => setShowAddModifierModal(false)} className="p-2 hover:bg-muted/50 rounded-xl transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={newModifier.name}
                  onChange={e => setNewModifier({ ...newModifier, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  placeholder="Enter modifier name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    value={newModifier.price || ""}
                    onChange={e => setNewModifier({ ...newModifier, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Applies To</label>
                <select
                  value={newModifier.appliesTo}
                  onChange={e => setNewModifier({ ...newModifier, appliesTo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                >
                  {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-t border-border/50 p-6 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddModifierModal(false)} className="px-6 py-2.5 border border-border/50 rounded-xl text-sm font-medium hover:bg-muted/30 transition-all duration-200">
                Cancel
              </button>
              <button onClick={handleAddModifier} className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
                Add Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Discount Modal ─────────────────────────────────────────────────── */}
      {showAddDiscountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/50 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-b border-border/50 p-6 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold">Add New Discount</h2>
              <button onClick={() => setShowAddDiscountModal(false)} className="p-2 hover:bg-muted/50 rounded-xl transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={newDiscount.name}
                  onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  placeholder="Enter discount name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3">Type</label>
                <div className="space-y-2">
                  {[
                    { val: "percentage", label: "Percentage" },
                    { val: "amount", label: "Fixed Amount" },
                  ].map(({ val, label }) => (
                    <label key={val} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl cursor-pointer hover:bg-muted/50 transition-all duration-200">
                      <input
                        type="radio"
                        name="discountType"
                        checked={newDiscount.type === val}
                        onChange={() => setNewDiscount({ ...newDiscount, type: val as "percentage" | "amount" })}
                        className="w-4 h-4 border-border"
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Value</label>
                <div className="relative">
                  {newDiscount.type === "amount" && (
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">₱</span>
                  )}
                  <input
                    type="number"
                    step={newDiscount.type === "percentage" ? "1" : "0.01"}
                    value={newDiscount.value}
                    onChange={e => setNewDiscount({ ...newDiscount, value: e.target.value })}
                    className={`w-full ${newDiscount.type === "amount" ? "pl-8" : "pl-4"} pr-10 py-2.5 border border-border/50 rounded-xl bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200`}
                    placeholder={newDiscount.type === "percentage" ? "0" : "0.00"}
                  />
                  {newDiscount.type === "percentage" && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono font-bold">%</span>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gradient-to-r from-card to-card/80 backdrop-blur-xl border-t border-border/50 p-6 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setShowAddDiscountModal(false)} className="px-6 py-2.5 border border-border/50 rounded-xl text-sm font-medium hover:bg-muted/30 transition-all duration-200">
                Cancel
              </button>
              <button onClick={handleAddDiscount} className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
                Add Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
