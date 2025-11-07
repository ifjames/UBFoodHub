import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCartItemSchema, insertOrderSchema, insertReviewSchema } from "@shared/schema";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";
import { config } from "./config.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 32 * 1024 * 1024, // 32MB max
    }
  });

  // Image upload route
  app.post("/api/upload-image", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const IMGBB_API_KEY = process.env.IMGBB_API_KEY || config.IMGBB_API_KEY;
      
      // Convert buffer to base64
      const base64Image = req.file.buffer.toString('base64');
      
      // Create form data for ImgBB
      const formData = new FormData();
      formData.append('image', base64Image);
      
      // Upload to ImgBB
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('ImgBB upload failed');
      }

      const data = await response.json() as any;
      
      // Return the image URL
      res.json({ url: data.data.url });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, use proper session management
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Restaurant routes
  app.get("/api/restaurants", async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      res.json(restaurants);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/restaurants/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getRestaurantStats(id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Menu routes
  app.get("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const menuItems = await storage.getMenuItems(restaurantId);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Stall management routes
  app.put("/api/restaurants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Update restaurant with new data
      const updatedData = req.body;
      const updatedRestaurant = await storage.updateRestaurant(id, updatedData);
      
      res.json(updatedRestaurant);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Menu item management routes
  app.post("/api/menu-items", async (req, res) => {
    try {
      const menuItemData = req.body;
      const menuItem = await storage.createMenuItem(menuItemData);
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItemData = req.body;
      const menuItem = await storage.updateMenuItem(id, menuItemData);
      
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/menu-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMenuItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Categories route
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = [
        "Filipino",
        "Chinese", 
        "Japanese",
        "Korean",
        "American",
        "Italian",
        "Fast Food",
        "BBQ & Grilled",
        "Rice Meals",
        "Noodles",
        "Desserts & Snacks",
        "Beverages",
        "Fresh Juices",
        "Coffee",
        "Fried Chicken",
        "Pizza",
        "Burgers",
        "Sandwiches",
        "Salads",
        "Healthy"
      ];
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/menu/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItem = await storage.getMenuItem(id);
      
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(menuItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Cart routes
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const cartItems = await storage.getCartItems(userId);
      
      // Get menu item details for each cart item
      const cartWithDetails = await Promise.all(
        cartItems.map(async (item) => {
          const menuItem = await storage.getMenuItem(item.menuItemId);
          return {
            ...item,
            menuItem
          };
        })
      );
      
      res.json(cartWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const cartItemData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.createCartItem(cartItemData);
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(id, quantity);
      
      if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCartItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      
      res.json({ message: "Cart item deleted" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Order routes
  app.get("/api/orders/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const orders = await storage.getOrders(userId);
      
      // Get restaurant details for each order
      const ordersWithDetails = await Promise.all(
        orders.map(async (order) => {
          const restaurant = await storage.getRestaurant(order.restaurantId);
          const orderItems = await storage.getOrderItems(order.id);
          
          const orderItemsWithDetails = await Promise.all(
            orderItems.map(async (item) => {
              const menuItem = await storage.getMenuItem(item.menuItemId);
              return {
                ...item,
                menuItem
              };
            })
          );
          
          return {
            ...order,
            restaurant,
            items: orderItemsWithDetails
          };
        })
      );
      
      res.json(ordersWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const { items, ...orderInfo } = req.body;
      
      // Create order
      const order = await storage.createOrder(orderInfo);
      
      // Create order items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          await storage.createOrderItem({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            customizations: item.customizations
          });
        }
      }
      
      // Clear cart
      await storage.clearCart(orderInfo.userId);
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const order = await storage.updateOrderStatus(id, status);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Review routes
  app.get("/api/restaurants/:id/reviews", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const reviews = await storage.getReviews(restaurantId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/delete-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      let auth;
      let authDeleted = false;
      
      try {
        const adminModule = await import("./firebase-admin");
        auth = adminModule.auth;
      } catch (importError) {
        console.warn("Firebase Admin not available, skipping Firebase Auth deletion");
        return res.json({ 
          success: true,
          authDeleted: false,
          message: "Firebase Admin SDK not configured for auth deletion." 
        });
      }
      
      if (auth) {
        try {
          await auth.deleteUser(userId);
          authDeleted = true;
        } catch (deleteError: any) {
          console.error("Error deleting user from Firebase Auth:", deleteError);
          return res.json({ 
            success: true,
            authDeleted: false,
            message: `Firebase Auth deletion failed: ${deleteError.message}` 
          });
        }
      }
      
      res.json({ 
        success: true, 
        authDeleted: authDeleted,
        message: "User deleted from Firebase Authentication successfully" 
      });
    } catch (error: any) {
      console.error("Error in delete user endpoint:", error);
      res.status(500).json({ 
        success: false,
        authDeleted: false,
        message: error.message || "Failed to process user deletion" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
