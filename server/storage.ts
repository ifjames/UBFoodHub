import { 
  users, restaurants, menuItems, orders, orderItems, cartItems, reviews,
  type User, type InsertUser, type Restaurant, type InsertRestaurant,
  type MenuItem, type InsertMenuItem, type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem, type CartItem, type InsertCartItem,
  type Review, type InsertReview
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Restaurants
  getRestaurants(): Promise<Restaurant[]>;
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  getRestaurantStats(restaurantId: number): Promise<{
    priceRange: string | null;
    avgCompletionTime: string | null;
  }>;
  
  // Menu Items
  getMenuItems(restaurantId: number): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Orders
  getOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Order Items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  
  // Cart Items
  getCartItems(userId: number): Promise<CartItem[]>;
  createCartItem(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  deleteCartItem(id: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Reviews
  getReviews(restaurantId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private restaurants: Map<number, Restaurant> = new Map();
  private menuItems: Map<number, MenuItem> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private cartItems: Map<number, CartItem> = new Map();
  private reviews: Map<number, Review> = new Map();
  
  private currentUserId = 1;
  private currentRestaurantId = 1;
  private currentMenuItemId = 1;
  private currentOrderId = 1;
  private currentOrderItemId = 1;
  private currentCartItemId = 1;
  private currentReviewId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create sample users
    const sampleUsers = [
      { username: "student1", email: "student1@ub.edu.ph", password: "password123", fullName: "Juan Dela Cruz", studentId: "UB-2024-001", role: "student" },
      { username: "owner1", email: "owner1@ub.edu.ph", password: "password123", fullName: "Maria Santos", studentId: null, role: "stall_owner" },
    ];

    sampleUsers.forEach(user => {
      const newUser: User = { ...user, id: this.currentUserId++, createdAt: new Date() };
      this.users.set(newUser.id, newUser);
    });

    // Create sample restaurants
    const sampleRestaurants = [
      {
        name: "Chicken Master - Batangas",
        description: "Crispy fried chicken and rice meals",
        image: "https://images.unsplash.com/photo-1562967914-608f82629710?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        rating: "4.9",
        reviewCount: 1000,
        deliveryTime: "5-20 min",
        priceRange: "₱",
        categories: ["Fried Chicken", "Rice Meals"],
        isActive: true,
        deliveryFee: "5.00",
        ownerId: 2,
      },
      {
        name: "Tita's BBQ Corner",
        description: "Authentic Filipino BBQ and grilled specialties",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        rating: "5.0",
        reviewCount: 500,
        deliveryTime: "5-20 min",
        priceRange: "₱₱",
        categories: ["BBQ & Grilled", "Filipino"],
        isActive: true,
        deliveryFee: "5.00",
        ownerId: 2,
      },
      {
        name: "Canteen Central",
        description: "Traditional Filipino rice meals and comfort food",
        image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        rating: "4.8",
        reviewCount: 800,
        deliveryTime: "5-15 min",
        priceRange: "₱",
        categories: ["Rice Meals", "Filipino"],
        isActive: true,
        deliveryFee: "5.00",
        ownerId: 2,
      },
      {
        name: "Sweet Treats Hub",
        description: "Desserts, halo-halo, and Filipino sweets",
        image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        rating: "4.7",
        reviewCount: 650,
        deliveryTime: "10-25 min",
        priceRange: "₱",
        categories: ["Desserts & Snacks", "Filipino"],
        isActive: true,
        deliveryFee: "5.00",
        ownerId: 2,
      },
      {
        name: "Fresh Sip Station",
        description: "Fresh fruit juices and beverages",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300",
        rating: "4.6",
        reviewCount: 400,
        deliveryTime: "5-15 min",
        priceRange: "₱",
        categories: ["Beverages", "Fresh Juices"],
        isActive: true,
        deliveryFee: "5.00",
        ownerId: 2,
      },
    ];

    sampleRestaurants.forEach(restaurant => {
      const newRestaurant: Restaurant = { ...restaurant, id: this.currentRestaurantId++, createdAt: new Date() };
      this.restaurants.set(newRestaurant.id, newRestaurant);
    });

    // Create sample menu items
    const sampleMenuItems = [
      // Chicken Master items
      { restaurantId: 1, name: "Crispy Fried Chicken", description: "Golden crispy chicken with special seasoning", price: "89.00", image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Chicken", isAvailable: true, isPopular: true },
      { restaurantId: 1, name: "Chicken Rice Bowl", description: "Tender chicken with steamed rice and vegetables", price: "95.00", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Rice Meals", isAvailable: true, isPopular: true },
      { restaurantId: 1, name: "Spicy Buffalo Wings", description: "6 pieces of spicy chicken wings with ranch", price: "125.00", image: "https://images.unsplash.com/photo-1608039755401-742074f0548d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Chicken", isAvailable: true, isPopular: true },
      
      // BBQ Corner items
      { restaurantId: 2, name: "Pork BBQ Skewer", description: "Marinated pork skewer with BBQ sauce", price: "45.00", image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "BBQ", isAvailable: true, isPopular: true },
      { restaurantId: 2, name: "Grilled Liempo", description: "Grilled pork belly with rice and salad", price: "120.00", image: "https://images.unsplash.com/photo-1544025162-d76694265947?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Grilled", isAvailable: true, isPopular: true },
      
      // Canteen Central items
      { restaurantId: 3, name: "Adobo Rice", description: "Traditional Filipino adobo with steamed rice", price: "75.00", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Rice Meals", isAvailable: true, isPopular: true },
      { restaurantId: 3, name: "Sinigang na Baboy", description: "Sour pork soup with vegetables", price: "85.00", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Soup", isAvailable: true, isPopular: true },
      
      // Sweet Treats items
      { restaurantId: 4, name: "Halo-Halo", description: "Mixed Filipino dessert with ice cream", price: "65.00", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Desserts", isAvailable: true, isPopular: true },
      { restaurantId: 4, name: "Leche Flan", description: "Traditional Filipino custard dessert", price: "45.00", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Desserts", isAvailable: true, isPopular: false },
      
      // Fresh Sip items
      { restaurantId: 5, name: "Mango Shake", description: "Fresh mango blended with milk", price: "55.00", image: "https://images.unsplash.com/photo-1546173159-315724a31696?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Beverages", isAvailable: true, isPopular: true },
      { restaurantId: 5, name: "Buko Juice", description: "Fresh coconut water", price: "35.00", image: "https://images.unsplash.com/photo-1520950237200-5f0af6d9c2db?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200", category: "Beverages", isAvailable: true, isPopular: false },
    ];

    sampleMenuItems.forEach(item => {
      const newMenuItem: MenuItem = { ...item, id: this.currentMenuItemId++, createdAt: new Date() };
      this.menuItems.set(newMenuItem.id, newMenuItem);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      role: insertUser.role || 'student',
      studentId: insertUser.studentId || null
    };
    this.users.set(id, user);
    return user;
  }

  // Restaurant methods
  async getRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(r => r.isActive);
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.currentRestaurantId++;
    const restaurant: Restaurant = { 
      ...insertRestaurant, 
      id, 
      createdAt: new Date(),
      image: insertRestaurant.image || null,
      description: insertRestaurant.description || null,
      rating: insertRestaurant.rating || null,
      reviewCount: insertRestaurant.reviewCount || null,
      deliveryTime: insertRestaurant.deliveryTime || null,
      priceRange: insertRestaurant.priceRange || null,
      isActive: insertRestaurant.isActive || null,
      deliveryFee: insertRestaurant.deliveryFee || null,
      ownerId: insertRestaurant.ownerId || null
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: number, restaurant: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const existingRestaurant = this.restaurants.get(id);
    if (existingRestaurant) {
      const updatedRestaurant = { ...existingRestaurant, ...restaurant };
      this.restaurants.set(id, updatedRestaurant);
      return updatedRestaurant;
    }
    return undefined;
  }

  async getRestaurantStats(restaurantId: number): Promise<{
    priceRange: string | null;
    avgCompletionTime: string | null;
  }> {
    const menuItems = Array.from(this.menuItems.values()).filter(
      item => item.restaurantId === restaurantId
    );

    let priceRange: string | null = null;
    if (menuItems.length > 0) {
      const prices = menuItems.map(item => parseFloat(item.price as string));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      priceRange = `₱${minPrice.toFixed(0)}-${maxPrice.toFixed(0)}`;
    }

    const completedOrders = Array.from(this.orders.values()).filter(
      order => order.restaurantId === restaurantId && order.status === 'completed' && order.createdAt && order.updatedAt
    );

    let avgCompletionTime: string | null = null;
    if (completedOrders.length > 0) {
      const totalMinutes = completedOrders.reduce((sum, order) => {
        const created = new Date(order.createdAt!).getTime();
        const updated = new Date(order.updatedAt!).getTime();
        const diffInMinutes = Math.round((updated - created) / (1000 * 60));
        return sum + diffInMinutes;
      }, 0);
      
      const avgMinutes = Math.round(totalMinutes / completedOrders.length);
      const minEstimate = Math.max(5, avgMinutes - 5);
      const maxEstimate = avgMinutes + 5;
      avgCompletionTime = `${minEstimate}-${maxEstimate} min`;
    }

    return { priceRange, avgCompletionTime };
  }

  // Menu item methods
  async getMenuItems(restaurantId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => 
      item.restaurantId === restaurantId && item.isAvailable
    );
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentMenuItemId++;
    const menuItem: MenuItem = { 
      ...insertMenuItem, 
      id, 
      createdAt: new Date(),
      image: insertMenuItem.image || null,
      description: insertMenuItem.description || null,
      isAvailable: insertMenuItem.isAvailable || null,
      isPopular: insertMenuItem.isPopular || null
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  async updateMenuItem(id: number, menuItem: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existingMenuItem = this.menuItems.get(id);
    if (existingMenuItem) {
      const updatedMenuItem = { ...existingMenuItem, ...menuItem };
      this.menuItems.set(id, updatedMenuItem);
      return updatedMenuItem;
    }
    return undefined;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  // Order methods
  async getOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => order.userId === userId);
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const qrCode = `UBF-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
    const order: Order = { 
      ...insertOrder, 
      id, 
      qrCode,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertOrder.status || 'pending',
      deliveryFee: insertOrder.deliveryFee || null,
      specialInstructions: insertOrder.specialInstructions || null,
      estimatedTime: insertOrder.estimatedTime || null
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (order) {
      const updatedOrder = { ...order, status, updatedAt: new Date() };
      this.orders.set(id, updatedOrder);
      return updatedOrder;
    }
    return undefined;
  }

  // Order item methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const orderItem: OrderItem = { 
      ...insertOrderItem, 
      id,
      customizations: insertOrderItem.customizations || null
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Cart item methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => item.userId === userId);
  }

  async createCartItem(insertCartItem: InsertCartItem): Promise<CartItem> {
    const id = this.currentCartItemId++;
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id, 
      createdAt: new Date(),
      customizations: insertCartItem.customizations || null
    };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    if (cartItem) {
      const updatedCartItem = { ...cartItem, quantity };
      this.cartItems.set(id, updatedCartItem);
      return updatedCartItem;
    }
    return undefined;
  }

  async deleteCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.entries()).filter(([_, item]) => item.userId === userId);
    userCartItems.forEach(([id]) => this.cartItems.delete(id));
    return true;
  }

  // Review methods
  async getReviews(restaurantId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => review.restaurantId === restaurantId);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { 
      ...insertReview, 
      id, 
      createdAt: new Date(),
      orderId: insertReview.orderId || null,
      comment: insertReview.comment || null
    };
    this.reviews.set(id, review);
    return review;
  }
}

export const storage = new MemStorage();
