import { useState, useEffect, useRef } from 'react';
import { Ticket } from '../../utils/tickets/ticketService';
import { generateQRCode } from '../../utils/tickets/qrGenerator';
import logo2 from '../../assets/images/logo2.svg';
import fondoBoletaParteAbajo from '../../assets/backgrounds/fondoboletaparteabajo.png';
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
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
      {/* Contenedor del boleto con referencia para descarga - Tamaño reducido */}
      <div 
        ref={ticketRef}
        data-ticket-ref="true"
        className="ticket-container relative w-[400px] h-[750px] bg-[#EEEEEE] mx-auto"
        style={{
          fontFamily: "'Montserrat Alternates', sans-serif",
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
        {/* Fondo base */}
        <div className="absolute inset-0 bg-[#EEEEEE]"></div>

        {/* Fondo negro superior - Sección principal del ticket */}
        <div className="absolute top-0 left-0 w-full h-[420px] bg-black">
          {/* Patrón decorativo de fondo en sección negra */}
          <div 
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage: `
                radial-gradient(circle at 10px 10px, rgba(255,255,255,0.1) 1px, transparent 0),
                radial-gradient(circle at 30px 30px, rgba(255,255,255,0.05) 1px, transparent 0)
              `,
              backgroundSize: '40px 40px, 60px 60px',
            }}
          ></div>
          
          {/* Watermark decorativo grande en fondo negro */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)`,
              backgroundSize: '200px 200px',
              backgroundPosition: 'center',
            }}
          ></div>
        </div>

        {/* Patrón decorativo de fondo en sección inferior - Imagen de fondo */}
        <div 
          className="absolute bottom-0 left-0 w-full h-[330px] overflow-hidden z-0"
          style={{
            backgroundImage: `url(${fondoBoletaParteAbajo})`,
            backgroundSize: '120px 120px',
            backgroundPosition: '0 0',
            backgroundRepeat: 'repeat',
            opacity: 0.5,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
            colorAdjust: 'exact',
          }}
        ></div>

        {/* Línea divisoria decorativa (perforada) */}
        <div 
          className="absolute left-[22px] top-[420px] w-[356px] h-[1px] border-t-2 border-dashed border-black/30"
        ></div>

        {/* QR Code - Esquina superior derecha (centrado verticalmente) */}
        {qrCodeImage && (
          <div className="absolute right-[20px] top-[50%] -translate-y-1/2 w-[80px] h-[80px] flex items-center justify-center bg-white rounded-lg p-2 z-20">
            <img 
              src={qrCodeImage} 
              alt="QR Code" 
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              loading="eager"
            />
          </div>
        )}

        {/* Contenido principal - Sección negra superior */}
        <div className="absolute left-0 top-0 w-full h-[420px] flex flex-col items-center gap-[18px] px-4 py-6">
          {/* Logo */}
          <div className="h-[22px] w-[114px] flex items-center justify-center">
            <img 
              src={logo2} 
              alt="vetlix.com" 
              className="h-full w-auto object-contain"
              crossOrigin="anonymous"
              loading="eager"
            />
          </div>

          {/* Información del evento */}
          <div className="flex flex-col items-center gap-[12px] text-center text-white w-full max-w-[250px]">
            <h1 
              className="font-['Montserrat_Alternates',sans-serif] text-[23px] font-normal leading-tight"
              style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}
            >
              {ticket.event_name}
            </h1>
            <p 
              className="font-['Germania_One',sans-serif] text-[17px] leading-none"
              style={{ fontFamily: "'Germania One', sans-serif" }}
            >
              {`Date: ${formatDate(ticket.event_date)}`}
            </p>
          </div>

          {/* Código del ticket */}
          <div className="flex flex-col gap-[2px] items-center w-full max-w-[193px]">
            <p 
              className="font-['Montserrat_Alternates',sans-serif] text-[14px] text-center text-white leading-none"
              style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}
            >
              Ticket #
            </p>
            <div className="bg-[#c61619] rounded-[8px] px-[30px] py-1 h-[32px] flex items-center justify-center w-full">
              <p 
                className="font-['Germania_One',sans-serif] text-[23px] text-white text-center leading-none"
                style={{ fontFamily: "'Germania One', sans-serif" }}
              >
                {ticket.ticket_code}
              </p>
            </div>
          </div>

          {/* Asiento y Puerta */}
          <div className="flex gap-[44px] items-center justify-center font-['Montserrat_Alternates',sans-serif] text-[20px] text-center text-white w-full">
            <div className="w-[65px]">
              <p className="leading-none">Seat: {ticket.seat_number || 'N/A'}</p>
            </div>
            <div className="w-[65px]">
              <p className="leading-none">Gate: {ticket.gate_number || 'N/A'}</p>
            </div>
          </div>

          {/* Clase y validación */}
          <div className="flex gap-[28px] items-center justify-center font-['Montserrat_Alternates',sans-serif] text-[14px] text-center text-white w-full">
            <div className="w-[150px]">
              <p className="leading-none">
                CLASS: {ticket.ticket_class || 'VIP'}
              </p>
            </div>
            <div className="w-[170px]">
              <p className="leading-none text-[12px]">Valid for Only 1 Person</p>
            </div>
          </div>
        </div>

        {/* Información del comprador (sección inferior - centrada verticalmente) */}
        <div className="absolute left-[30px] top-[450px] flex flex-col gap-[10px] items-start justify-center text-black w-[340px] z-10">
          <h2 
            className="font-['Germania_One',sans-serif] text-[17px] leading-none font-bold"
            style={{ fontFamily: "'Germania One', sans-serif" }}
          >
            DETAILS INFORMATION
          </h2>
          
          <div className="font-['Germania_One',sans-serif] text-[17px] leading-none font-bold">
            Full name
          </div>
          <p 
            className="font-['Montserrat_Alternates',sans-serif] text-[17px] leading-none"
            style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}
          >
            {ticket.buyer_full_name}
          </p>
          
          <div 
            className="font-['Germania_One',sans-serif] text-[17px] leading-none font-bold mt-1"
            style={{ fontFamily: "'Germania One', sans-serif" }}
          >
            Full Address
          </div>
          <p 
            className="font-['Montserrat_Alternates',sans-serif] text-[17px] leading-none break-words"
            style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}
          >
            {ticket.buyer_address || 'N/A'}
          </p>
          
          <div 
            className="font-['Germania_One',sans-serif] text-[17px] leading-none font-bold mt-1"
            style={{ fontFamily: "'Germania One', sans-serif" }}
          >
            CODE: {ticket.ticket_code}
          </div>
          
          {/* PIN oculto - texto muy pequeño y discreto */}
          {ticket.pin && (
            <div 
              className="mt-2 opacity-30"
              style={{
                fontFamily: "'Montserrat Alternates', sans-serif",
                fontSize: '10px',
                letterSpacing: '2px',
                color: '#666',
                userSelect: 'text'
              }}
            >
              PIN: {ticket.pin}
            </div>
          )}
        </div>

        {/* QR Code - Parte inferior (centrado verticalmente en sección inferior, alineado a la derecha) */}
        {qrCodeImage && (
          <div className="absolute right-[20px] top-[calc(420px+(330px/2)-54px)] w-[108px] h-[108px] flex items-center justify-center bg-white rounded-lg p-2 z-10">
            <img 
              src={qrCodeImage} 
              alt="QR Code" 
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              loading="eager"
            />
          </div>
        )}

        {/* Texto "Scan for Valid" debajo del QR */}
        {qrCodeImage && (
          <div className="absolute right-[20px] top-[calc(420px+(330px/2)+70px)] w-[108px] h-[28px] flex items-center justify-center z-10">
            <p 
              className="font-['Montserrat_Alternates',sans-serif] text-[14px] text-black text-center"
              style={{ fontFamily: "'Montserrat Alternates', sans-serif" }}
            >
              Scan for Valid
            </p>
          </div>
        )}


        {/* Watermark VIP en sección inferior (opcional) */}
        <div 
          className="absolute right-[20px] top-[480px] opacity-[0.05]"
          style={{
            fontFamily: "'Germania One', sans-serif",
            fontSize: '120px',
            color: 'black',
            fontWeight: 'bold',
            transform: 'rotate(0deg)',
            pointerEvents: 'none',
          }}
        >
          {ticket.ticket_class || 'VIP'}
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
