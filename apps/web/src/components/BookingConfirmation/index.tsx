import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking } from "@/types";

interface BookingConfirmationProps {
  booking: Booking;
}

export function BookingConfirmation({ booking }: BookingConfirmationProps) {
  const flight = booking.flight;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Booking {booking.status}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <span className="font-medium">PNR:</span> {booking.pnr}
        </p>
        {flight && (
          <p>
            {flight.flightNumber}: {flight.origin} → {flight.destination} on {flight.departureDate}
          </p>
        )}
        <p>
          <span className="font-medium">Passengers:</span>{" "}
          {booking.passengers.map((p) => `${p.firstName} ${p.lastName}`).join(", ")}
        </p>
        <p>
          <span className="font-medium">Total:</span> {booking.currency} {booking.total}
        </p>
      </CardContent>
    </Card>
  );
}
