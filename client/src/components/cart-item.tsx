import { useState } from "react";
import { Plus, Minus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CartItemWithDetails } from "@/types";

interface CartItemProps {
  item: CartItemWithDetails;
  onDelete: (id: number) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
}

export default function CartItem({ item, onDelete, onUpdateQuantity }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) return;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const totalPrice = parseFloat(item.menuItem?.price || "0") * quantity;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <img
            src={item.menuItem?.image || "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"}
            alt={item.menuItem?.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">{item.menuItem?.name}</h3>
            {item.menuItem?.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {item.menuItem.description}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium text-sm w-8 text-center">{quantity}</span>
                <Button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-800">₱{totalPrice.toFixed(2)}</span>
                <Button
                  onClick={() => onDelete(item.id)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
