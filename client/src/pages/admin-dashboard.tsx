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
import { subscribeToCollection, addDocument, updateDocument, deleteDocument, getCollection } from "@/lib/firebase";
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
                        </div>
                      </div>
                      <div className="flex gap-2">
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
    </div>
  );
}