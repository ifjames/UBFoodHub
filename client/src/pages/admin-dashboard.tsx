import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, getCollection, signUp, createDocument } from "@/lib/firebase";
import { logOut } from "@/lib/firebase";
import { useLocation } from "wouter";
import { Users, Store, Plus, Edit, Trash2, LogOut, Settings, BarChart3 } from "lucide-react";
import PenaltyManagement from "@/components/penalties/penalty-management";
import BroadcastNotification from "@/components/admin/broadcast-notification";
import NotificationBell from "@/components/notifications/notification-bell";

export default function AdminDashboard() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<any[]>([]);
  const [stalls, setStalls] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Filipino', 'Asian', 'Western', 'Snacks', 'Beverages', 'Desserts']);
  const [isLoading, setIsLoading] = useState(false);
  const [userFilter, setUserFilter] = useState('all');
  const [newCategory, setNewCategory] = useState('');

  // New stall form
  const [newStall, setNewStall] = useState({
    name: "",
    description: "",
    category: "",
    ownerId: "",
    image: "",
    isActive: true,
  });

  // New stall owner form
  const [newStallOwner, setNewStallOwner] = useState({
    fullName: "",
    email: "",
    password: "",
    stallName: "",
    stallDescription: "",
    stallCategory: "",
    stallImage: "",
  });

  // Edit stall form
  const [editingStall, setEditingStall] = useState<any>(null);
  const [editStall, setEditStall] = useState({
    name: "",
    description: "",
    category: "",
    ownerId: "",
    image: "",
    isActive: true,
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // User editing state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({
    fullName: "",
    email: "",
    studentId: "",
    role: "",
  });
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

  // Create account form
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [createAccountForm, setCreateAccountForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "student",
    studentId: "",
    phoneNumber: "",
    stallName: "",
    stallDescription: "",
    stallCategory: "",
  });

  useEffect(() => {
    // Subscribe to real-time data
    const unsubscribeUsers = subscribeToCollection("users", setUsers);
    const unsubscribeStalls = subscribeToCollection("stalls", setStalls);
    const unsubscribeOrders = subscribeToCollection("orders", setOrders);

    return () => {
      unsubscribeUsers();
      unsubscribeStalls();
      unsubscribeOrders();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logOut();
      dispatch({ type: "SET_USER", payload: null });
      setLocation("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateStall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await addDocument("stalls", {
        ...newStall,
        rating: 0,
        reviewCount: 0,
        deliveryTime: "15-30 min",
        priceRange: "₱50-200",
        deliveryFee: "₱10",
      });

      toast({
        title: "Stall created successfully",
        description: "The new food stall has been added to the system.",
      });

      setNewStall({
        name: "",
        description: "",
        category: "",
        ownerId: "",
        image: "",
        isActive: true,
      });
    } catch (error: any) {
      toast({
        title: "Error creating stall",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStall = (stall: any) => {
    setEditingStall(stall);
    setEditStall({
      name: stall.name || "",
      description: stall.description || "",
      category: stall.category || "",
      ownerId: stall.ownerId || "",
      image: stall.image || "",
      isActive: stall.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStall) return;
    
    setIsLoading(true);
    try {
      await updateDocument("stalls", editingStall.id, editStall);
      
      toast({
        title: "Stall updated successfully",
        description: "The food stall has been updated.",
      });
      
      setIsEditDialogOpen(false);
      setEditingStall(null);
    } catch (error: any) {
      toast({
        title: "Error updating stall",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStall = async (stallId: string) => {
    try {
      await deleteDocument("stalls", stallId);
      toast({
        title: "Stall deleted successfully",
        description: "The food stall has been removed from the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting stall",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStallStatus = async (stallId: string, currentStatus: boolean) => {
    try {
      await updateDocument("stalls", stallId, { isActive: !currentStatus });
      toast({
        title: "Stall status updated",
        description: `Stall has been ${!currentStatus ? 'activated' : 'deactivated'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating stall",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteDocument("users", userId);
      toast({
        title: "User deleted",
        description: "User account has been removed from the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserForm({
      fullName: user.fullName || "",
      email: user.email || "",
      studentId: user.studentId || "",
      role: user.role || "",
    });
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setIsLoading(true);
    try {
      await updateDocument("users", editingUser.id, editUserForm);
      
      toast({
        title: "User updated successfully",
        description: "The user account has been updated.",
      });

      setEditUserForm({
        fullName: "",
        email: "",
        studentId: "",
        role: "",
      });
      setIsEditUserDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stallOwners = users.filter(user => user.role === 'stall_owner');
  const totalUsers = users.length;
  const totalStalls = stalls.length;
  const totalOrders = orders.length;
  const activeStalls = stalls.filter(stall => stall.isActive).length;

  // Filter users based on selected filter
  const filteredUsers = users.filter(user => {
    if (userFilter === 'all') return true;
    return user.role === userFilter;
  });

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()]);
      setNewCategory('');
      toast({
        title: "Category added",
        description: `"${newCategory.trim()}" has been added to the categories.`,
      });
    }
  };

  // Create stall owner account with stall
  const handleCreateStallOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create Firebase auth account
      const userCredential = await signUp(newStallOwner.email, newStallOwner.password);
      
      // Create user document in Firestore
      await createDocument("users", userCredential.user.uid, {
        uid: userCredential.user.uid,
        fullName: newStallOwner.fullName,
        email: newStallOwner.email,
        role: "stall_owner",
        emailVerified: true, // Admin verified
        phoneNumber: "",
        studentId: "",
        loyaltyPoints: 0,
        photoURL: null,
      });

      // Create stall document
      await addDocument("stalls", {
        name: newStallOwner.stallName,
        description: newStallOwner.stallDescription,
        category: newStallOwner.stallCategory,
        image: newStallOwner.stallImage,
        ownerId: userCredential.user.uid,
        rating: 0,
        reviewCount: 0,
        deliveryTime: "15-30 min",
        priceRange: "₱50-200",
        deliveryFee: "₱10",
        isActive: true,
      });

      toast({
        title: "Stall owner created successfully",
        description: `${newStallOwner.fullName} can now login and manage their stall.`,
      });

      // Reset form
      setNewStallOwner({
        fullName: "",
        email: "",
        password: "",
        stallName: "",
        stallDescription: "",
        stallCategory: "",
        stallImage: "",
      });

    } catch (error: any) {
      toast({
        title: "Error creating stall owner",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify user account
  const handleVerifyUser = async (userId: string) => {
    try {
      await updateDocument("users", userId, { emailVerified: true });
      toast({
        title: "User verified",
        description: "User account has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error verifying user",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateAccount = async () => {
    if (!createAccountForm.fullName || !createAccountForm.email || !createAccountForm.password) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingAccount(true);
    try {
      // Create Firebase auth account
      const userCredential = await signUp(createAccountForm.email, createAccountForm.password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData = {
        fullName: createAccountForm.fullName,
        email: createAccountForm.email,
        role: createAccountForm.role,
        studentId: createAccountForm.studentId || "",
        phoneNumber: createAccountForm.phoneNumber || "",
        loyaltyPoints: 0,
        emailVerified: true, // Admin-created accounts are automatically verified
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await createDocument("users", user.uid, userData);

      // If creating a stall owner, also create the stall
      if (createAccountForm.role === "stall_owner" && createAccountForm.stallName) {
        const stallData = {
          name: createAccountForm.stallName,
          description: createAccountForm.stallDescription || "",
          category: createAccountForm.stallCategory || "Filipino",
          ownerId: user.uid,
          ownerEmail: createAccountForm.email,
          image: "",
          isActive: true,
          rating: "0.0",
          reviewCount: 0,
          deliveryTime: "15-30 min",
          priceRange: "₱50-200",
          deliveryFee: "₱10",
          createdAt: new Date(),
        };

        await addDocument("restaurants", stallData);
      }

      // Reset form
      setCreateAccountForm({
        fullName: "",
        email: "",
        password: "",
        role: "student",
        studentId: "",
        phoneNumber: "",
        stallName: "",
        stallDescription: "",
        stallCategory: "",
      });

      setShowCreateAccountModal(false);

      toast({
        title: "Account created successfully",
        description: `${createAccountForm.role === "stall_owner" ? "Stall owner" : "User"} account has been created and verified.`,
      });
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast({
        title: "Error creating account",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#6d031e] text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 text-sm">Welcome, {state.user?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-red-700 w-full sm:w-auto">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-[#6d031e]" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Store className="w-6 h-6 sm:w-8 sm:h-8 text-[#6d031e]" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Stalls</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalStalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#6d031e]" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Stalls</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{activeStalls}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-[#6d031e]" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5 text-xs sm:text-sm">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stalls">Stalls</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="penalties">Penalties</TabsTrigger>
            <TabsTrigger value="notifications">Notify</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>User Accounts</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="student">Students Only</SelectItem>
                        <SelectItem value="stall_owner">Stall Owners Only</SelectItem>
                        <SelectItem value="admin">Admins Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={() => setShowCreateAccountModal(true)}
                      className="bg-[#6d031e] hover:bg-red-700 w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Account
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{user.fullName}</h3>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'stall_owner' ? 'default' : 'secondary'}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {user.studentId && (
                            <Badge variant="outline">ID: {user.studentId}</Badge>
                          )}
                          {user.emailVerified ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!user.emailVerified && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleVerifyUser(user.id)}
                            className="shrink-0 bg-green-600 hover:bg-green-700"
                          >
                            <span className="hidden sm:inline">Verify</span>
                            <span className="sm:hidden">✓</span>
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                            className="shrink-0"
                          >
                            <Edit className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="shrink-0">
                                <Trash2 className="w-4 h-4 sm:mr-2" />
                                <span className="hidden sm:inline">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.fullName}'s account? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Enter new category name"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleAddCategory} className="bg-[#6d031e] hover:bg-red-700 w-full sm:w-auto">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((category, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category}</span>
                          {index >= 6 && ( // Allow deleting custom categories (not the initial 6)
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCategories(categories.filter((_, i) => i !== index));
                                toast({
                                  title: "Category removed",
                                  description: `"${category}" has been removed.`,
                                });
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stalls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Stall</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStall} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stallName">Stall Name</Label>
                      <Input
                        id="stallName"
                        value={newStall.name}
                        onChange={(e) => setNewStall({ ...newStall, name: e.target.value })}
                        placeholder="Food Paradise"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newStall.category}
                        onValueChange={(value) => setNewStall({ ...newStall, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newStall.description}
                      onChange={(e) => setNewStall({ ...newStall, description: e.target.value })}
                      placeholder="Authentic Filipino dishes with a modern twist"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={newStall.image}
                      onChange={(e) => setNewStall({ ...newStall, image: e.target.value })}
                      placeholder="https://example.com/stall-image.jpg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner">Assign Owner</Label>
                    <Select
                      value={newStall.ownerId}
                      onValueChange={(value) => setNewStall({ ...newStall, ownerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stall owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {stallOwners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.fullName} ({owner.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={isLoading} className="bg-[#6d031e] hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating..." : "Create Stall"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Create Stall Owner Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Stall Owner Account</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStallOwner} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerName">Full Name</Label>
                      <Input
                        id="ownerName"
                        value={newStallOwner.fullName}
                        onChange={(e) => setNewStallOwner({ ...newStallOwner, fullName: e.target.value })}
                        placeholder="John Dela Cruz"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerEmail">Email</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={newStallOwner.email}
                        onChange={(e) => setNewStallOwner({ ...newStallOwner, email: e.target.value })}
                        placeholder="chowking@foodhub.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ownerPassword">Password</Label>
                    <Input
                      id="ownerPassword"
                      type="password"
                      value={newStallOwner.password}
                      onChange={(e) => setNewStallOwner({ ...newStallOwner, password: e.target.value })}
                      placeholder="Enter secure password"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerStallName">Stall Name</Label>
                      <Input
                        id="ownerStallName"
                        value={newStallOwner.stallName}
                        onChange={(e) => setNewStallOwner({ ...newStallOwner, stallName: e.target.value })}
                        placeholder="Chowking Express"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerStallCategory">Category</Label>
                      <Select
                        value={newStallOwner.stallCategory}
                        onValueChange={(value) => setNewStallOwner({ ...newStallOwner, stallCategory: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ownerStallDescription">Stall Description</Label>
                    <Input
                      id="ownerStallDescription"
                      value={newStallOwner.stallDescription}
                      onChange={(e) => setNewStallOwner({ ...newStallOwner, stallDescription: e.target.value })}
                      placeholder="Fast food chain serving Asian cuisine"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerStallImage">Stall Image URL</Label>
                    <Input
                      id="ownerStallImage"
                      value={newStallOwner.stallImage}
                      onChange={(e) => setNewStallOwner({ ...newStallOwner, stallImage: e.target.value })}
                      placeholder="https://example.com/stall-image.jpg"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="bg-[#6d031e] hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating..." : "Create Stall Owner & Stall"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Stalls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stalls.map((stall) => (
                    <div key={stall.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{stall.name}</h3>
                        <p className="text-sm text-gray-600">{stall.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{stall.category}</Badge>
                          <Badge variant={stall.isActive ? "default" : "secondary"}>
                            {stall.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStall(stall)}
                          className="border-gray-300 hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={stall.isActive ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleToggleStallStatus(stall.id, stall.isActive)}
                        >
                          {stall.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-700 border-red-300 hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Stall</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{stall.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteStall(stall.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="penalties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Penalty Management</CardTitle>
              </CardHeader>
              <CardContent>
                <PenaltyManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Send Notifications</CardTitle>
                  <BroadcastNotification />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Send notifications to all users or specific groups using the "Send Notification" button above.
                  </p>
                  <p className="text-sm text-gray-500">
                    Notifications will appear in users' notification bells and help keep them informed about important updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      {/* Edit Stall Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stall</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStall} className="space-y-4">
            <div>
              <Label htmlFor="editStallName">Stall Name</Label>
              <Input
                id="editStallName"
                value={editStall.name}
                onChange={(e) => setEditStall({ ...editStall, name: e.target.value })}
                placeholder="Food Paradise"
                required
              />
            </div>
            <div>
              <Label htmlFor="editCategory">Category</Label>
              <Select
                value={editStall.category}
                onValueChange={(value) => setEditStall({ ...editStall, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editStall.description}
                onChange={(e) => setEditStall({ ...editStall, description: e.target.value })}
                placeholder="Authentic Filipino dishes with a modern twist"
                required
              />
            </div>
            <div>
              <Label htmlFor="editImage">Image URL</Label>
              <Input
                id="editImage"
                value={editStall.image}
                onChange={(e) => setEditStall({ ...editStall, image: e.target.value })}
                placeholder="https://example.com/stall-image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="editOwner">Assign Owner</Label>
              <Select
                value={editStall.ownerId}
                onValueChange={(value) => setEditStall({ ...editStall, ownerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stall owner" />
                </SelectTrigger>
                <SelectContent>
                  {stallOwners.map((owner) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.fullName} ({owner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#6d031e] hover:bg-red-700"
              >
                {isLoading ? "Updating..." : "Update Stall"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div>
              <Label htmlFor="editUserFullName">Full Name</Label>
              <Input
                id="editUserFullName"
                value={editUserForm.fullName}
                onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="editUserEmail">Email</Label>
              <Input
                id="editUserEmail"
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="editUserStudentId">Student ID</Label>
              <Input
                id="editUserStudentId"
                value={editUserForm.studentId}
                onChange={(e) => setEditUserForm({ ...editUserForm, studentId: e.target.value })}
                placeholder="Enter student ID (optional)"
              />
            </div>
            <div>
              <Label htmlFor="editUserRole">Role</Label>
              <Select value={editUserForm.role} onValueChange={(value) => setEditUserForm({ ...editUserForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="stall_owner">Stall Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-[#6d031e] hover:bg-red-700"
              >
                {isLoading ? "Updating..." : "Update User"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditUserDialogOpen(false)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Account Dialog */}
      <Dialog open={showCreateAccountModal} onOpenChange={setShowCreateAccountModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateAccount(); }} className="space-y-4">
            <div>
              <Label htmlFor="createFullName">Full Name *</Label>
              <Input
                id="createFullName"
                value={createAccountForm.fullName}
                onChange={(e) => setCreateAccountForm({ ...createAccountForm, fullName: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="createEmail">Email *</Label>
              <Input
                id="createEmail"
                type="email"
                value={createAccountForm.email}
                onChange={(e) => setCreateAccountForm({ ...createAccountForm, email: e.target.value })}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="createPassword">Password *</Label>
              <Input
                id="createPassword"
                type="password"
                value={createAccountForm.password}
                onChange={(e) => setCreateAccountForm({ ...createAccountForm, password: e.target.value })}
                placeholder="Enter password"
                required
              />
            </div>
            <div>
              <Label htmlFor="createRole">Role *</Label>
              <Select value={createAccountForm.role} onValueChange={(value) => setCreateAccountForm({ ...createAccountForm, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="stall_owner">Stall Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="createStudentId">Student ID</Label>
              <Input
                id="createStudentId"
                value={createAccountForm.studentId}
                onChange={(e) => setCreateAccountForm({ ...createAccountForm, studentId: e.target.value })}
                placeholder="Enter student ID (optional)"
              />
            </div>
            <div>
              <Label htmlFor="createPhoneNumber">Phone Number</Label>
              <Input
                id="createPhoneNumber"
                value={createAccountForm.phoneNumber}
                onChange={(e) => setCreateAccountForm({ ...createAccountForm, phoneNumber: e.target.value })}
                placeholder="Enter phone number (optional)"
              />
            </div>
            
            {/* Stall Owner specific fields */}
            {createAccountForm.role === "stall_owner" && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm text-gray-700 mb-3">Stall Information</h4>
                </div>
                <div>
                  <Label htmlFor="createStallName">Stall Name *</Label>
                  <Input
                    id="createStallName"
                    value={createAccountForm.stallName}
                    onChange={(e) => setCreateAccountForm({ ...createAccountForm, stallName: e.target.value })}
                    placeholder="Enter stall name (e.g., Chowking)"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="createStallDescription">Stall Description</Label>
                  <Input
                    id="createStallDescription"
                    value={createAccountForm.stallDescription}
                    onChange={(e) => setCreateAccountForm({ ...createAccountForm, stallDescription: e.target.value })}
                    placeholder="Enter stall description"
                  />
                </div>
                <div>
                  <Label htmlFor="createStallCategory">Stall Category</Label>
                  <Select value={createAccountForm.stallCategory} onValueChange={(value) => setCreateAccountForm({ ...createAccountForm, stallCategory: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={isCreatingAccount}
                className="flex-1 bg-[#6d031e] hover:bg-red-700"
              >
                {isCreatingAccount ? "Creating..." : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateAccountModal(false)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}