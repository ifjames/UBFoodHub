import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updateDocument } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { User, GraduationCap, Phone } from "lucide-react";

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export default function ProfileCompletionModal({
  isOpen,
  onComplete,
}: ProfileCompletionModalProps) {
  const { toast } = useToast();
  const { state, dispatch } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    phoneNumber: "",
  });

  const validatePhoneNumber = (phone: string): boolean => {
    // Philippine mobile number validation (+639xxxxxxxxx or 09xxxxxxxxx)
    const phoneRegex = /^(\+639|09)\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId.trim()) {
      toast({
        title: "Student ID Required",
        description: "Please enter your University of Batangas Student ID.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter your phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description:
          "Please enter a valid Philippine mobile number (e.g., +639xxxxxxxxx or 09xxxxxxxxx)",
        variant: "destructive",
      });
      return;
    }

    if (!state.user?.uid) {
      toast({
        title: "Error",
        description: "User not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update user document in Firestore
      await updateDocument("users", state.user.uid, {
        studentId: formData.studentId.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        profileCompleted: true,
        updatedAt: new Date(),
      });

      // Update local state
      dispatch({
        type: "SET_USER",
        payload: {
          ...state.user,
          studentId: formData.studentId.trim(),
          phoneNumber: formData.phoneNumber.trim(),
        },
      });

      toast({
        title: "Profile Updated",
        description:
          "Your student ID and phone number have been saved successfully!",
      });

      onComplete();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-[#6d031e]">
            Complete Your Profile
          </DialogTitle>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#6d031e] rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-600">
                To complete your registration, please provide your Student ID
                and phone number.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="studentId"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <GraduationCap className="w-4 h-4" />
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter your UB Student ID"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      studentId: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-[#6d031e] focus:ring-[#6d031e]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phoneNumber"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+639xxxxxxxxx or 09xxxxxxxxx"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="border-gray-300 focus:border-[#6d031e] focus:ring-[#6d031e]"
                  required
                />
                <p className="text-xs text-gray-500">
                  Required for order notifications and verification purposes.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#6d031e] hover:bg-[#8b0426] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
