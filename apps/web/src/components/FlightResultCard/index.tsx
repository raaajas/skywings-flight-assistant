import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Flight } from "@/types";

interface FlightResultCardProps {
  flights: Flight[];
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function formatCabin(cabin: string): string {
  return cabin.replace(/_/g, " ");
}

export function FlightResultCard({ flights }: FlightResultCardProps) {
  if (!flights.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {flights.map((flight) => (
        <Card key={flight.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plane className="h-4 w-4 text-primary" />
                {flight.flightNumber}
              </CardTitle>
              <span className="text-lg font-semibold text-primary">
                {flight.currency} {flight.price}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">
              {flight.originCity} ({flight.origin}) → {flight.destinationCity} ({flight.destination})
            </p>
            <p className="text-muted-foreground">
              {flight.departureDate} · {flight.departureTime} – {flight.arrivalTime} ·{" "}
              {formatDuration(flight.durationMinutes)}
            </p>
            <p className="text-muted-foreground capitalize">
              {formatCabin(flight.cabinClass)} · {flight.availableSeats} seats left
            </p>
            <p className="text-xs text-muted-foreground">Flight ID: {flight.id}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
