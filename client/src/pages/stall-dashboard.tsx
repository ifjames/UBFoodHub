import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock, 
  CheckCircle, 
  Package,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Settings,
  Store,
  Image as ImageIcon,
  Save,
  LogOut,
  Camera,
  X,
  MessageSquare,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { 
  subscribeToQuery, 
  addDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument,
  getDocuments,
  getCollection,
  auth,
  db,
  logOut,
  increment,
  runTransaction
} from "@/lib/firebase";
import { collection, getDocs, doc } from "firebase/firestore";
import { useLocation } from "wouter";
import NotificationBell from "@/components/notifications/notification-bell";
import CancellationRequestManagement from "@/components/orders/cancellation-request-management";
import NotificationService from "@/lib/notification-service";
import BottomNav from "@/components/layout/bottom-nav";
import QRScanner from "@/components/qr-scanner";


export default function StallDashboard() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stallInfo, setStallInfo] = useState<any>(null);
  const [stallId, setStallId] = useState<string | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("menu");
  const [orderFilter, setOrderFilter] = useState("all");
  const [menuFilter, setMenuFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(20);
  const [overviewOrdersPerPage] = useState(5);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [ordersInitialized, setOrdersInitialized] = useState(false);
  const [stallForm, setStallForm] = useState({
    name: "",
    description: "",
    categories: [] as string[],
    image: "",
    isActive: true,
  });
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [isEditingStall, setIsEditingStall] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Main Course",
    isAvailable: true,
    isPopular: false,
    image: "",
    stock: 0,
    customizations: [{ name: "", price: 0 }] // For customizations like "Extra Rice +25", "Choice of Rice", etc.
  });

  // Drag-to-scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (state.user?.id) {
      // First, check if this user has a stall with their Auth UID as document ID
      getDocument("stalls", state.user.id).then((doc) => {
        if (doc.exists()) {
          const stall = { id: doc.id, ...doc.data() };
          setStallInfo(stall);
          setStallId(doc.id);
          console.log("Found stall with user ID as doc ID:", stall);
        } else {
          console.log("No stall found with user ID as doc ID, searching by ownerId...");
          // If not found, search for stall where ownerId matches the user's Auth UID
          subscribeToQuery("stalls", "ownerId", "==", state.user?.id || "", (stalls) => {
            console.log("Stalls found by ownerId:", stalls);
            if (stalls.length > 0) {
              const stall = stalls[0];
              setStallInfo(stall);
              setStallId(stall.id);
              // Populate stall form for editing
              setStallForm({
                name: stall.name || "",
                description: stall.description || "",
                categories: stall.categories || (stall.category ? [stall.category] : []),
                image: stall.image || "",
                isActive: stall.isActive !== undefined ? stall.isActive : true,
              });
              console.log("Found stall by ownerId:", stall);
            } else {
              console.log("No stall found for user:", state.user?.id);
              // No stall found - user needs to wait for admin to create their stall
            }
          });
        }
      });
    }
  }, [state.user?.id]);

  // Subscribe to menu items and orders when stallId is available
  useEffect(() => {
    // Fetch categories created by admin
    const fetchCategories = async () => {
      try {
        console.log("Fetching admin categories from 'categories' collection...");
        
        // Test Firebase authentication and permissions first
        console.log("Current Firebase user:", auth.currentUser);
        console.log("User email:", auth.currentUser?.email);
        console.log("User uid:", auth.currentUser?.uid);
        
        // First, try to access the categories collection directly using Firebase SDK
        try {
          console.log("Getting ALL categories directly from Firebase...");
          const categoriesRef = collection(db, "categories");
          const snapshot = await getDocs(categoriesRef);
          console.log("Direct Firebase query result:", snapshot);
          console.log("Snapshot size:", snapshot.size);
          console.log("Snapshot empty:", snapshot.empty);
          
          if (!snapshot.empty) {
            const allData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            console.log("ALL categories found via direct query:", allData);
            
            if (allData.length > 0) {
              const categoryNames = allData
                .sort((a: any, b: any) => {
                  if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                  }
                  if (a.order !== undefined) return -1;
                  if (b.order !== undefined) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((cat: any) => cat.name);
              setAvailableCategories(categoryNames);
              console.log("Admin-created categories loaded via direct query:", categoryNames);
              return;
            }
          } else {
            console.log("Categories collection is empty");
          }
        } catch (directError: any) {
          console.error("Direct Firebase query failed:", directError);
          console.error("Error code:", directError?.code);
          console.error("Error message:", directError?.message);
        }
        
        // Fallback: try using the getCollection wrapper function
        try {
          console.log("Trying getCollection wrapper function...");
          const allCats = await getCollection("categories");
          console.log("getCollection result:", allCats);
          
          if (allCats && allCats.docs) {
            const allData = allCats.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            console.log("Categories via wrapper function:", allData);
            
            if (allData.length > 0) {
              const categoryNames = allData
                .sort((a: any, b: any) => {
                  if (a.order !== undefined && b.order !== undefined) {
                    return a.order - b.order;
                  }
                  if (a.order !== undefined) return -1;
                  if (b.order !== undefined) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((cat: any) => cat.name);
              setAvailableCategories(categoryNames);
              console.log("Admin-created categories loaded via wrapper:", categoryNames);
              return;
            }
          }
        } catch (wrapperError) {
          console.error("Wrapper function failed:", wrapperError);
        }
        
        // Fallback to existing categories from current stall
        console.log("Using fallback categories from stall info");
        if (stallInfo?.categories && Array.isArray(stallInfo.categories)) {
          setAvailableCategories(stallInfo.categories);
        } else if (stallInfo?.category) {
          setAvailableCategories([stallInfo.category]);
        } else {
          setAvailableCategories(["Chinese", "Filipino"]);
        }
      } catch (error) {
        console.error("Error fetching admin categories:", error);
        // Final fallback
        setAvailableCategories(["Chinese", "Filipino"]);
      }
    };

    fetchCategories();

    if (stallId) {
      // Subscribe to menu items for this stall
      const unsubscribeMenuItems = subscribeToQuery(
        "menuItems", 
        "stallId", 
        "==", 
        stallId, 
        (items) => {
          console.log("Stall dashboard menu items:", items);
          setMenuItems(items);
        }
      );

      // Subscribe to orders for this stall
      const unsubscribeOrders = subscribeToQuery(
        "orders", 
        "stallId", 
        "==", 
        stallId, 
        (ordersData) => {
          setOrders(ordersData);
          setOrdersInitialized(true);
        }
      );

      // Subscribe to reviews for this stall
      const unsubscribeReviews = subscribeToQuery(
        "reviews", 
        "stallId", 
        "==", 
        stallId, 
        setReviews
      );

      return () => {
        unsubscribeMenuItems();
        unsubscribeOrders();
        unsubscribeReviews();
      };
    }
  }, [stallId]);

  const handleSaveMenuItem = async () => {
    if (!itemForm.name || !itemForm.price) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!stallId) {
      toast({
        title: "Error",
        description: "Stall information not found. Please contact admin to assign a stall to your account.",
        variant: "destructive",
      });
      return;
    }

    try {
      const menuItemData = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        stock: parseInt(itemForm.stock.toString()) || 0,
        stallId: stallId,
        customizations: itemForm.customizations.filter(c => c.name.trim() !== ""),
        createdAt: new Date()
      };
      
      console.log("Saving menu item with stallId:", stallId);

      if (editingItem) {
        await updateDocument("menuItems", editingItem.id, menuItemData);
        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        await addDocument("menuItems", menuItemData);
        toast({
          title: "Success",
          description: "Menu item added successfully",
        });
      }

      setIsMenuDialogOpen(false);
      setEditingItem(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setItemForm({
      name: "",
      description: "",
      price: "",
      category: "Main Course",
      isAvailable: true,
      isPopular: false,
      image: "",
      stock: 0,
      customizations: [{ name: "", price: 0 }]
    });
  };

  const toggleItemAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      await updateDocument("menuItems", itemId, { isAvailable: !isAvailable });
      toast({
        title: "Success",
        description: `Item ${!isAvailable ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item availability",
        variant: "destructive",
      });
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      await deleteDocument("menuItems", itemId);
      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  // Stall editing functions
  const handleSaveStall = async () => {
    if (!stallForm.name || stallForm.categories.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in stall name and select at least one category",
        variant: "destructive",
      });
      return;
    }

    if (!stallId) {
      toast({
        title: "Error", 
        description: "Stall information not found",
        variant: "destructive",
      });
      return;
    }

    try {
      const stallData = {
        name: stallForm.name,
        description: stallForm.description,
        categories: stallForm.categories,
        image: stallForm.image,
        isActive: stallForm.isActive,
      };

      await updateDocument("stalls", stallId, stallData);
      
      // Update local state
      setStallInfo((prev: any) => prev ? { ...prev, ...stallData } : null);
      
      toast({
        title: "Success",
        description: "Stall information updated successfully",
      });
      
      setIsEditingStall(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update stall information",
        variant: "destructive",
      });
    }
  };

  const toggleCategory = (category: string) => {
    setStallForm(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleLogout = async () => {
    try {
      await logOut();
      dispatch({ type: "SET_USER", payload: null });
      setLocation("/login");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Find the order from local state for notification purposes
      const localOrder = orders.find(o => o.id === orderId);
      
      // Use a transaction to ensure atomic updates and prevent race conditions
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", orderId);
        const orderDoc = await transaction.get(orderRef);
        
        if (!orderDoc.exists()) {
          throw new Error("Order not found");
        }
        
        const orderData = orderDoc.data();
        
        // Only deduct stock when transitioning from non-completed to completed
        // Check the persisted status from Firestore, not local state
        if (newStatus === 'completed' && orderData.status !== 'completed' && orderData.items) {
          for (const orderItem of orderData.items) {
            const menuItemRef = doc(db, "menuItems", orderItem.menuItemId);
            // Use atomic increment to deduct stock safely
            transaction.update(menuItemRef, { 
              stock: increment(-orderItem.quantity)
            });
          }
        }
        
        // Update order status
        transaction.update(orderRef, { 
          status: newStatus,
          updatedAt: new Date()
        });
      });
      
      // Send notification to customer with their user ID
      if (localOrder) {
        console.log('Order data for notification:', { orderId, customerName: localOrder.customerName, userId: localOrder.userId });
        const notificationService = NotificationService.getInstance();
        await notificationService.sendOrderNotification(
          orderId, 
          newStatus, 
          localOrder.customerName,
          localOrder.userId // Pass the user ID so they get notified
        );
      }
      
      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      // Find the order to get customer info
      const order = orders.find(o => o.id === orderId);
      
      await updateDocument("orders", orderId, { 
        status: "cancelled",
        updatedAt: new Date()
      });
      
      // Send notification to customer with their user ID
      if (order) {
        console.log('Order data for cancellation notification:', { orderId, customerName: order.customerName, userId: order.userId });
        const notificationService = NotificationService.getInstance();
        await notificationService.sendOrderNotification(
          orderId, 
          "cancelled", 
          order.customerName,
          order.userId // Pass the user ID so they get notified
        );
      }
      
      toast({
        title: "Order Cancelled",
        description: "Order has been cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  // Handle opening order from notification
  useEffect(() => {
    const openOrderId = localStorage.getItem('openOrderId');
    if (openOrderId && stallId && ordersInitialized) {
      // Find the order
      const order = orders.find(o => o.id === openOrderId);
      if (order) {
        // Switch to orders tab
        setActiveTab('orders');
        // Open the order details
        viewOrderDetails(order);
        // Show toast to inform user
        toast({
          title: "Opening order from notification",
          description: `Order ${order.qrCode} is now displayed`,
        });
        // Clear the localStorage
        localStorage.removeItem('openOrderId');
      } else {
        // Orders have been initialized but the specific order was not found
        // (might be deleted or belong to different stall)
        localStorage.removeItem('openOrderId');
        toast({
          title: "Order not found",
          description: "The order from the notification could not be found",
          variant: "destructive",
        });
      }
    }
  }, [orders, stallId, ordersInitialized]);

  const handleQRScan = (orderId: string) => {
    // Find the order from the scanned ID
    const order = orders.find(o => o.id === orderId || o.qrCode === orderId);
    
    if (order) {
      if (order.status === 'ready') {
        // Mark as completed if it's ready for pickup
        updateOrderStatus(order.id, 'completed');
        toast({
          title: "Order Completed",
          description: `Order #${order.qrCode} has been marked as completed`,
        });
      } else {
        // Show order details
        viewOrderDetails(order);
        toast({
          title: "Order Found",
          description: `Found order #${order.qrCode} - Status: ${order.status}`,
        });
      }
    } else {
      toast({
        title: "Order Not Found",
        description: "No order found with this QR code. Please check the code and try again.",
        variant: "destructive",
      });
    }
    setShowQRScanner(false);
  };

  const addCustomization = () => {
    setItemForm(prev => ({
      ...prev,
      customizations: [...prev.customizations, { name: "", price: 0 }]
    }));
  };

  const updateCustomization = (index: number, field: "name" | "price", value: string | number) => {
    setItemForm(prev => ({
      ...prev,
      customizations: prev.customizations.map((custom, i) => 
        i === index ? { ...custom, [field]: value } : custom
      )
    }));
  };

  const removeCustomization = (index: number) => {
    setItemForm(prev => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index)
    }));
  };

  const editMenuItem = (item: any) => {
    setEditingItem(item);
    setItemForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price?.toString() || "",
      category: item.category || "Main Course",
      isAvailable: item.isAvailable ?? true,
      isPopular: item.isPopular ?? false,
      image: item.image || "",
      stock: item.stock ?? 0,
      customizations: item.customizations && item.customizations.length > 0 
        ? item.customizations 
        : [{ name: "", price: 0 }]
    });
    setIsMenuDialogOpen(true);
  };

  // Smart filtering functions
  const getUniqueCategories = () => {
    const categories = menuItems.map(item => item.category).filter(Boolean);
    return Array.from(new Set(categories));
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = menuFilter === "all" || item.category === menuFilter;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredOrders = orders
    .filter(order => {
      const matchesStatus = orderFilter === "all" || order.status === orderFilter;
      const matchesSearch = !orderSearchQuery || 
        order.qrCode?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        order.items?.some((item: any) => 
          item.name?.toLowerCase().includes(orderSearchQuery.toLowerCase())
        );
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by createdAt in ascending order (first ordered appears first)
      const dateA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
      const dateB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
      return dateA.getTime() - dateB.getTime();
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);
  
  // Overview orders (limited and recent)
  const overviewOrders = orders
    .sort((a, b) => {
      const dateA = new Date(a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt);
      const dateB = new Date(b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt);
      return dateA.getTime() - dateB.getTime();
    })
    .slice(0, overviewOrdersPerPage);

  // Revenue calculations - only count completed orders
  const completedOrders = orders.filter(order => order.status === 'completed');
  const todayCompletedOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyCompletedOrders = completedOrders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  // Calculate stats
  const todayOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  
  // Revenue from completed orders only
  const todayRevenue = todayCompletedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const monthlyRevenue = monthlyCompletedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

  // Popular items analysis
  const itemPopularity = completedOrders.reduce((acc, order) => {
    order.items?.forEach((item: any) => {
      const itemName = item.name;
      if (!acc[itemName]) {
        acc[itemName] = { count: 0, revenue: 0 };
      }
      acc[itemName].count += item.quantity;
      acc[itemName].revenue += (item.price * item.quantity);
    });
    return acc;
  }, {} as Record<string, {count: number, revenue: number}>);

  const popularItems = Object.entries(itemPopularity)
    .sort(([,a], [,b]) => (b as any).count - (a as any).count)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-br from-[#6d031e] via-[#8b0426] to-[#6d031e] text-white shadow-lg relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {stallInfo?.image ? (
                  <div className="p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <img 
                      src={stallInfo.image} 
                      alt={stallInfo.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <Store className="w-6 h-6 sm:w-7 sm:h-7 text-red-100" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-red-100 bg-clip-text text-transparent">
                      {stallInfo?.name || 'Stall Dashboard'}
                    </h1>
                    <p className="text-red-100/90 text-sm font-medium">
                      Welcome back, {state.user?.fullName}
                    </p>
                    {stallInfo && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="px-2 py-1 bg-white/10 rounded-full">
                          <span className="text-xs text-red-200">{stallInfo.category || 'Food Stall'}</span>
                        </div>
                        <div className="w-1 h-1 bg-red-300 rounded-full"></div>
                        <span className="text-xs text-red-200">Active</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => setShowQRScanner(true)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 hover:text-white border border-white/20 hover:border-white/40"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      QR Scanner
                    </Button>
                    <NotificationBell />
                  </div>
                </div>
              </div>
            </div>
            {/* Desktop Logout Button */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                onClick={async () => {
                  await logOut();
                  setLocation("/login");
                }}
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white border border-white/20 hover:border-white/40"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Navigation Tabs */}
        <div className="mb-6">
          {/* Mobile Horizontal Scroll Navigation */}
          <div className="md:hidden">
            <div 
              ref={scrollContainerRef}
              className={`flex space-x-2 bg-gray-100 rounded-lg p-1 overflow-x-auto scrollbar-hide select-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
            >
              {[
                { id: "menu", label: "Menu", icon: Package },
                { id: "orders", label: "Orders", icon: Clock },
                { id: "settings", label: "Settings", icon: Settings },
                { id: "cancellations", label: "Cancellations", icon: X },
                { id: "reviews", label: "Reviews", icon: MessageSquare },
                { id: "statistics", label: "Statistics", icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    // Prevent click during drag
                    if (isDragging) {
                      e.preventDefault();
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center justify-center gap-1 py-2 px-3 rounded-md text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? "bg-[#6d031e] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === "settings" ? "Settings" : 
                     tab.id === "cancellations" ? "Cancel" :
                     tab.id === "statistics" ? "Stats" :
                     tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Desktop Grid Navigation */}
          <div className="hidden md:flex space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { id: "menu", label: "Menu", icon: Package },
              { id: "orders", label: "Orders", icon: Clock },
              { id: "settings", label: "Stall Settings", icon: Settings },
              { id: "cancellations", label: "Cancellations", icon: X },
              { id: "reviews", label: "Reviews", icon: MessageSquare },
              { id: "statistics", label: "Statistics", icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-[#6d031e] text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Tab with Pagination */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#6d031e]">Order Management</h2>
                <p className="text-sm text-gray-600">Showing {paginatedOrders.length} of {filteredOrders.length} orders</p>
              </div>
            </div>

            {/* Enhanced Order Filtering & Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="order-search">Search Orders</Label>
                    <Input
                      id="order-search"
                      placeholder="Search by order ID, customer name, or item..."
                      value={orderSearchQuery}
                      onChange={(e) => {
                        setOrderSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:w-48">
                    <Label htmlFor="order-status">Filter by Status</Label>
                    <Select value={orderFilter} onValueChange={(value) => {
                      setOrderFilter(value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Orders" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders ({orders.length})</SelectItem>
                        <SelectItem value="pending">Pending ({orders.filter(o => o.status === 'pending').length})</SelectItem>
                        <SelectItem value="preparing">Preparing ({orders.filter(o => o.status === 'preparing').length})</SelectItem>
                        <SelectItem value="ready">Ready ({orders.filter(o => o.status === 'ready').length})</SelectItem>
                        <SelectItem value="completed">Completed ({orders.filter(o => o.status === 'completed').length})</SelectItem>
                        <SelectItem value="cancelled">Cancelled ({orders.filter(o => o.status === 'cancelled').length})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOrderFilter("pending");
                        setCurrentPage(1);
                      }}
                      className="text-yellow-700 border-yellow-300 hover:bg-yellow-50"
                    >
                      Pending ({orders.filter(o => o.status === 'pending').length})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOrderFilter("preparing");
                        setCurrentPage(1);
                      }}
                      className="text-blue-700 border-blue-300 hover:bg-blue-50"
                    >
                      Preparing ({orders.filter(o => o.status === 'preparing').length})
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Performance: {orders.length < 50 ? 'Optimal' : orders.length < 200 ? 'Good' : 'High Volume'}</span>
                    {(orderFilter !== "all" || orderSearchQuery) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setOrderFilter("all");
                          setOrderSearchQuery("");
                          setCurrentPage(1);
                        }}
                        className="text-[#6d031e] hover:bg-red-50"
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Paginated Orders List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#6d031e] flex items-center justify-between">
                  <span>Orders List</span>
                  <div className="text-sm font-normal text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paginatedOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-white">
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">Order {order.qrCode}</h3>
                          <p className="text-sm text-gray-600">
                            {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleString() : 'Just now'}
                          </p>
                          {order.customerName && (
                            <p className="text-sm text-[#6d031e] font-medium">Customer: {order.customerName}</p>
                          )}
                          {order.paymentMethod && (
                            <div className="mt-1">
                              <span className="text-sm text-gray-600">Payment: {order.paymentMethod}</span>
                              {order.paymentMethod === 'cash' && order.cashAmount && (
                                <span className="text-sm text-green-600 ml-2">
                                  Cash: ₱{order.cashAmount} | Change: ₱{(order.cashAmount - order.totalAmount).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge
                          className={
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                            order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {order.status?.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Order Items Summary */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Items ({order.items?.length || 0}):</h4>
                        <div className="text-sm text-gray-600">
                          {order.items?.slice(0, 2).map((item: any, index: number) => (
                            <span key={index}>
                              {item.name} x{item.quantity}
                              {index < Math.min(1, order.items.length - 1) && ', '}
                            </span>
                          ))}
                          {order.items?.length > 2 && (
                            <span className="text-gray-500"> +{order.items.length - 2} more items</span>
                          )}
                        </div>
                      </div>

                      {/* Voucher Information */}
                      {order.voucherId && (
                        <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Voucher Applied</span>
                          </div>
                          <div className="mt-1 text-xs text-green-600">
                            <p>Code: {order.voucherCode || 'N/A'}</p>
                            <p>Discount: ₱{order.voucherDiscount?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                      )}

                      {/* Order Total */}
                      <div className="border-t pt-3 flex justify-between items-center">
                        <div>
                          {order.voucherId && (
                            <div className="text-xs text-gray-500 mb-1">
                              Subtotal: ₱{((order.totalAmount || 0) + (order.voucherDiscount || 0)).toFixed(2)}
                              <br />
                              Voucher: -₱{order.voucherDiscount?.toFixed(2) || '0.00'}
                            </div>
                          )}
                          <span className="font-semibold text-gray-900">Total: ₱{order.totalAmount?.toFixed(2)}</span>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => cancelOrder(order.id)}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {order.status === 'preparing' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Mark Ready
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => cancelOrder(order.id)}
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="bg-gray-600 hover:bg-gray-700 text-white"
                            >
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewOrderDetails(order)}
                            className="border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No orders found for the selected filter</p>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (pageNum > totalPages) return null;
                        return (
                          <Button
                            key={pageNum}
                            size="sm"
                            variant={currentPage === pageNum ? "default" : "outline"}
                            onClick={() => setCurrentPage(pageNum)}
                            className={currentPage === pageNum ? "bg-[#6d031e] text-white" : ""}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-2 text-gray-500">...</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage(totalPages)}
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Menu Tab */}
        {activeTab === "menu" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-[#6d031e]">Menu Management</h2>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingItem(null);
                  setIsMenuDialogOpen(true);
                }}
                className="bg-[#6d031e] text-white hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {/* Smart Filtering for Menu */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="menu-search">Search Items</Label>
                    <Input
                      id="menu-search"
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:w-48">
                    <Label htmlFor="menu-category">Category</Label>
                    <Select value={menuFilter} onValueChange={setMenuFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {Array.from(new Set(menuItems.map(item => item.category).filter(Boolean))).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span>Showing {filteredMenuItems.length} of {menuItems.length} items</span>
                  {(searchQuery || menuFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setMenuFilter("all");
                      }}
                      className="text-[#6d031e] hover:bg-red-50"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredMenuItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#6d031e]">{item.name}</h3>
                          {item.isPopular && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        </div>
                        <p className="text-sm text-gray-600">{item.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-lg font-bold text-gray-900">₱{item.price?.toFixed(2)}</p>
                          <Badge 
                            variant="outline" 
                            className={`${
                              (item.stock ?? 0) === 0 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : (item.stock ?? 0) < 10 
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                  : 'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            Stock: {item.stock ?? 0}
                          </Badge>
                        </div>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.customizations.map((custom: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {custom.name} {custom.price > 0 ? `+₱${custom.price}` : ''}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => toggleItemAvailability(item.id, item.isAvailable)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editMenuItem(item)}
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMenuItem(item.id)}
                          className="text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold text-[#6d031e]">Order Management</h2>
            
            {/* Smart Filtering for Orders */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="sm:w-48">
                    <Label htmlFor="order-filter">Filter by Status</Label>
                    <Select value={orderFilter} onValueChange={setOrderFilter}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="All Orders" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="ready">Ready for Pickup</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span>Showing {filteredOrders.length} of {orders.length} orders</span>
                  <span>Pending: {pendingOrders.length}</span>
                  <span>Preparing: {preparingOrders.length}</span>
                  {orderFilter !== "all" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOrderFilter("all")}
                      className="text-[#6d031e] hover:bg-red-50"
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-[#6d031e]">Order {order.qrCode}</p>
                          {order.isMultiStallOrder && (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                              Multi-Stall
                            </Badge>
                          )}
                          {order.groupOrderEmails && order.groupOrderEmails.length > 0 && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                              <Users className="w-3 h-3 mr-1" />
                              Group Order
                            </Badge>
                          )}
                          {order.scheduledTime && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                              <Clock className="w-3 h-3 mr-1" />
                              Scheduled
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-gray-600">
                              <span className="font-medium">Customer:</span> {order.customerName || 'Student'}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Student ID:</span> {order.studentId || 'Not provided'}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Order Date:</span> {new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            {order.scheduledTime && (
                              <p className="text-orange-700 font-medium">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Ready by: {order.scheduledTime}
                              </p>
                            )}
                            {order.groupOrderEmails && order.groupOrderEmails.length > 0 && (
                              <p className="text-purple-700 font-medium">
                                <Users className="w-4 h-4 inline mr-1" />
                                Group: {order.groupOrderEmails.length + 1} members
                              </p>
                            )}
                            <p className="text-lg font-bold text-gray-900 mt-1">₱{order.totalAmount?.toFixed(2)}</p>
                          </div>
                        </div>

                        {order.paymentMethod === 'cash' && order.cashAmount && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700">
                              <span className="font-medium">Cash Payment:</span> ₱{order.cashAmount.toFixed(2)} 
                              <span className="ml-2 font-medium">Change:</span> ₱{(order.cashAmount - order.totalAmount).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderDetails(true);
                          }}
                          className="text-[#6d031e] border-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Cancellations Tab */}
        {activeTab === "cancellations" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <CancellationRequestManagement stallId={stallInfo?.id || ""} />
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#6d031e]">Student Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total Reviews:</span>
                <Badge variant="outline">{reviews.length}</Badge>
              </div>
            </div>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#6d031e] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {review.studentName?.charAt(0) || review.userEmail?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{review.studentName || review.userEmail || 'Student'}</p>
                            <p className="text-xs text-gray-500">{review.studentId ? `ID: ${review.studentId}` : 'UB Student'}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-600 ml-1">({review.rating}/5)</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.createdAt ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700 ml-13">{review.comment}</p>
                      )}
                      {review.orderId && (
                        <p className="text-xs text-gray-500 mt-2 ml-13">
                          Order: {review.orderId}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600">
                    Student reviews will appear here once customers start leaving feedback about your food and service.
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}




        {/* Statistics Tab */}
        {activeTab === "statistics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-bold text-[#6d031e]">Statistics & Analytics</h2>
            
            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                      <p className="text-2xl font-bold text-green-600">₱{todayRevenue.toFixed(2)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">From {todayCompletedOrders.length} completed orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-[#6d031e]">₱{monthlyRevenue.toFixed(2)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-[#6d031e]" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">From {monthlyCompletedOrders.length} completed orders</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{completedOrders.length} completed successfully</p>
                </CardContent>
              </Card>
            </div>

            {/* Popular Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#6d031e] flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Popular Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {popularItems.length > 0 ? (
                  <div className="space-y-4">
                    {popularItems.map(([itemName, stats], index) => (
                      <div key={itemName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#6d031e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{itemName}</p>
                            <p className="text-sm text-gray-600">{(stats as any).count} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#6d031e]">₱{(stats as any).revenue.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No sales data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[#6d031e]">Order Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pending</span>
                      <Badge className="bg-yellow-100 text-yellow-800">{pendingOrders.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Preparing</span>
                      <Badge className="bg-blue-100 text-blue-800">{preparingOrders.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ready</span>
                      <Badge className="bg-green-100 text-green-800">{orders.filter(o => o.status === 'ready').length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed</span>
                      <Badge className="bg-gray-100 text-gray-800">{completedOrders.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cancelled</span>
                      <Badge className="bg-red-100 text-red-800">{orders.filter(o => o.status === 'cancelled').length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[#6d031e]">Menu Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Menu Items</span>
                      <span className="font-semibold">{menuItems.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Items</span>
                      <span className="font-semibold text-green-600">{menuItems.filter(item => item.isAvailable).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Popular Items</span>
                      <span className="font-semibold text-yellow-600">{menuItems.filter(item => item.isPopular).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Categories</span>
                      <span className="font-semibold">{Array.from(new Set(menuItems.map(item => item.category))).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Revenue Trend (Placeholder for future chart) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#6d031e]">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Revenue Analytics</h3>
                  <p className="text-gray-600 mb-4">
                    This month you've earned <span className="font-bold text-[#6d031e]">₱{monthlyRevenue.toFixed(2)}</span> from {monthlyCompletedOrders.length} completed orders.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Avg. Order Value</p>
                      <p className="font-bold text-lg">₱{monthlyCompletedOrders.length > 0 ? (monthlyRevenue / monthlyCompletedOrders.length).toFixed(2) : '0.00'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Orders Today</p>
                      <p className="font-bold text-lg">{todayOrders.length}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Completion Rate</p>
                      <p className="font-bold text-lg">{orders.length > 0 ? ((completedOrders.length / orders.length) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-gray-600">Best Seller</p>
                      <p className="font-bold text-lg">{popularItems.length > 0 ? popularItems[0][0].slice(0, 12) + '...' : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Stall Settings Tab */}
        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#6d031e]">Stall Settings</h2>
              <div className="flex gap-2">
                {isEditingStall ? (
                  <>
                    <Button
                      onClick={handleSaveStall}
                      className="bg-[#6d031e] text-white hover:bg-red-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditingStall(false);
                        // Reset form to original stall data
                        if (stallInfo) {
                          setStallForm({
                            name: stallInfo.name || "",
                            description: stallInfo.description || "",
                            categories: stallInfo.categories || (stallInfo.category ? [stallInfo.category] : []),
                            image: stallInfo.image || "",
                            isActive: stallInfo.isActive !== undefined ? stallInfo.isActive : true,
                          });
                        }
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setIsEditingStall(true)}
                    variant="outline"
                    className="border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Stall
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#6d031e] flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Stall Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stall Name */}
                <div>
                  <Label htmlFor="stall-name" className="text-sm font-medium">
                    Stall Name
                  </Label>
                  {isEditingStall ? (
                    <Input
                      id="stall-name"
                      value={stallForm.name}
                      onChange={(e) => setStallForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter stall name"
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md">
                      {stallInfo?.name || "No name set"}
                    </p>
                  )}
                </div>

                {/* Stall Description */}
                <div>
                  <Label htmlFor="stall-description" className="text-sm font-medium">
                    Description
                  </Label>
                  {isEditingStall ? (
                    <Textarea
                      id="stall-description"
                      value={stallForm.description}
                      onChange={(e) => setStallForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe your stall and what makes it special"
                      className="mt-1"
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded-md min-h-[60px]">
                      {stallInfo?.description || "No description set"}
                    </p>
                  )}
                </div>

                {/* Stall Categories */}
                <div>
                  <Label className="text-sm font-medium">
                    Food Categories
                  </Label>
                  {isEditingStall ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-gray-600">Select all categories that apply to your stall:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {availableCategories.map((category) => (
                          <div
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              stallForm.categories.includes(category)
                                ? 'bg-[#6d031e] text-white border-[#6d031e]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#6d031e] hover:bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{category}</span>
                              {stallForm.categories.includes(category) && (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {stallForm.categories.length === 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Please select at least one category
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      {stallInfo?.categories && stallInfo.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {stallInfo.categories.map((category: string) => (
                            <Badge
                              key={category}
                              className="bg-[#6d031e] text-white hover:bg-red-700"
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      ) : stallInfo?.category ? (
                        <Badge className="bg-[#6d031e] text-white hover:bg-red-700">
                          {stallInfo.category}
                        </Badge>
                      ) : (
                        <p className="text-sm text-gray-500">No categories set</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Stall Image */}
                <div>
                  <Label htmlFor="stall-image" className="text-sm font-medium">
                    Stall Image URL
                  </Label>
                  {isEditingStall ? (
                    <div className="mt-1 space-y-2">
                      <Input
                        id="stall-image"
                        value={stallForm.image}
                        onChange={(e) => setStallForm(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="https://example.com/stall-image.jpg"
                      />
                      <p className="text-xs text-gray-600">
                        Provide a URL for your stall's image. This will be shown to customers.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      {stallInfo?.image ? (
                        <div className="space-y-2">
                          <img
                            src={stallInfo.image}
                            alt={stallInfo.name}
                            className="w-32 h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <p className="text-xs text-gray-600 break-all">
                            {stallInfo.image}
                          </p>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">No image</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Stall Status */}
                <div>
                  <Label className="text-sm font-medium">Stall Status</Label>
                  {isEditingStall ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="stall-active"
                          checked={stallForm.isActive}
                          onCheckedChange={(checked) => setStallForm(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="stall-active" className="text-sm">
                          {stallForm.isActive ? 'Active - Visible to customers' : 'Inactive - Hidden from customers'}
                        </Label>
                      </div>
                      <p className="text-xs text-gray-600">
                        Toggle this to control whether customers can see and order from your stall
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        stallInfo?.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stallInfo?.isActive ? 'Active' : 'Inactive'}
                      </div>
                      <p className="text-xs text-gray-600">
                        {stallInfo?.isActive 
                          ? 'Your stall is visible to customers'
                          : 'Your stall is hidden from customers'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Menu Item Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#6d031e]">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={itemForm.name}
                onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={itemForm.description}
                onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter item description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (₱)</Label>
                <Input
                  id="price"
                  type="number"
                  value={itemForm.price}
                  onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={itemForm.category}
                  onValueChange={(value) => setItemForm(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Course">Main Course</SelectItem>
                    <SelectItem value="Appetizer">Appetizer</SelectItem>
                    <SelectItem value="Dessert">Dessert</SelectItem>
                    <SelectItem value="Beverage">Beverage</SelectItem>
                    <SelectItem value="Snack">Snack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={itemForm.stock}
                onChange={(e) => setItemForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Set to 0 to mark item as out of stock</p>
            </div>

            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={itemForm.image}
                onChange={(e) => setItemForm(prev => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Customization Options</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCustomization}
                  className="text-red-700 border-red-300 hover:bg-red-100 hover:border-red-400"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              </div>
              
              {itemForm.customizations.map((custom, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder="Option name (e.g. Choice of Rice, Extra Sauce, etc.)"
                    value={custom.name}
                    onChange={(e) => updateCustomization(index, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    value={custom.price}
                    onChange={(e) => updateCustomization(index, "price", parseFloat(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeCustomization(index)}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="available"
                  checked={itemForm.isAvailable}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isAvailable: checked }))}
                />
                <Label htmlFor="available">Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="popular"
                  checked={itemForm.isPopular}
                  onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, isPopular: checked }))}
                />
                <Label htmlFor="popular">Popular</Label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSaveMenuItem}
                className="flex-1 bg-[#6d031e] hover:bg-red-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Item
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsMenuDialogOpen(false)}
                className="border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#6d031e]">
              Order Details - {selectedOrder?.qrCode}
            </DialogTitle>
            <DialogDescription>
              Complete order information and management options
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedOrder.customerName || 'Student'}</p>
                  <p><span className="font-medium">Student ID:</span> {selectedOrder.studentId || 'Not provided'}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail || 'Not provided'}</p>
                  <p><span className="font-medium">Order Date:</span> {new Date(selectedOrder.createdAt?.toDate ? selectedOrder.createdAt.toDate() : selectedOrder.createdAt).toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge className={
                      selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedOrder.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.status === 'ready' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {selectedOrder.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Group Order Information */}
              {selectedOrder.groupOrderEmails && selectedOrder.groupOrderEmails.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Group Order Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-purple-800">
                      This is a group order with {selectedOrder.groupOrderEmails.length + 1} total members:
                    </p>
                    <div className="ml-4 space-y-1">
                      <p className="text-purple-700">• {selectedOrder.customerName || 'Lead Member'} (order creator)</p>
                      {selectedOrder.groupOrderEmails.map((email: string, index: number) => (
                        <p key={index} className="text-purple-700">• {email}</p>
                      ))}
                    </div>
                    <div className="mt-2 p-2 bg-purple-100 rounded">
                      <p className="text-xs text-purple-700">
                        💡 Group orders allow multiple UB students to order together. Please prepare the full order for pickup by the lead member.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduled Pickup Information */}
              {selectedOrder.scheduledTime && (
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-orange-600" />
                    Scheduled Pickup Time
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-orange-800">
                      Order must be ready by: {selectedOrder.scheduledTime}
                    </p>
                    <div className="mt-2 p-2 bg-orange-100 rounded">
                      <p className="text-xs text-orange-700">
                        ⏰ This is a scheduled order (Order Later feature). Please ensure it's ready by the specified time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Stall Order Information */}
              {selectedOrder.isMultiStallOrder && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-2 text-blue-600" />
                    Multi-Stall Order
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-blue-800">
                      This order is part of a multi-stall order (ID: {selectedOrder.mainOrderId})
                    </p>
                    <div className="mt-2 p-2 bg-blue-100 rounded">
                      <p className="text-xs text-blue-700">
                        🏪 The customer ordered from multiple stalls. Coordinate timing with other stalls for pickup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Voucher Information */}
              {selectedOrder.voucherId && (
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Ticket className="w-4 h-4 mr-2 text-green-600" />
                    Voucher Applied
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Voucher Code:</span> <span className="text-green-700 font-mono">{selectedOrder.voucherCode || 'N/A'}</span></p>
                    <p><span className="font-medium">Discount Amount:</span> <span className="text-green-700 font-semibold">₱{selectedOrder.voucherDiscount?.toFixed(2) || '0.00'}</span></p>
                    <div className="mt-2 p-2 bg-green-100 rounded">
                      <p className="text-xs text-green-700">
                        💰 Customer used a voucher for this order. The discount has been applied to the total amount.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Order Preferences */}
              {(selectedOrder.noCutlery) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Order Preferences</h3>
                  <div className="space-y-1 text-sm">
                    {selectedOrder.noCutlery && (
                      <p className="text-green-700">🌱 No cutlery needed (eco-friendly option)</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Ordered Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          <p className="text-sm text-gray-600">Unit Price: ₱{item.price?.toFixed(2)}</p>
                          {item.customizations && item.customizations.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Add-ons:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.customizations.map((custom: any, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {custom.name} {custom.price > 0 ? `+₱${custom.price}` : ''}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₱{((item.price + (item.customizations?.reduce((sum: number, c: any) => sum + c.price, 0) || 0)) * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Method:</span> {selectedOrder.paymentMethod || 'Not specified'}</p>
                  {selectedOrder.paymentMethod === 'cash' && selectedOrder.cashAmount && (
                    <>
                      <p><span className="font-medium">Cash Amount:</span> ₱{selectedOrder.cashAmount.toFixed(2)}</p>
                      <p><span className="font-medium">Change Required:</span> ₱{(selectedOrder.cashAmount - selectedOrder.totalAmount).toFixed(2)}</p>
                    </>
                  )}
                  
                  {/* Voucher breakdown in payment section */}
                  {selectedOrder.voucherId && (
                    <div className="pt-2 border-t border-gray-200">
                      <p><span className="font-medium">Subtotal:</span> ₱{((selectedOrder.totalAmount || 0) + (selectedOrder.voucherDiscount || 0)).toFixed(2)}</p>
                      <p><span className="font-medium text-green-600">Voucher Discount:</span> <span className="text-green-600">-₱{selectedOrder.voucherDiscount?.toFixed(2) || '0.00'}</span></p>
                    </div>
                  )}
                  
                  <p className="pt-1 border-t border-gray-300"><span className="font-medium">Final Amount:</span> <span className="font-bold text-[#6d031e]">₱{selectedOrder.totalAmount?.toFixed(2)}</span></p>
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Special Instructions</h3>
                  <p className="text-sm text-gray-700">{selectedOrder.specialInstructions}</p>
                </div>
              )}

              {/* Order Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedOrder.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing');
                        setShowOrderDetails(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Accept Order
                    </Button>
                    <Button
                      onClick={() => {
                        cancelOrder(selectedOrder.id);
                        setShowOrderDetails(false);
                      }}
                      variant="destructive"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'preparing' && (
                  <>
                    <Button
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'ready');
                        setShowOrderDetails(false);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Mark Ready
                    </Button>
                    <Button
                      onClick={() => {
                        cancelOrder(selectedOrder.id);
                        setShowOrderDetails(false);
                      }}
                      variant="destructive"
                    >
                      Cancel Order
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'ready' && (
                  <Button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, 'completed');
                      setShowOrderDetails(false);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Complete Order
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                  className="border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* QR Scanner Component */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
      
      {/* Mobile Navigation */}
      <BottomNav />
      
      {/* Bottom spacing for mobile navigation */}
      <div className="h-20 md:h-0"></div>
    </div>
  );
}