/**
 * IMPORTANTE: Este archivo contiene datos MOCK para desarrollo local.
 * 
 * En producción, la aplicación usa eventos de la base de datos Supabase.
 * Los mockEvents sirven como:
 * 1. Fallback si la BD no está disponible
 * 2. Datos de desarrollo local sin necesidad de BD
 * 3. Testing y desarrollo offline
 * 
 * Para alternar entre BD y mock:
 * - Producción: Siempre usa BD
 * - Desarrollo: Controlado por VITE_USE_DATABASE (true por defecto)
 * 
 * Los datos en mockEvents corresponden a los 20 eventos iniciales
 * insertados en la migración 004_create_events_table.sql
 */

export interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  price: string;
  image: string;
  category: string;
  featured?: boolean;
  trending?: boolean;
  soldOut?: boolean;
  lastTickets?: boolean;
}

export const mockEvents: Event[] = [
  // ★ EVENTO PRIORITARIO - Open Salinas California
  {
    id: 1,
    title: "Open Salinas California - Conferencia Vicion Power",
    date: "14 de Marzo, 2026",
    location: "940 N Main ST, Salinas, CA 93906",
    price: "$20 USD",
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
    category: "Conferencia",
    featured: true,
    trending: true,
  },
  {
    id: 2,
    title: "Rock Fest 2026 - Arena Tour",
    date: "18 de Abril, 2026",
    location: "Madison Square Garden, New York",
    price: "$1,200 USD",
    image: "https://images.unsplash.com/photo-1648260029310-5f1da359af9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHN8ZW58MXx8fHwxNzYxNzEyMDg1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Concierto",
    featured: true,
    trending: true,
  },
  {
    id: 3,
    title: "Festival de Música Electrónica 2026",
    date: "10 de Mayo, 2026",
    location: "Parque Fundidora, Monterrey",
    price: "$950 USD",
    image: "https://images.unsplash.com/photo-1727096857692-e9dadf2bc92e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGZlc3RpdmFsJTIwc3RhZ2V8ZW58MXx8fHwxNzYxNzcwMDYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Festival",
    featured: true,
    lastTickets: true,
  },
  {
    id: 4,
    title: "Final de Basketball - Campeonato Nacional 2026",
    date: "22 de Junio, 2026",
    location: "Crypto.com Arena, Los Angeles",
    price: "$800 USD",
    image: "https://images.unsplash.com/photo-1616353352910-15d970ac020b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwZ2FtZXxlbnwxfHx8fDE3NjE3NjcxMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Deportes",
    trending: true,
  },
  {
    id: 5,
    title: "El Fantasma de la Ópera 2026",
    date: "5 de Abril, 2026",
    location: "Palacio de Bellas Artes, CDMX",
    price: "$1,500 USD",
    image: "https://images.unsplash.com/photo-1523059623039-a9ed027e7fad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVyYSUyMGhvdXNlfGVufDF8fHx8MTc2MTc5ODc0MXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Teatro",
    featured: true,
  },
  {
    id: 6,
    title: "Stand Up Comedy Night 2026",
    date: "28 de Marzo, 2026",
    location: "Teatro Metropolitano, CDMX",
    price: "$450 USD",
    image: "https://images.unsplash.com/photo-1534205959792-cccfa9f7f26e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21lZHklMjBzaG93fGVufDF8fHx8MTc2MTcxNTc0M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Comedia",
    trending: true,
  },
  {
    id: 7,
    title: "Fútbol: Clásico Nacional 2026",
    date: "15 de Agosto, 2026",
    location: "Estadio Azteca, CDMX",
    price: "$1,800 USD",
    image: "https://images.unsplash.com/photo-1565483276060-e6730c0cc6a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzdGFkaXVtfGVufDF8fHx8MTc2MTc5ODIxN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Deportes",
    featured: true,
  },
  {
    id: 8,
    title: "Obra de Teatro: Romeo y Julieta 2026",
    date: "12 de Julio, 2026",
    location: "Teatro Juárez, Guadalajara",
    price: "$550 USD",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2V8ZW58MXx8fHwxNzYxNzMzMjg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Teatro",
  },
  {
    id: 9,
    title: "Jazz Night - Leyendas del Jazz 2026",
    date: "20 de Marzo, 2026",
    location: "Auditorio Nacional, CDMX",
    price: "$890 USD",
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwY29uY2VydHxlbnwxfHx8fDE3NjE3OTk3Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Concierto",
    featured: true,
  },
  {
    id: 10,
    title: "Boxeo: Campeonato Mundial 2026",
    date: "8 de Mayo, 2026",
    location: "Arena Monterrey",
    price: "$2,200 USD",
    image: "https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib3hpbmclMjBtYXRjaHxlbnwxfHx8fDE3NjE3NzIyODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Deportes",
    trending: true,
    lastTickets: true,
  },
  {
    id: 11,
    title: "Ballet Folklórico Internacional 2026",
    date: "25 de Abril, 2026",
    location: "Palacio de Bellas Artes, CDMX",
    price: "$750 USD",
    image: "https://images.unsplash.com/photo-1718908721930-31120bc1beb5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYW5jZSUyMHBlcmZvcm1hbmNlfGVufDF8fHx8MTc2MTc1NDE0NXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Danza",
  },
  {
    id: 12,
    title: "Festival Gastronómico Internacional 2026",
    date: "6 de Junio, 2026",
    location: "Centro Histórico, Guadalajara",
    price: "$350 USD",
    image: "https://images.unsplash.com/photo-1678646142794-253fdd20fa05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZmVzdGl2YWx8ZW58MXx8fHwxNzYxNzQ3MTkwfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Familia",
    trending: true,
  },
  {
    id: 13,
    title: "Exposición de Arte Moderno 2026",
    date: "Hasta 30 de Septiembre, 2026",
    location: "Museo de Arte Moderno, CDMX",
    price: "$200 USD",
    image: "https://images.unsplash.com/photo-1600903781679-7ea3cbc564c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBleGhpYml0aW9ufGVufDF8fHx8MTc2MTc5OTc3OXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Arte",
  },
  {
    id: 14,
    title: "Tenis: ATP Tour Finals 2026",
    date: "18 de Octubre, 2026",
    location: "Club Deportivo, Guadalajara",
    price: "$1,100 USD",
    image: "https://images.unsplash.com/photo-1480180566821-a7d525cdfc5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW5uaXMlMjB0b3VybmFtZW50fGVufDF8fHx8MTc2MTc5OTc3OXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Deportes",
  },
  {
    id: 15,
    title: "Pop Latino Tour 2026",
    date: "30 de Mayo, 2026",
    location: "Foro Sol, CDMX",
    price: "$1,350 USD",
    image: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwY29uY2VydHxlbnwxfHx8fDE3NjE2OTgyMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Concierto",
    featured: true,
    trending: true,
  },
  {
    id: 16,
    title: "Circo del Sol - Alegría 2026",
    date: "14 de Agosto, 2026",
    location: "Carpa Circuito Interior, CDMX",
    price: "$980 USD",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2V8ZW58MXx8fHwxNzYxNzMzMjg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Familia",
    featured: true,
  },
  {
    id: 17,
    title: "Indie Rock Festival 2026",
    date: "4 de Julio, 2026",
    location: "Autódromo Hermanos Rodríguez, CDMX",
    price: "$1,050 USD",
    image: "https://images.unsplash.com/photo-1648260029310-5f1da359af9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwY3Jvd2QlMjBsaWdodHN8ZW58MXx8fHwxNzYxNzEyMDg1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Festival",
    trending: true,
  },
  {
    id: 18,
    title: "Musical: El Rey León 2026",
    date: "20 de Septiembre, 2026",
    location: "Teatro Telcel, CDMX",
    price: "$1,650 USD",
    image: "https://images.unsplash.com/photo-1503095396549-807759245b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2V8ZW58MXx8fHwxNzYxNzMzMjg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Teatro",
    lastTickets: true,
  },
  {
    id: 19,
    title: "Reggaeton & Trap Party 2026",
    date: "16 de Abril, 2026",
    location: "Arena Monterrey",
    price: "$850 USD",
    image: "https://images.unsplash.com/photo-1727096857692-e9dadf2bc92e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGZlc3RpdmFsJTIwc3RhZ2V8ZW58MXx8fHwxNzYxNzcwMDYzfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Concierto",
  },
  {
    id: 20,
    title: "Lucha Libre - Gran Final 2026",
    date: "9 de Noviembre, 2026",
    location: "Arena Los Angeles, LA",
    price: "$400 USD",
    image: "https://images.unsplash.com/photo-1616353352910-15d970ac020b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwZ2FtZXxlbnwxfHx8fDE3NjE3NjcxMDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "Deportes",
    trending: true,
  },
];

export const categories = [
  { name: "all", label: "Todos" },
  { name: "Concierto", label: "Conciertos" },
  { name: "Deportes", label: "Deportes" },
  { name: "Teatro", label: "Teatro" },
  { name: "Festival", label: "Festivales" },
  { name: "Familia", label: "Familia" },
  { name: "Comedia", label: "Comedia" },
  { name: "Danza", label: "Danza" },
  { name: "Arte", label: "Arte" },
  { name: "Conferencia", label: "Conferencias" },
];
