import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

export function TermsDialog({ isOpen, onClose, type }: TermsDialogProps) {
  const isTerms = type === 'terms';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-[#6d031e] text-2xl font-bold">
            {isTerms ? 'Terms of Service' : 'Privacy Policy'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isTerms ? 'Please review our Terms of Service for using UB FoodHub.' : 'Please review our Privacy Policy to understand how we handle your data.'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="prose prose-sm max-w-none">
            {isTerms ? <TermsContent /> : <PrivacyContent />}
          </div>
        </ScrollArea>
        
        <div className="flex justify-end mt-6">
          <Button 
            onClick={onClose} 
            className="bg-[#6d031e] hover:bg-[#6d031e]/90 text-white"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TermsContent() {
  return (
    <div className="space-y-6 text-gray-700">
      <h3 className="text-lg font-semibold text-[#6d031e]">1. Acceptance of Terms</h3>
      <p>
        By accessing and using UB FoodHub, you accept and agree to be bound by the terms and provision of this agreement. 
        If you do not agree to abide by the above, please do not use this service.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">2. Account Registration</h3>
      <p>
        You must register for an account using your official University of Batangas email address (@ub.edu.ph). 
        You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">3. Service Description</h3>
      <p>
        UB FoodHub is a food ordering platform designed specifically for University of Batangas students, faculty, and staff. 
        The service allows users to browse menus, place orders, and arrange pickup from campus food stalls.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">4. User Responsibilities</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>Provide accurate and complete information when placing orders</li>
        <li>Pick up orders within the specified timeframe</li>
        <li>Treat food stall staff and other users with respect</li>
        <li>Report any issues or concerns promptly</li>
        <li>Use the service only for legitimate food ordering purposes</li>
      </ul>

      <h3 className="text-lg font-semibold text-[#6d031e]">5. Order and Payment Policy</h3>
      <p>
        All orders are subject to availability and confirmation by the respective food stalls. 
        Payments must be made according to the stall's accepted payment methods. 
        Orders may be cancelled or modified only within the allowed timeframe.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">6. Prohibited Activities</h3>
      <ul className="list-disc pl-6 space-y-2">
        <li>Sharing account credentials with others</li>
        <li>Placing fraudulent or fake orders</li>
        <li>Attempting to circumvent system security</li>
        <li>Using the service for commercial purposes without authorization</li>
        <li>Harassment or inappropriate conduct toward other users or staff</li>
      </ul>

      <h3 className="text-lg font-semibold text-[#6d031e]">7. Cancellation and Refund Policy</h3>
      <p>
        Order cancellations are subject to the individual stall's policies. 
        Refunds, if applicable, will be processed according to the stall's refund policy. 
        UB FoodHub reserves the right to cancel orders in cases of technical errors or unavailability.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">8. Limitation of Liability</h3>
      <p>
        UB FoodHub serves as a platform connecting students with campus food stalls. 
        We are not responsible for food quality, preparation, or any food-related issues. 
        Users assume all risks associated with food consumption.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">9. Service Availability</h3>
      <p>
        The service is provided "as is" and may be subject to interruptions for maintenance, 
        technical issues, or other factors beyond our control. We do not guarantee continuous availability.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">10. Modifications to Terms</h3>
      <p>
        UB FoodHub reserves the right to modify these terms of service at any time. 
        Users will be notified of significant changes and continued use constitutes acceptance of the modified terms.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">11. Contact Information</h3>
      <p>
        For questions or concerns regarding these terms, please contact us through the app's support feature 
        or reach out to the University of Batangas IT department.
      </p>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-6 text-gray-700">
      <h3 className="text-lg font-semibold text-[#6d031e]">1. Information We Collect</h3>
      <p>
        We collect information you provide directly to us, including:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Name, email address, and student ID</li>
        <li>Phone number for order notifications</li>
        <li>Order history and preferences</li>
        <li>Payment information (processed securely)</li>
        <li>Communication with customer support</li>
      </ul>

      <h3 className="text-lg font-semibold text-[#6d031e]">2. How We Use Your Information</h3>
      <p>
        We use the information we collect to:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Process and fulfill your food orders</li>
        <li>Send order confirmations and updates</li>
        <li>Provide customer support</li>
        <li>Improve our services and user experience</li>
        <li>Comply with legal requirements</li>
      </ul>

      <h3 className="text-lg font-semibold text-[#6d031e]">3. Information Sharing</h3>
      <p>
        We share your information only in the following circumstances:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>With food stall owners to process your orders</li>
        <li>With university administration as required</li>
        <li>When required by law or legal process</li>
        <li>To protect our rights and the safety of users</li>
      </ul>

      <h3 className="text-lg font-semibold text-[#6d031e]">4. Data Security</h3>
      <p>
        We implement appropriate technical and organizational measures to protect your personal information against 
        unauthorized access, alteration, disclosure, or destruction. However, no method of electronic storage 
        is 100% secure.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">5. Data Retention</h3>
      <p>
        We retain your personal information for as long as necessary to provide our services, 
        comply with legal obligations, resolve disputes, and enforce our agreements.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">6. Your Rights</h3>
      <p>
        You have the right to:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Access and update your personal information</li>
        <li>Request deletion of your account and data</li>
        <li>Object to processing of your information</li>
        <li>Request data portability</li>
        <li>Withdraw consent where applicable</li>
      </ul>

      <h3 className="text-lg font-semibold text-[#6d031e]">7. Cookies and Tracking</h3>
      <p>
        We use cookies and similar technologies to enhance your experience, remember your preferences, 
        and analyze how you use our service. You can control cookie settings through your browser.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">8. Third-Party Services</h3>
      <p>
        Our service may integrate with third-party services (such as payment processors) 
        that have their own privacy policies. We are not responsible for their privacy practices.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">9. Changes to Privacy Policy</h3>
      <p>
        We may update this privacy policy from time to time. We will notify you of any material changes 
        by posting the new policy on this page and updating the effective date.
      </p>

      <h3 className="text-lg font-semibold text-[#6d031e]">10. Contact Us</h3>
      <p>
        If you have any questions about this privacy policy or our data practices, 
        please contact us through the app's support feature or reach out to the University of Batangas IT department.
      </p>

      <p className="text-sm text-gray-500 mt-8">
        Last updated: {new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
    </div>
  );
}