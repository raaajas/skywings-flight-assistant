import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Flight } from "@/types";

interface FlightResultCardProps {
  flights: Flight[];
  onBookFlight?: (msg: string) => void;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatCabin(cabin: string): string {
  return cabin.replace(/_/g, " ");
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === "INR") {
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

export function FlightResultCard({ flights, onBookFlight }: FlightResultCardProps) {
  if (!flights.length) {
    return null;
  }

  return (
    <div className="space-y-4 w-full">
      {flights.map((flight) => {
        const lowSeats = flight.availableSeats <= 5;
        const criticalSeats = flight.availableSeats <= 2;
        
        return (
          <Card 
            key={flight.id} 
            className="overflow-hidden glass-panel border border-white/5 rounded-2xl hover:border-primary/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 group animate-fade-in"
          >
            <CardHeader className="pb-3 border-b border-white/5 bg-slate-900/20">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/10 p-1.5 border border-primary/20">
                    <Plane className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black text-white tracking-wide">{flight.flightNumber}</CardTitle>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{flight.airline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-black text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
                    {formatCurrency(flight.price, flight.currency)}
                  </span>
                  {onBookFlight && (
                    <button
                      onClick={() => onBookFlight(`Book flight ${flight.flightNumber}`)}
                      className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 active:scale-[0.93] shadow-md shadow-indigo-600/20 active:translate-y-0"
                    >
                      Book Ticket
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Route Map Grid */}
              <div className="flex items-center justify-between gap-2 px-2">
                <div className="text-left w-24">
                  <span className="block text-2xl font-black text-white tracking-tight">{flight.origin}</span>
                  <span className="block text-[11px] font-bold text-muted-foreground truncate" title={flight.originCity}>
                    {flight.originCity}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center relative px-3 -mt-2">
                  <span className="text-[10px] font-bold text-muted-foreground/60 mb-1">{formatDuration(flight.durationMinutes)}</span>
                  <div className="w-full h-8 relative flex items-center">
                    <svg className="w-full h-8 overflow-visible" fill="none" preserveAspectRatio="none">
                      <path 
                        d="M 5,22 Q 50,-5 95,22" 
                        stroke="rgba(255, 255, 255, 0.12)" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                      />
                      <path 
                        d="M 5,22 Q 50,-5 95,22" 
                        stroke="url(#flightPathGradient)" 
                        strokeWidth="2" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-draw-route"
                      />
                      <defs>
                        <linearGradient id="flightPathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <Plane className="h-3 w-3 text-indigo-400 absolute left-[calc(50%-6px)] top-[2px] rotate-90 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300" />
                  </div>
                </div>
                
                <div className="text-right w-24">
                  <span className="block text-2xl font-black text-white tracking-tight">{flight.destination}</span>
                  <span className="block text-[11px] font-bold text-muted-foreground truncate" title={flight.destinationCity}>
                    {flight.destinationCity}
                  </span>
                </div>
              </div>

              {/* Time Details Grid */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/10 rounded-xl p-2.5 border border-white/5 text-xs">
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Departure</span>
                  <span className="block font-extrabold text-white mt-0.5 text-sm">{flight.departureTime}</span>
                  <span className="block text-[9px] font-bold text-muted-foreground/70">{flight.departureDate}</span>
                </div>
                <div className="flex items-center justify-center border-x border-white/5">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Cabin</span>
                    <span className="block font-black capitalize text-indigo-400 mt-0.5">{formatCabin(flight.cabinClass)}</span>
                  </div>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Arrival</span>
                  <span className="block font-extrabold text-white mt-0.5 text-sm">{flight.arrivalTime}</span>
                  <span className="block text-[9px] font-bold text-muted-foreground/70">{flight.departureDate}</span>
                </div>
              </div>

              {/* Bottom Metadata & Badges */}
              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-muted-foreground/50 tracking-wider">FLIGHT ID: {flight.id}</span>
                <span className={`inline-flex items-center rounded px-2 py-0.5 font-bold uppercase tracking-wide border ${
                  criticalSeats
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : lowSeats
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                }`}>
                  {flight.availableSeats} seats left
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
