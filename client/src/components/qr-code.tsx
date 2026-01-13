import { useEffect, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  rawValue?: boolean; // If true, use the value directly without wrapping
}

export default function QRCode({ value, size = 128, rawValue = false }: QRCodeProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Use raw value directly or wrap in JSON for order QR codes
        const qrData = rawValue ? value : JSON.stringify({
          orderId: value,
          app: 'UB_FoodHub',
          timestamp: Date.now()
        });
        
        const qrCodeDataURL = await QRCodeLib.toDataURL(qrData, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        
        setQrCodeDataURL(qrCodeDataURL);
        setError('');
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    if (value) {
      generateQRCode();
    }
  }, [value, size, rawValue]);

  if (error) {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border-2 border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!qrCodeDataURL) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6d031e]"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
      <img 
        src={qrCodeDataURL} 
        alt={`QR Code for Order ${value}`}
        className="rounded"
        style={{ width: size, height: size }}
      />
    </div>
  );
}