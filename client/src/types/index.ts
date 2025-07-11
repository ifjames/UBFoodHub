export interface CartItemWithDetails {
  id: number;
  userId: number;
  menuItemId: number;
  quantity: number;
  customizations?: string | null;
  createdAt: Date;
  menuItem?: {
    id: number;
    restaurantId: number;
    name: string;
    description?: string | null;
    price: string;
    image?: string | null;
    category: string;
    isAvailable: boolean;
    isPopular: boolean;
    createdAt: Date;
  };
}

export interface OrderWithDetails {
  id: number;
  userId: number;
  restaurantId: number;
  status: string;
  totalAmount: string;
  deliveryFee: string;
  qrCode?: string | null;
  specialInstructions?: string | null;
  estimatedTime?: string | null;
  createdAt: Date;
  updatedAt: Date;
  restaurant?: {
    id: number;
    name: string;
    description?: string | null;
    image?: string | null;
    rating: string;
    reviewCount: number;
    deliveryTime: string;
    priceRange: string;
    category: string;
    isActive: boolean;
    deliveryFee: string;
    ownerId?: number | null;
    createdAt: Date;
  };
  items?: Array<{
    id: number;
    orderId: number;
    menuItemId: number;
    quantity: number;
    price: string;
    customizations?: string | null;
    menuItem?: {
      id: number;
      restaurantId: number;
      name: string;
      description?: string | null;
      price: string;
      image?: string | null;
      category: string;
      isAvailable: boolean;
      isPopular: boolean;
      createdAt: Date;
    };
  }>;
}
