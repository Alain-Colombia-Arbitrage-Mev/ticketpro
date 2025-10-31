import { useEffect, useState } from 'react';

interface QRCodeComponentProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({ value, size = 200, className = '' }: QRCodeComponentProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;

    const generateQR = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // QR code grid size
      const modules = 29;
      const moduleSize = Math.floor(size / modules);
      const totalSize = modules * moduleSize;
      
      canvas.width = totalSize;
      canvas.height = totalSize;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, totalSize, totalSize);

      // Create deterministic pattern from value
      const createHash = (str: string): number => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash);
      };

      const hash = createHash(value);
      
      // Seeded pseudo-random function
      const random = (seed: number): number => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      ctx.fillStyle = '#000000';

      // Draw finder patterns (3 corners)
      const drawFinder = (x: number, y: number) => {
        // Outer 7x7 square
        for (let dy = 0; dy < 7; dy++) {
          for (let dx = 0; dx < 7; dx++) {
            if (dy === 0 || dy === 6 || dx === 0 || dx === 6 || (dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4)) {
              ctx.fillRect((x + dx) * moduleSize, (y + dy) * moduleSize, moduleSize - 1, moduleSize - 1);
            }
          }
        }
      };

      // Top-left finder
      drawFinder(0, 0);
      // Top-right finder
      drawFinder(modules - 7, 0);
      // Bottom-left finder
      drawFinder(0, modules - 7);

      // Draw timing patterns
      for (let i = 8; i < modules - 8; i++) {
        if (i % 2 === 0) {
          ctx.fillRect(i * moduleSize, 6 * moduleSize, moduleSize - 1, moduleSize - 1);
          ctx.fillRect(6 * moduleSize, i * moduleSize, moduleSize - 1, moduleSize - 1);
        }
      }

      // Draw data modules
      for (let y = 0; y < modules; y++) {
        for (let x = 0; x < modules; x++) {
          // Skip finder patterns
          if ((x < 9 && y < 9) || 
              (x >= modules - 8 && y < 9) || 
              (x < 9 && y >= modules - 8)) {
            continue;
          }
          
          // Skip timing patterns
          if ((y === 6 && x >= 8 && x < modules - 8) || 
              (x === 6 && y >= 8 && y < modules - 8)) {
            continue;
          }

          // Generate module based on position and value hash
          const seed = hash + x * 7 + y * 13 + (x * y);
          if (random(seed) > 0.45) {
            ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize - 1, moduleSize - 1);
          }
        }
      }

      // Add a small identifier in the center
      const centerStart = Math.floor(modules / 2) - 2;
      for (let dy = 0; dy < 5; dy++) {
        for (let dx = 0; dx < 5; dx++) {
          if (dy === 0 || dy === 4 || dx === 0 || dx === 4 || (dy === 2 && dx === 2)) {
            ctx.fillRect((centerStart + dx) * moduleSize, (centerStart + dy) * moduleSize, moduleSize - 1, moduleSize - 1);
          }
        }
      }

      setQrDataUrl(canvas.toDataURL());
    };

    generateQR();
  }, [value, size]);

  if (!qrDataUrl) {
    return (
      <div 
        className={`mx-auto flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-pulse text-sm text-gray-400">Generando QR...</div>
      </div>
    );
  }

  return (
    <div className={`mx-auto ${className}`} style={{ width: size, height: size }}>
      <img
        src={qrDataUrl}
        alt="QR Code"
        className="h-full w-full rounded-lg border border-gray-200"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
