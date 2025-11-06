import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import jsQR from 'jsqr';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (orderId: string) => void;
}

export default function QRScanner({ isOpen, onClose, onScan }: QRScannerProps) {
  const [manualOrderId, setManualOrderId] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);

  const scanQRCode = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data from canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code
    const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

    if (qrCode) {
      // QR code detected!
      scanningRef.current = false;
      setIsProcessing(true);
      setScanResult({ success: true, message: 'QR Code detected! Processing...' });
      
      try {
        // Try to parse as JSON first (in case it's a full QR code)
        const parsed = JSON.parse(qrCode.data);
        if (parsed.orderId) {
          // Simulate brief processing time for better UX
          setTimeout(() => {
            onScan(parsed.orderId);
            setScanResult({ success: true, message: 'Order verified successfully!' });
            setTimeout(() => {
              stopCamera();
              onClose();
              setScanResult(null);
              setIsProcessing(false);
            }, 1200);
          }, 800);
          return;
        }
      } catch (e) {
        // Not JSON, treat as plain order ID
      }
      
      // Handle plain order ID
      setTimeout(() => {
        onScan(qrCode.data.trim());
        setScanResult({ success: true, message: 'Order verified successfully!' });
        setTimeout(() => {
          stopCamera();
          onClose();
          setScanResult(null);
          setIsProcessing(false);
        }, 1200);
      }, 800);
    } else {
      // Continue scanning
      requestAnimationFrame(scanQRCode);
    }
  }, [onScan, onClose]);

  const startCamera = async () => {
    try {
      setIsScanning(true);
      setScanResult(null);
      
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
        
        // Start QR code scanning
        scanningRef.current = true;
        scanQRCode();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        success: false,
        message: 'Camera access denied. Please use manual entry or enable camera permissions.'
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualOrderId.trim()) {
      setIsProcessing(true);
      setScanResult({ success: true, message: 'Processing order ID...' });
      
      try {
        // Try to parse as JSON first (in case it's a full QR code)
        const parsed = JSON.parse(manualOrderId);
        if (parsed.orderId) {
          setTimeout(() => {
            onScan(parsed.orderId);
            setScanResult({ success: true, message: 'Order verified successfully!' });
            setTimeout(() => {
              onClose();
              setManualOrderId('');
              setScanResult(null);
              setIsProcessing(false);
            }, 1200);
          }, 600);
          return;
        }
      } catch (e) {
        // Not JSON, treat as plain order ID
      }
      
      // Handle plain order ID
      setTimeout(() => {
        onScan(manualOrderId.trim());
        setScanResult({ success: true, message: 'Order verified successfully!' });
        setTimeout(() => {
          onClose();
          setManualOrderId('');
          setScanResult(null);
          setIsProcessing(false);
        }, 1200);
      }, 600);
    }
  };

  const handleClose = () => {
    // Prevent closing while processing
    if (isProcessing) return;
    
    stopCamera();
    onClose();
    setManualOrderId('');
    setScanResult(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Order QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Manual Entry Section - Primary Method */}
          <div className="space-y-3">
            <Label htmlFor="manual-order" className="text-base font-medium">Order ID Entry (Recommended)</Label>
            <div className="flex gap-2">
              <Input
                id="manual-order"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g. ORD001)"
                className="flex-1"
              />
              <Button onClick={handleManualSubmit} disabled={!manualOrderId.trim() || isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  'Verify Order'
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-600">
              Ask the student for their Order ID from their order confirmation or orders page
            </p>
          </div>

          {/* Camera Section */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              {!isScanning ? (
                <div className="text-center">
                  <Button onClick={startCamera} variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera Scanning
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Point your camera at the QR code to automatically scan
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
                    {/* Hidden canvas for QR scanning */}
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    {/* QR code overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg">
                        <div className="w-full h-full border border-white/50 rounded-lg flex items-center justify-center">
                          <p className="text-white text-sm text-center">
                            Align QR code here<br/>
                            <span className="text-xs">Scanning automatically...</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Scanning indicator */}
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      {isProcessing ? 'Processing...' : 'Scanning...'}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={stopCamera} variant="outline" className="w-full" disabled={isProcessing}>
                      <X className="w-4 h-4 mr-2" />
                      {isProcessing ? 'Processing...' : 'Stop Camera'}
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
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              ) : scanResult.success ? (
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
              Use the camera to automatically scan the QR code, or enter the Order ID manually as a fallback.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}