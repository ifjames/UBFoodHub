import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import BottomNav from "@/components/layout/bottom-nav";

export default function TermsPolicies() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white p-4 bg-[#820d2a]">
        <div className="flex items-center">
          <button
            onClick={() => setLocation("/profile")}
            className="mr-4 p-2 hover:bg-red-700 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Terms & Policies</h1>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-20">
        {/* Terms of Service */}
        <Card>
          <CardHeader>
            <CardTitle>Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                By using UB FoodHub, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">2. Service Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                UB FoodHub is a food ordering platform designed for University of Batangas students, faculty, and staff to order food from campus canteen stalls.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">3. User Responsibilities</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Users are responsible for providing accurate information, maintaining the security of their accounts, and using the service in accordance with university policies.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">4. Order Policies</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Orders are subject to availability and stall operating hours. Cancellation policies vary by stall. Users must show valid QR codes for order pickup.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">5. Payment Terms</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Currently, cash payments are accepted upon pickup. Digital payment options may be introduced in the future with additional terms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Information We Collect</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We collect information you provide directly to us, such as your name, email address, student ID, and order history. We also collect usage information to improve our services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your information is used to process orders, communicate with you about your orders, improve our services, and ensure compliance with university policies.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Information Sharing</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We share order information with relevant stall owners to fulfill your orders. We do not sell or rent your personal information to third parties.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Data Security</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* University Policies */}
        <Card>
          <CardHeader>
            <CardTitle>University of Batangas Policies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Student Code of Conduct</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                All users must comply with the University of Batangas Student Code of Conduct when using UB FoodHub services.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Campus Food Service Guidelines</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Users must follow university guidelines regarding food consumption on campus, including designated eating areas and proper disposal of waste.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Health and Safety</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Users with food allergies or dietary restrictions should communicate directly with stall owners. The university and UB FoodHub are not responsible for allergic reactions.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-800">UB FoodHub Support</h4>
                <p className="text-gray-600">Email: support@ubfoodhub.edu.ph</p>
                <p className="text-gray-600">Phone: +63 (43) 425-0139</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800">University of Batangas</h4>
                <p className="text-gray-600">Hilltop, Batangas City, Batangas 4200</p>
                <p className="text-gray-600">Main Office: +63 (43) 300-4000</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <div className="text-center">
          <p className="text-xs text-gray-500">Last updated: January 2025</p>
          <p className="text-xs text-gray-500 mt-1">Version 1.0</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}