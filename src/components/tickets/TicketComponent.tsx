import { useState, useEffect, useRef } from 'react';
import { Ticket } from '../../utils/tickets/ticketService';
import { generateQRCode } from '../../utils/tickets/qrGenerator';
import logo2 from '../../assets/images/logo2.svg';
import fondoBoletaParteAbajo from '../../assets/backgrounds/fondoboletaparteabajo.png';
import fondo5 from '../../assets/backgrounds/fondo5.svg';
import html2canvas from 'html2canvas';

interface TicketComponentProps {
  ticket: Ticket;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function TicketComponent({ ticket, onPrint, onDownload }: TicketComponentProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pre-cargar la imagen de fondo
    const img = new Image();
    img.src = fondoBoletaParteAbajo;
    img.onload = () => {
      setBackgroundLoaded(true);
    };
    img.onerror = () => {
      console.error('Error loading background image');
      setBackgroundLoaded(true); // Continuar aunque falle
    };
  }, []);

  useEffect(() => {
    // Generar QR code desde la URL guardada
    if (ticket.qr_code) {
      // Si ya es una data URL, usarla directamente
      if (ticket.qr_code.startsWith('data:image')) {
        setQrCodeImage(ticket.qr_code);
      } else {
        // Si es una URL, generar el QR
        generateQRCode(ticket.id, ticket.ticket_code)
          .then(setQrCodeImage)
          .catch(console.error);
      }
    }
  }, [ticket]);

  const formatDate = (dateString: string) => {
    // Manejar fechas en formato ISO (YYYY-MM-DD) sin problemas de timezone
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  };

  const handleDownload = async () => {
    if (!ticketRef.current) {
      console.error('Ticket ref not available');
      return;
    }

    if (!ticket || !ticket.ticket_code) {
      console.error('Ticket data not available:', ticket);
      alert('Error: No se pudo detectar la información del boleto. Por favor, intenta de nuevo.');
      return;
    }

    try {
      // Esperar a que la imagen de fondo se cargue
      if (!backgroundLoaded) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Esperar más tiempo para asegurar que todas las imágenes se hayan cargado
      await new Promise(resolve => setTimeout(resolve, 800));

      // Asegurar que todas las imágenes estén cargadas
      const images = ticketRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(reject, 10000);
          });
        })
      );

      // Pre-cargar la imagen de fondo explícitamente
      const bgImg = new Image();
      bgImg.src = fondoBoletaParteAbajo;
      await new Promise((resolve) => {
        if (bgImg.complete) {
          resolve(undefined);
        } else {
          bgImg.onload = () => resolve(undefined);
          bgImg.onerror = () => resolve(undefined);
          setTimeout(() => resolve(undefined), 5000);
        }
      });

      // Esperar un momento adicional para que todo se renderice
      await new Promise(resolve => setTimeout(resolve, 500));

      // Usar html2canvas con opciones mejoradas para mejor calidad
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#EEEEEE',
        scale: 3, // Aumentado de 2 a 3 para mejor resolución
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 20000,
        removeContainer: false,
        // Asegurar que las imágenes de fondo se capturen
        onclone: (clonedDoc) => {
          // Asegurar que los estilos se mantengan en el clon
          const clonedElement = clonedDoc.querySelector('[data-ticket-ref]') || clonedDoc.body;
          if (clonedElement) {
            clonedElement.style.transform = 'scale(1)';
            clonedElement.style.transformOrigin = 'top left';
          }
          
          // Asegurar que todas las imágenes de fondo se carguen
          const backgroundElements = clonedDoc.querySelectorAll('[style*="background-image"]');
          backgroundElements.forEach((el) => {
            const style = (el as HTMLElement).style;
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage.includes('url(')) {
              // Forzar el renderizado del fondo
              (el as HTMLElement).style.backgroundImage = bgImage;
            }
          });
        },
        // Mejorar el renderizado de fuentes
        letterRendering: true,
        // Mejorar el renderizado de imágenes
        foreignObjectRendering: false,
        // Asegurar que se capturen los fondos
        proxy: undefined,
      });

      // Convertir canvas a blob con mejor calidad
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob');
          alert('Error al generar la imagen. Por favor, intenta de nuevo.');
          return;
        }

        // Crear URL del blob
        const url = URL.createObjectURL(blob);
        
        // Crear elemento <a> para descargar
        const link = document.createElement('a');
        link.href = url;
        link.download = `boleta-${ticket.ticket_code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL después de un momento
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 100);

        // Llamar callback si existe
        if (onDownload) {
          onDownload();
        }
      }, 'image/png', 1.0); // Calidad máxima (1.0)
    } catch (error) {
      console.error('Error downloading ticket:', error);
      alert('Error al descargar la boleta. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="relative">
      {/* Contenedor del boleto con referencia para descarga - Diseño Figma */}
      <div 
        ref={ticketRef}
        data-ticket-ref="true"
        className="ticket-container relative w-[450px] h-[700px] mx-auto rounded-lg overflow-hidden shadow-2xl"
        style={{
          fontFamily: "'Montserrat Alternates', sans-serif",
          border: '3px solid #c61619',
          // Asegurar que las fuentes se rendericen correctamente
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
          // Mejorar el renderizado para PDF
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          colorAdjust: 'exact',
        }}
      >
        {/* Fondo negro superior con imagen - Sección principal del ticket */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-black relative overflow-hidden">
          {/* Imagen de fondo con overlay oscuro - Similar al diseño de Figma */}
          <div 
            className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.4,
            }}
          ></div>
          
          {/* Gradiente adicional para texto legible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"></div>
        </div>

        {/* Sección inferior blanca con patrón fondo5.svg */}
        <div className="absolute bottom-0 left-0 w-full h-[250px] bg-white overflow-hidden z-0">
        <div 
            className="absolute inset-0 flex items-center justify-center"
          style={{
              backgroundImage: `url(${fondo5})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.15,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            colorAdjust: 'exact',
          }}
        ></div>
        </div>

        {/* QR Code a la derecha - Más arriba para no interferir */}
        {qrCodeImage && (
          <div className="absolute right-8 top-[280px] w-[95px] h-[95px] flex items-center justify-center bg-white rounded-lg p-2 z-30 shadow-2xl border-2 border-gray-200">
            <img 
              src={qrCodeImage} 
              alt="QR Code" 
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              loading="eager"
            />
          </div>
        )}

        {/* Contenido principal - Sección oscura superior */}
        <div className="absolute left-0 top-0 w-full h-[450px] flex flex-col items-center gap-[20px] px-6 py-8 z-10">
          {/* Logo VELTLIX */}
          <div className="h-[30px] w-[140px] flex items-center justify-center">
            <img 
              src={logo2} 
              alt="VELTLIX" 
              className="h-full w-auto object-contain drop-shadow-lg"
              crossOrigin="anonymous"
              loading="eager"
            />
          </div>

          {/* Información del evento */}
          <div className="flex flex-col items-center gap-[8px] text-center text-white w-full mt-2">
            <h1 
              className="font-bold text-[26px] leading-tight tracking-tight drop-shadow-lg px-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {ticket.event_name}
            </h1>
            <p 
              className="text-[14px] leading-none text-white/80"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {`Date: ${formatDate(ticket.event_date)}`}
            </p>
          </div>

          {/* Código del ticket con diseño destacado - Más arriba */}
          <div className="flex flex-col gap-[4px] items-center w-full max-w-[320px] mt-3">
            <p 
              className="text-[14px] text-center text-white/70 font-medium"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Ticket
            </p>
            <div className="bg-gradient-to-r from-pink-500 via-[#c61619] to-pink-500 rounded-full px-[40px] py-2 shadow-2xl shadow-pink-500/50">
              <p 
                className="text-[20px] text-white text-center font-bold tracking-[4px]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {ticket.ticket_code}
              </p>
            </div>
          </div>

          {/* Asiento y Puerta - Diseño minimalista - Posicionados a la izquierda */}
          <div className="flex gap-[60px] items-start justify-start text-white w-full mt-6 pl-4">
            <div className="flex flex-col items-start">
              <p className="text-[10px] text-white/50 mb-0.5 tracking-wide">Seat</p>
              <p className="text-[16px] font-bold">{ticket.seat_number || 'XX'}</p>
            </div>
            <div className="flex flex-col items-start">
              <p className="text-[10px] text-white/50 mb-0.5 tracking-wide">Gate</p>
              <p className="text-[16px] font-bold">{ticket.gate_number || 'XX'}</p>
            </div>
          </div>

          {/* Clase y validación - En la parte inferior */}
          <div className="flex gap-[40px] items-center justify-center text-[9px] text-center text-white/50 w-full mt-auto mb-4">
            <div>
              <p className="leading-none font-medium tracking-widest">
                CLASS: {ticket.ticket_class || 'VIP'}
              </p>
            </div>
            <div>
              <p className="leading-none font-medium tracking-widest">VALID FOR ONLY 1 PERSON</p>
            </div>
          </div>
        </div>

        {/* Sección inferior - Información del comprador - Ajustada y compacta */}
        <div className="absolute left-0 top-[465px] w-full px-6 py-4 flex flex-col gap-[8px] z-10">
          <h2 
            className="text-[12px] font-bold text-gray-800 tracking-[2px] mb-1"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '2px' }}
          >
            DETAILS INFORMATION
          </h2>
          
          {/* Grid de dos columnas - Más compacto y sin interferir con QR */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-w-[340px]">
            <div className="overflow-hidden">
              <div className="text-[10px] text-gray-500 font-semibold mb-1 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                FULL NAME
          </div>
          <p 
                className="text-[12px] text-gray-900 font-medium truncate"
                style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {ticket.buyer_full_name}
          </p>
            </div>
          
            <div className="overflow-hidden">
              <div className="text-[10px] text-gray-500 font-semibold mb-1 tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
                FULL ADDRESS
          </div>
          <p 
                className="text-[12px] text-gray-900 font-medium line-clamp-2 leading-tight"
                style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {ticket.buyer_address || 'N/A'}
          </p>
            </div>
          </div>
          
          {/* Nota sobre el PIN - Sin revelar el número */}
            <div 
            className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg max-w-[340px]"
          >
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-[10px] text-blue-800 font-bold mb-1">🔒 PIN DE SEGURIDAD</p>
                <p className="text-[9px] text-blue-700 leading-tight">
                  Tu PIN de 4 dígitos fue enviado a tu correo electrónico. Preséntalo al ingresar al evento.
            </p>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-8 flex gap-4 justify-center print:hidden">
        {onPrint && (
          <button
            onClick={onPrint}
            className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-black/80 transition-colors border border-white/20"
          >
            Imprimir Boleta
          </button>
        )}
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-black/80 transition-colors border border-white/20"
        >
          Descargar Boleta
        </button>
      </div>

      {/* Estilos para impresión mejorada */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          
          body * {
            visibility: hidden;
          }
          
          .ticket-container,
          .ticket-container * {
            visibility: visible;
          }
          
          .ticket-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          
          /* Asegurar que las imágenes se impriman correctamente */
          img {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          
          /* Asegurar que los fondos se impriman */
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
