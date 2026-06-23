import { useEffect, useState } from "react";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBookings } from "@/services/agentApi";
import type { Booking } from "@/types";

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings()
      .then(setBookings)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!bookings.length) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">No bookings yet. Ask the assistant to find and book a flight.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Bookings</h2>
      {bookings.map((booking) => (
        <BookingConfirmation key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
