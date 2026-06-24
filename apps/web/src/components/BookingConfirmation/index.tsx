import { CheckCircle2, XCircle, AlertCircle, Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from "@/types";
import { formatCurrency } from "../FlightResultCard";

interface BookingConfirmationProps {
  booking: Booking;
}

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const flight = booking.flight;
  const isCancelled = booking.status === "cancelled";
  const isConfirmed = booking.status === "confirmed";

  return (
    <Card 
      className={`overflow-hidden glass-panel border border-white/5 rounded-2xl relative shadow-lg shadow-black/20 animate-fade-in ${
        isCancelled 
          ? "border-l-4 border-l-rose-500 bg-rose-500/5" 
          : isConfirmed 
          ? "border-l-4 border-l-emerald-500 bg-emerald-500/5" 
          : "border-l-4 border-l-amber-500 bg-amber-500/5"
      }`}
    >
      <CardHeader className="pb-3 border-b border-white/5 bg-slate-900/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-white">
            {isConfirmed && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
            {isCancelled && <XCircle className="h-5 w-5 text-rose-400" />}
            {!isConfirmed && !isCancelled && <AlertCircle className="h-5 w-5 text-amber-400" />}
            Booking {booking.status}
          </CardTitle>
          <span className="text-[10px] text-muted-foreground/60 tracking-wider">PNR CODE</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4 text-sm relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Confirmation Code</div>
            <span className="inline-block bg-white/5 border border-indigo-500/20 rounded-xl px-3.5 py-1.5 font-mono text-base tracking-widest text-indigo-300 font-black shadow-[0_0_12px_rgba(99,102,241,0.1)]">
              {booking.pnr}
            </span>
          </div>

          <div className="sm:text-right">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Payment</div>
            <span className="font-black text-white text-lg">
              {formatCurrency(booking.total, booking.currency)}
            </span>
          </div>
        </div>

        {/* Coupon divider */}
        <div className="relative py-1 flex items-center justify-center">
          <span className="w-full border-t border-dashed border-white/10"></span>
          <span className="absolute left-[-22px] h-4 w-4 bg-background border border-white/5 rounded-full"></span>
          <span className="absolute right-[-22px] h-4 w-4 bg-background border border-white/5 rounded-full"></span>
        </div>

        {flight && (
          <div className="space-y-2.5 bg-slate-900/10 rounded-xl p-3.5 border border-white/5">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-300">
              <Plane className="h-3.5 w-3.5 shrink-0" />
              <span>{flight.flightNumber} · {flight.airline}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-white">
              <span className="font-extrabold">{flight.originCity} ({flight.origin})</span>
              <span className="text-[10px] text-muted-foreground font-bold mx-2">➔</span>
              <span className="font-extrabold">{flight.destinationCity} ({flight.destination})</span>
            </div>
            <div className="text-[10px] font-bold text-muted-foreground mt-1">
              Date: <span className="text-white font-extrabold">{flight.departureDate}</span> · Time: <span className="text-white font-extrabold">{flight.departureTime} – {flight.arrivalTime}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Passengers</div>
          <div className="flex flex-wrap gap-1.5">
            {booking.passengers.map((p, idx) => (
              <span key={idx} className="inline-flex items-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-300 shadow-sm">
                {p.firstName} {p.lastName}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
