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
  Ticket,
  User,
  Banknote,
  Coins,
  Check,
  GripVertical,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { collection, getDocs, doc } from "firebase/firestore";
import { usePageTitle } from "@/hooks/use-page-title";
import { useLocation } from "wouter";
import NotificationBell from "@/components/notifications/notification-bell";
import CancellationRequestManagement from "@/components/orders/cancellation-request-management";
import NotificationService from "@/lib/notification-service";
import BottomNav from "@/components/layout/bottom-nav";
import QRScanner from "@/components/qr-scanner";
import { ImageUpload } from "@/components/image-upload";


export default function StallDashboard() {
  usePageTitle("Stall Dashboard");
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [enrichedReviews, setEnrichedReviews] = useState<any[]>([]);
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
    image: "",
    isActive: true,
  });
  const [isEditingStall, setIsEditingStall] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
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
  
  // HTML5 Drag and drop state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  
  // Touch drag state
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchCurrentY, setTouchCurrentY] = useState<number>(0);
  const [isTouchDragging, setIsTouchDragging] = useState(false);

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

  // Enrich reviews with user data (profile pictures)
  useEffect(() => {
    const enrichReviewsWithUserData = async () => {
      if (reviews.length === 0) {
        setEnrichedReviews([]);
        return;
      }

      try {
        const enriched = await Promise.all(
          reviews.map(async (review) => {
            try {
              // Fetch user data to get profile picture and ensure we have student info
              const userDoc = await getDocument("users", review.userId);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                return {
                  ...review,
                  studentName: userData.displayName || review.studentName || 'Student',
                  studentId: userData.studentId || review.studentId || 'N/A',
                  profilePicture: userData.photoURL || null
                };
              }
              return review;
            } catch (error) {
              console.error("Error fetching user data for review:", error);
              return review;
            }
          })
        );
        setEnrichedReviews(enriched);
      } catch (error) {
        console.error("Error enriching reviews:", error);
        setEnrichedReviews(reviews);
      }
    };

    enrichReviewsWithUserData();
  }, [reviews]);

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
        createdAt: new Date(),
        displayOrder: editingItem?.displayOrder ?? menuItems.length
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

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItemId(itemId);
  };

  const handleDrop = async (e: React.DragEvent, dropItemId: string) => {
    e.preventDefault();
    setDragOverItemId(null);

    if (!draggedItemId || draggedItemId === dropItemId) {
      setDraggedItemId(null);
      return;
    }

    const sortedItems = [...filteredMenuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const draggedIndex = sortedItems.findIndex(item => item.id === draggedItemId);
    const dropIndex = sortedItems.findIndex(item => item.id === dropItemId);

    if (draggedIndex === -1 || dropIndex === -1) {
      setDraggedItemId(null);
      return;
    }

    const [movedItem] = sortedItems.splice(draggedIndex, 1);
    sortedItems.splice(dropIndex, 0, movedItem);

    const updatedItems = sortedItems.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setMenuItems(prevItems => {
      const itemsMap = new Map(prevItems.map(item => [item.id, item]));
      updatedItems.forEach(updated => {
        if (itemsMap.has(updated.id)) {
          itemsMap.set(updated.id, updated);
        }
      });
      return Array.from(itemsMap.values());
    });

    setDraggedItemId(null);

    try {
      await Promise.all(
        updatedItems.map(item =>
          updateDocument("menuItems", item.id, { displayOrder: item.displayOrder })
        )
      );
      toast({
        title: "Success",
        description: "Menu order updated successfully",
      });
    } catch (error) {
      console.error("Error updating menu order:", error);
      toast({
        title: "Error",
        description: "Failed to update menu order",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverItemId(null);
  };

  // Touch event handlers for mobile drag and drop
  const handleTouchStart = (e: React.TouchEvent, itemId: string) => {
    setDraggedItemId(itemId);
    setIsTouchDragging(true);
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDragging || !draggedItemId) return;
    
    setTouchCurrentY(e.touches[0].clientY);
    
    // Find the element at the current touch position
    const touch = e.touches[0];
    const elementAtPoint = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementAtPoint) {
      // Find the closest card element
      const cardElement = elementAtPoint.closest('[data-menu-item-id]');
      if (cardElement) {
        const hoveredItemId = cardElement.getAttribute('data-menu-item-id');
        if (hoveredItemId && hoveredItemId !== draggedItemId) {
          setDragOverItemId(hoveredItemId);
        }
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    if (!isTouchDragging || !draggedItemId) return;
    
    e.preventDefault();
    
    const dropItemId = dragOverItemId;
    setIsTouchDragging(false);
    setDragOverItemId(null);
    
    if (!dropItemId || draggedItemId === dropItemId) {
      setDraggedItemId(null);
      return;
    }

    const sortedItems = [...filteredMenuItems].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const draggedIndex = sortedItems.findIndex(item => item.id === draggedItemId);
    const dropIndex = sortedItems.findIndex(item => item.id === dropItemId);

    if (draggedIndex === -1 || dropIndex === -1) {
      setDraggedItemId(null);
      return;
    }

    const [movedItem] = sortedItems.splice(draggedIndex, 1);
    sortedItems.splice(dropIndex, 0, movedItem);

    const updatedItems = sortedItems.map((item, index) => ({
      ...item,
      displayOrder: index
    }));

    setMenuItems(prevItems => {
      const itemsMap = new Map(prevItems.map(item => [item.id, item]));
      updatedItems.forEach(updated => {
        if (itemsMap.has(updated.id)) {
          itemsMap.set(updated.id, updated);
        }
      });
      return Array.from(itemsMap.values());
    });

    setDraggedItemId(null);

    try {
      await Promise.all(
        updatedItems.map(item =>
          updateDocument("menuItems", item.id, { displayOrder: item.displayOrder })
        )
      );
      toast({
        title: "Success",
        description: "Menu order updated successfully",
      });
    } catch (error) {
      console.error("Error updating menu order:", error);
      toast({
        title: "Error",
        description: "Failed to update menu order",
        variant: "destructive",
      });
    }
  };

  // Stall editing functions
  const handleSaveStall = async () => {
    if (!stallForm.name) {
      toast({
        title: "Error",
        description: "Please fill in stall name",
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

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!auth.currentUser || !auth.currentUser.email) {
      toast({
        title: "Error",
        description: "No user is currently logged in",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        passwordForm.currentPassword
      );

      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordForm.newPassword);

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error changing password:", error);
      
      let errorMessage = "Failed to change password";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in before changing your password";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
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
      // Priority order for food pre-ordering: pending > preparing > ready > completed/cancelled
      const statusPriority: Record<string, number> = {
        'pending': 1,
        'preparing': 2,
        'ready': 3,
        'completed': 4,
        'cancelled': 5
      };
      
      const priorityA = statusPriority[a.status] || 999;
      const priorityB = statusPriority[b.status] || 999;
      
      // If different status priorities, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort by earliest order (oldest first)
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
                <h2 className="text-2xl font-bold text-[#6d031e]">Orders</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredOrders.length > 0 ? `Showing ${paginatedOrders.length} of ${filteredOrders.length} orders` : 'No orders yet'}
                </p>
              </div>
            </div>

            {/* Simplified Order Filtering */}
            <Card className="mb-6 bg-gradient-to-r from-[#6d031e]/5 to-pink-50">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {/* Quick Status Filter Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={orderFilter === "all" ? "default" : "outline"}
                      onClick={() => {
                        setOrderFilter("all");
                        setCurrentPage(1);
                      }}
                      className={orderFilter === "all" ? "bg-[#6d031e] hover:bg-red-800" : ""}
                    >
                      All ({orders.length})
                    </Button>
                    <Button
                      size="sm"
                      variant={orderFilter === "pending" ? "default" : "outline"}
                      onClick={() => {
                        setOrderFilter("pending");
                        setCurrentPage(1);
                      }}
                      className={orderFilter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : "text-yellow-700 border-yellow-300 hover:bg-yellow-50 hover:text-yellow-800"}
                    >
                      New Orders ({orders.filter(o => o.status === 'pending').length})
                    </Button>
                    <Button
                      size="sm"
                      variant={orderFilter === "preparing" ? "default" : "outline"}
                      onClick={() => {
                        setOrderFilter("preparing");
                        setCurrentPage(1);
                      }}
                      className={orderFilter === "preparing" ? "bg-blue-600 hover:bg-blue-700" : "text-blue-700 border-blue-300 hover:bg-blue-50 hover:text-blue-800"}
                    >
                      Cooking ({orders.filter(o => o.status === 'preparing').length})
                    </Button>
                    <Button
                      size="sm"
                      variant={orderFilter === "ready" ? "default" : "outline"}
                      onClick={() => {
                        setOrderFilter("ready");
                        setCurrentPage(1);
                      }}
                      className={orderFilter === "ready" ? "bg-green-600 hover:bg-green-700" : "text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800"}
                    >
                      Ready ({orders.filter(o => o.status === 'ready').length})
                    </Button>
                    <Button
                      size="sm"
                      variant={orderFilter === "completed" ? "default" : "outline"}
                      onClick={() => {
                        setOrderFilter("completed");
                        setCurrentPage(1);
                      }}
                      className={orderFilter === "completed" ? "bg-gray-600 hover:bg-gray-700" : "text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-800"}
                    >
                      Completed ({orders.filter(o => o.status === 'completed').length})
                    </Button>
                  </div>
                  
                  {/* Search Box */}
                  <Input
                    placeholder="Search by order number, customer name, or item..."
                    value={orderSearchQuery}
                    onChange={(e) => {
                      setOrderSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders found</h3>
                  <p className="text-gray-500">
                    {orderSearchQuery || orderFilter !== "all" 
                      ? "Try adjusting your filters or search terms" 
                      : "Orders will appear here when customers place them"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedOrders.map((order) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow border-l-4" style={{
                      borderLeftColor: 
                        order.status === 'pending' ? '#eab308' :
                        order.status === 'preparing' ? '#3b82f6' :
                        order.status === 'ready' ? '#22c55e' :
                        order.status === 'completed' ? '#6b7280' : '#ef4444'
                    }}>
                      <CardContent className="p-5">
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">#{order.qrCode}</h3>
                              <Badge
                                className={
                                  order.status === 'pending' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                                  order.status === 'preparing' ? 'bg-blue-500 text-white hover:bg-blue-600' :
                                  order.status === 'ready' ? 'bg-green-500 text-white hover:bg-green-600' :
                                  order.status === 'completed' ? 'bg-gray-500 text-white hover:bg-gray-600' :
                                  'bg-red-500 text-white hover:bg-red-600'
                                }
                              >
                                {order.status?.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-600 flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{order.customerName || 'Student'}</span>
                                </p>
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {order.createdAt?.toDate ? new Date(order.createdAt.toDate()).toLocaleString() : 'Just now'}
                                </p>
                              </div>
                              {order.paymentMethod === 'cash' && order.cashAmount && (
                                <div className="bg-green-50 border border-green-200 rounded px-2 py-1">
                                  <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                                    <Banknote className="w-3 h-3" />
                                    Cash: ₱{order.cashAmount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-green-600 flex items-center gap-1">
                                    <Coins className="w-3 h-3" />
                                    Change: ₱{(order.cashAmount - order.totalAmount).toFixed(2)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2 flex items-center gap-1">
                            <Package className="w-4 h-4" />
                            Items ({order.items?.length || 0})
                          </h4>
                          <div className="space-y-1">
                            {order.items?.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.name} <span className="text-gray-500">×{item.quantity}</span></span>
                                <span className="font-medium text-gray-900">₱{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          {order.voucherId && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between text-xs text-green-700">
                                <span className="flex items-center gap-1">
                                  <Ticket className="w-3 h-3" />
                                  Voucher ({order.voucherCode})
                                </span>
                                <span>-₱{order.voucherDiscount?.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Total and Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t">
                          <div className="text-xl font-bold text-[#6d031e]">
                            Total: ₱{order.totalAmount?.toFixed(2)}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept Order
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => cancelOrder(order.id)}
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-400"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Mark as Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Mark Completed
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewOrderDetails(order)}
                              className="border-[#6d031e] text-[#6d031e] hover:bg-[#6d031e] hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-[#6d031e] hover:text-[#6d031e]"
                      >
                        ← Previous
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
                            className={currentPage === pageNum ? "bg-[#6d031e] hover:bg-red-800 text-white" : "text-[#6d031e] hover:text-[#6d031e]"}
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
                            className="text-[#6d031e] hover:text-[#6d031e]"
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
                        className="text-[#6d031e] hover:text-[#6d031e]"
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
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
              {filteredMenuItems.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)).map((item) => (
                <Card
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => handleDragOver(e, item.id)}
                  onDrop={(e) => handleDrop(e, item.id)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, item.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`${
                    draggedItemId === item.id ? "opacity-50" : ""
                  } ${
                    dragOverItemId === item.id ? "border-2 border-[#6d031e]" : ""
                  } transition-all touch-none`}
                  data-testid={`menu-card-${item.id}`}
                  data-menu-item-id={item.id}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4">
                      <div
                        className="hidden md:block cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                        data-testid={`drag-handle-${item.id}`}
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className="flex items-start gap-3 flex-1 w-full">
                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[#6d031e]">{item.name}</h3>
                            {item.isPopular && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end md:justify-start">
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={() => toggleItemAvailability(item.id, item.isAvailable)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editMenuItem(item)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setItemToDelete(item.id)}
                          className="text-red-700 border-red-300"
                          data-testid={`button-delete-${item.id}`}
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
                <Badge variant="outline">{enrichedReviews.length}</Badge>
              </div>
            </div>

            {enrichedReviews.length > 0 ? (
              <div className="space-y-4">
                {enrichedReviews.map((review) => (
                  <Card key={review.id} data-testid={`review-card-${review.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {review.profilePicture ? (
                            <img 
                              src={review.profilePicture} 
                              alt={review.studentName || 'Student'}
                              className="w-12 h-12 rounded-full object-cover border-2 border-[#6d031e]"
                              data-testid={`review-profile-${review.id}`}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[#6d031e] rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-lg">
                                {review.studentName?.charAt(0) || review.userEmail?.charAt(0) || 'S'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm" data-testid={`review-name-${review.id}`}>
                              {review.studentName || review.userEmail || 'Student'}
                            </p>
                            <p className="text-xs text-gray-500" data-testid={`review-studentid-${review.id}`}>
                              {review.studentId && review.studentId !== 'N/A' ? `ID: ${review.studentId}` : 'UB Student'}
                            </p>
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
                        <p className="text-sm text-gray-700 ml-15">{review.comment}</p>
                      )}
                      {review.orderId && (
                        <p className="text-xs text-gray-500 mt-2 ml-15">
                          Order ID: {review.orderId}
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
                            image: stallInfo.image || "",
                            isActive: stallInfo.isActive !== undefined ? stallInfo.isActive : true,
                          });
                        }
                      }}
                      variant="outline"
                      className="text-gray-700 hover:text-gray-700"
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

                {/* Stall Image */}
                <div>
                  <Label htmlFor="stall-image" className="text-sm font-medium">
                    Stall Image
                  </Label>
                  {isEditingStall ? (
                    <div className="mt-1">
                      <ImageUpload
                        value={stallForm.image}
                        onChange={(url) => setStallForm(prev => ({ ...prev, image: url }))}
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        Upload an image for your stall. This will be shown to customers.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-2">
                      {stallInfo?.image ? (
                        <img
                          src={stallInfo.image}
                          alt={stallInfo.name}
                          className="w-full max-w-md h-48 object-cover rounded-lg border"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full max-w-md h-48 bg-gray-100 rounded-lg border flex items-center justify-center">
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

            {/* Password Change Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-[#6d031e] flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password" className="text-sm font-medium">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter current password"
                    className="mt-1"
                    data-testid="input-current-password"
                  />
                </div>

                <div>
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (min. 6 characters)"
                    className="mt-1"
                    data-testid="input-new-password"
                  />
                </div>

                <div>
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                    className="mt-1"
                    data-testid="input-confirm-password"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                  className="bg-[#6d031e] text-white hover:bg-red-700"
                  data-testid="button-change-password"
                >
                  {isChangingPassword ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
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
              <Label htmlFor="image">Menu Item Image</Label>
              <ImageUpload
                value={itemForm.image}
                onChange={(url) => setItemForm(prev => ({ ...prev, image: url }))}
              />
              <p className="text-xs text-gray-500 mt-1">Upload an image for this menu item</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Customization Options</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addCustomization}
                  className="text-red-700 border-red-300"
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
                    className="text-red-700 border-red-300"
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
                className="border-red-300 text-red-700"
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
                  <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone || 'Not provided'}</p>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#6d031e]">Delete Menu Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this menu item? This action cannot be undone and will permanently remove the item from your menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (itemToDelete) {
                  deleteMenuItem(itemToDelete);
                  setItemToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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