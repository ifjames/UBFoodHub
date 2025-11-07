import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import BottomNav from "@/components/layout/bottom-nav";
import { usePageTitle } from "@/hooks/use-page-title";

export default function HelpCenter() {
  usePageTitle("Help Center");
  const [, setLocation] = useLocation();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "To place an order, browse the available stalls, select items you want, add them to your cart, and proceed to checkout. You'll receive a QR code for pickup once your order is confirmed."
    },
    {
      question: "How does the QR code pickup system work?",
      answer: "After placing an order, you'll receive a unique QR code. Show this code to the stall owner when your order is ready for pickup. The stall owner will scan it to confirm your order."
    },
    {
      question: "Can I cancel my order?",
      answer: "Orders can be cancelled while they are still in 'Pending' status. Once a stall owner starts preparing your order, cancellation may not be possible. Contact the stall directly for assistance."
    },
    {
      question: "What payment methods are accepted?",
      answer: "Currently, we support cash payments upon pickup. Digital payment options will be available soon. Please have exact change ready when collecting your order."
    },
    {
      question: "How do I track my order status?",
      answer: "Go to the Orders page to view the status of all your orders. You'll see updates as your order moves from Pending → Preparing → Ready → Completed."
    },
    {
      question: "What if my order is taking too long?",
      answer: "Order preparation times vary by stall and item complexity. If your order seems delayed, you can contact the stall directly or reach out to our support team."
    },
    {
      question: "Can I modify my order after placing it?",
      answer: "Order modifications depend on the preparation status. Contact the stall owner immediately if you need to make changes. Changes may not be possible once preparation has started."
    },
    {
      question: "How do I report an issue with my order?",
      answer: "If you experience any issues with your order, you can contact us through the support options below or leave feedback after completing your order."
    }
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Coming Soon",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: Phone,
      title: "Call Support",
      description: "UB FoodHub Support Line",
      action: "+63 (43) 425-0139",
      bgColor: "bg-green-50",
      iconColor: "text-green-600"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email",
      action: "support@ubfoodhub.edu.ph",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 md:pt-20">
      {/* Mobile Header */}
      <header className="text-white p-4 bg-[#820d2a] md:hidden">
        <div className="flex items-center max-w-4xl mx-auto">
          <button
            onClick={() => setLocation("/profile")}
            className="mr-4 p-2 hover:bg-red-700 rounded-full"
            data-testid="button-back-help-mobile"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Help Center</h1>
        </div>
      </header>
      {/* Desktop Back Button */}
      <div className="hidden md:block max-w-4xl mx-auto pt-6 px-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/profile")}
          className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 -ml-2"
          data-testid="button-back-help-desktop"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Profile
        </Button>
      </div>

      <div className="p-4 space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
        {/* Quick Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {contactOptions.map((option, index) => (
                <div key={index} className="flex items-center p-3 rounded-lg border hover:shadow-sm transition-shadow">
                  <div className={`p-2 rounded-lg ${option.bgColor} mr-3`}>
                    <option.icon className={`h-5 w-5 ${option.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{option.title}</h3>
                    <p className="text-sm text-gray-600">{option.description}</p>
                    <p className="text-sm font-medium text-[#6d031e] mt-1">{option.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-lg">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-800">{faq.question}</span>
                      {expandedFAQ === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {expandedFAQ === index && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Help */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our support team is here to help you with any questions or issues.
            </p>
            <div className="space-y-2">
              <Button className="w-full bg-[#6d031e] hover:bg-red-700">
                Contact Support Team
              </Button>
              <Button variant="outline" className="w-full">
                Submit Feedback
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Support Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monday - Friday:</span>
                <span className="font-medium">8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Saturday:</span>
                <span className="font-medium">9:00 AM - 4:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sunday:</span>
                <span className="font-medium">Closed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}