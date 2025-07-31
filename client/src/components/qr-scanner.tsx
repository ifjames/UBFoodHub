import { useState, useRef } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (orderId: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [manualOrderId, setManualOrderId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        success: false,
        message: 'Camera access denied. Please use manual entry or enable camera permissions.'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualOrderId.trim()) {
      try {
        // Try to parse as JSON first (in case it's a full QR code)
        const parsed = JSON.parse(manualOrderId);
        if (parsed.orderId) {
          onScan(parsed.orderId);
          setScanResult({ success: true, message: 'Order ID processed successfully!' });
          setTimeout(() => {
            onClose();
            setManualOrderId('');
            setScanResult(null);
          }, 1500);
          return;
        }
      } catch (e) {
        // Not JSON, treat as plain order ID
      }
      
      // Handle plain order ID
      onScan(manualOrderId.trim());
      setScanResult({ success: true, message: 'Order ID processed successfully!' });
      setTimeout(() => {
        onClose();
        setManualOrderId('');
        setScanResult(null);
      }, 1500);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    setManualOrderId('');
    setScanResult(null);
  };

  // Simulate QR code detection (in a real implementation, you'd use a QR library like jsQR)
  const simulateQRDetection = () => {
    // This is a placeholder for actual QR code detection
    // In a real implementation, you would:
    // 1. Capture frames from the video
    // 2. Use a library like jsQR to detect QR codes
    // 3. Parse the QR code data
    
    // For now, we'll provide manual entry as the primary method
    setScanResult({
      success: false,
      message: 'QR scanning requires additional setup. Please use manual entry for now.'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Order QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Manual Entry Section */}
          <div className="space-y-3">
            <Label htmlFor="manual-order">Manual Order ID Entry</Label>
            <div className="flex gap-2">
              <Input
                id="manual-order"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value)}
                placeholder="Enter Order ID or scan data"
                className="flex-1"
              />
              <Button onClick={handleManualSubmit} disabled={!manualOrderId.trim()}>
                Verify
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              Enter the Order ID manually or paste QR code data
            </p>
          </div>

          {/* Camera Section */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              {!isScanning ? (
                <div className="text-center">
                  <Button onClick={startCamera} variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Use Camera to Scan
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Experimental: Camera scanning may require additional permissions
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      playsInline
                      muted
                    />
                    {/* QR code overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg">
                        <div className="w-full h-full border border-white/50 rounded-lg flex items-center justify-center">
                          <p className="text-white text-sm">Align QR code here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={simulateQRDetection} className="flex-1">
                      Detect QR Code
                    </Button>
                    <Button onClick={stopCamera} variant="outline">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {scanResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              scanResult.success ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
            }`}>
              {scanResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <p className="text-sm">{scanResult.message}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              <strong>Instructions:</strong> Students should show you their QR code from the Orders page. 
              Enter the Order ID manually or use the camera to scan the QR code.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}