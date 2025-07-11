interface QRCodeProps {
  value: string;
  size?: number;
}

export default function QRCode({ value, size = 128 }: QRCodeProps) {
  // For now, we'll use a placeholder that could be replaced with an actual QR code library
  // This creates a simple visual representation
  const generateQRPattern = (text: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = size;
    canvas.height = size;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Simple pattern based on text
    ctx.fillStyle = '#000000';
    const cellSize = size / 20;
    
    for (let x = 0; x < 20; x++) {
      for (let y = 0; y < 20; y++) {
        const char = text.charCodeAt((x + y) % text.length);
        if (char % 2 === 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
    
    return canvas.toDataURL();
  };

  return (
    <div className="flex items-center justify-center p-4 bg-white rounded-lg border-2 border-gray-200">
      <div 
        className="bg-white rounded border"
        style={{
          width: size,
          height: size,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
              <rect width="${size}" height="${size}" fill="white"/>
              <g fill="black">
                ${Array.from({ length: 15 }, (_, i) => 
                  Array.from({ length: 15 }, (_, j) => {
                    const shouldFill = (value.charCodeAt((i + j) % value.length) + i + j) % 3 === 0;
                    return shouldFill ? `<rect x="${j * (size / 15)}" y="${i * (size / 15)}" width="${size / 15}" height="${size / 15}"/>` : '';
                  }).join('')
                ).join('')}
              </g>
            </svg>
          `)}")`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center'
        }}
      />
    </div>
  );
}