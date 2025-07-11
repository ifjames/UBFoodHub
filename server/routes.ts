import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCartItemSchema, insertOrderSchema, insertReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
