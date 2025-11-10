import { useState, useEffect } from 'react';
import { Ticket } from '../../utils/tickets/ticketService';
import { generateQRCode } from '../../utils/tickets/qrGenerator';
import logo2 from '../../assets/images/logo2.svg';

interface TicketComponentProps {
  ticket: Ticket;
  onPrint?: () => void;
}

export function TicketComponent({ ticket, onPrint }: TicketComponentProps) {
  const [qrCodeImage, setQrCodeImage] = useState<string>('');

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

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="relative w-full max-w-[810px] mx-auto bg-[#EEEEEE] p-8 md:p-12 min-h-[858px]">
      {/* Fondo decorativo con patrón */}
      <div className="absolute inset-0 bg-[#EEEEEE] overflow-hidden">
        {/* Patrón decorativo de fondo */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center gap-9 pt-8">
        {/* Logo */}
        <div className="h-[45px] w-auto">
          <img 
            src={logo2} 
            alt="vetlix.com" 
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Información del evento */}
        <div className="flex flex-col items-center gap-7 text-center text-white">
          <h1 className="font-montserrat text-[55px] font-normal leading-none">
            {ticket.event_name}
          </h1>
          <p className="font-germania text-[40px] leading-none whitespace-pre-wrap">
            {`Date: ${formatDate(ticket.event_date)}`}
            {ticket.event_time ? `\nTime: ${formatTime(ticket.event_time)}` : ''}
          </p>
        </div>

        {/* Código del ticket */}
        <div className="flex flex-col gap-1.5 items-start w-full max-w-[386px]">
          <p className="font-montserrat text-[32px] text-center text-white w-full">
            Ticket #
          </p>
          <div className="bg-[#c61619] rounded-[20px] px-[73px] py-1 h-[76px] flex items-center justify-center w-full">
            <p className="font-germania text-[55px] text-white text-center leading-none">
              {ticket.ticket_code}
            </p>
          </div>
        </div>

        {/* Asiento y Puerta */}
        <div className="flex gap-[104px] items-center font-montserrat text-[48px] text-center text-white">
          {ticket.seat_number && (
            <div className="w-[141px]">
              <p className="leading-none">Seat: {ticket.seat_number}</p>
            </div>
          )}
          {ticket.gate_number && (
            <div className="w-[141px]">
              <p className="leading-none">Gate: {ticket.gate_number}</p>
            </div>
          )}
        </div>

        {/* Clase y validación */}
        <div className="flex gap-[68px] items-center font-montserrat text-[32px] text-center text-white w-full">
          {ticket.ticket_class && (
            <div className="w-[350px]">
              <p className="leading-none">CLASS: {ticket.ticket_class}</p>
            </div>
          )}
          <div className="w-[392px]">
            <p className="leading-none">Valid for Only 1 Person</p>
          </div>
        </div>

        {/* QR Code */}
        {qrCodeImage && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <img 
              src={qrCodeImage} 
              alt="QR Code" 
              className="w-[200px] h-[200px]"
            />
          </div>
        )}
      </div>

      {/* Información del comprador (lado izquierdo) */}
      <div className="absolute left-0 top-0 flex flex-col gap-5 items-start text-black w-[472px] mt-8 ml-8">
        <h2 className="font-germania text-[40px] leading-none">
          DETAILS INFORMATION
        </h2>
        
        <div className="font-germania text-[40px] leading-none">
          Full name
        </div>
        <p className="font-montserrat text-[40px] leading-none">
          {ticket.buyer_full_name}
        </p>
        
        {ticket.buyer_address && (
          <>
            <div className="font-germania text-[40px] leading-none whitespace-pre">
              Full Address
            </div>
            <p className="font-montserrat text-[40px] leading-none">
              {ticket.buyer_address}
            </p>
          </>
        )}
        
        <div className="font-germania text-[40px] leading-none">
          CODE: {ticket.ticket_code}
        </div>
      </div>

      {/* Botón de impresión */}
      {onPrint && (
        <div className="mt-8 text-center">
          <button
            onClick={onPrint}
            className="px-6 py-3 bg-[#c61619] text-white rounded-lg font-semibold hover:bg-[#a01316] transition-colors"
          >
            Imprimir Boleta
          </button>
        </div>
      )}
    </div>
  );
}

