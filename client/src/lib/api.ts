import { apiRequest } from "./queryClient";

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest("POST", "/api/auth/login", credentials),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    studentId?: string;
  }) => apiRequest("POST", "/api/auth/register", userData),

  // Restaurants
  getRestaurants: () => apiRequest("GET", "/api/restaurants"),
  getRestaurant: (id: number) => apiRequest("GET", `/api/restaurants/${id}`),
  
  // Menu
  getMenuItems: (restaurantId: number) => 
    apiRequest("GET", `/api/restaurants/${restaurantId}/menu`),
  
  // Cart
  getCart: (userId: number) => apiRequest("GET", `/api/cart/${userId}`),
  addToCart: (item: {
    userId: number;
    menuItemId: number;
    quantity: number;
    customizations?: string;
  }) => apiRequest("POST", "/api/cart", item),
  
  updateCartItem: (id: number, quantity: number) =>
    apiRequest("PUT", `/api/cart/${id}`, { quantity }),
  
  deleteCartItem: (id: number) => apiRequest("DELETE", `/api/cart/${id}`),
  
  // Orders
  getOrders: (userId: number) => apiRequest("GET", `/api/orders/${userId}`),
  createOrder: (order: {
    userId: number;
    restaurantId: number;
    totalAmount: string;
    deliveryFee: string;
    specialInstructions?: string;
    estimatedTime?: string;
    items: Array<{
      menuItemId: number;
      quantity: number;
      price: string;
      customizations?: string;
    }>;
  }) => apiRequest("POST", "/api/orders", order),
  
  updateOrderStatus: (id: number, status: string) =>
    apiRequest("PUT", `/api/orders/${id}/status`, { status }),
  
  // Reviews
  getReviews: (restaurantId: number) =>
    apiRequest("GET", `/api/restaurants/${restaurantId}/reviews`),
  
  createReview: (review: {
    userId: number;
    restaurantId: number;
    orderId?: number;
    rating: number;
    comment?: string;
  }) => apiRequest("POST", "/api/reviews", review),
};
