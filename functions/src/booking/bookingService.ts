import { randomBytes } from "crypto";
import { db } from "../utils/firebaseAdmin";
import type { Booking, CabinClass, Flight, Passenger } from "../types";

const FLIGHTS = "flights";
const BOOKINGS = "bookings";

function mapFlight(id: string, data: FirebaseFirestore.DocumentData): Flight {
  return { id, ...(data as Omit<Flight, "id">) };
}

export async function searchFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  passengers?: number;
  cabinClass?: CabinClass;
  maxResults?: number;
}): Promise<Flight[]> {
  const origin = params.origin.toUpperCase();
  const destination = params.destination.toUpperCase();
  const passengers = params.passengers ?? 1;
  const maxResults = params.maxResults ?? 10;

  let query = db
    .collection(FLIGHTS)
    .where("origin", "==", origin)
    .where("destination", "==", destination)
    .where("departureDate", "==", params.departureDate);

  if (params.cabinClass) {
    query = query.where("cabinClass", "==", params.cabinClass);
  }

  const snapshot = await query.limit(maxResults).get();
  const flights = snapshot.docs
    .map((doc) => mapFlight(doc.id, doc.data()))
    .filter((flight) => flight.availableSeats >= passengers)
    .sort((a, b) => a.price - b.price);

  return flights;
}

export async function getFlightDetails(flightId: string): Promise<Flight | null> {
  const doc = await db.collection(FLIGHTS).doc(flightId).get();
  if (!doc.exists) {
    return null;
  }
  return mapFlight(doc.id, doc.data()!);
}

function generatePnr(): string {
  return randomBytes(3).toString("hex").toUpperCase();
}

export async function createBooking(params: {
  userId: string;
  flightId: string;
  passengers: Passenger[];
}): Promise<Booking> {
  const bookingRef = db.collection(BOOKINGS).doc();
  const flightRef = db.collection(FLIGHTS).doc(params.flightId);

  const booking = await db.runTransaction(async (transaction) => {
    const flightSnap = await transaction.get(flightRef);
    if (!flightSnap.exists) {
      throw new Error("Flight not found");
    }

    const flight = mapFlight(flightSnap.id, flightSnap.data()!);
    const seatCount = params.passengers.length;

    if (seatCount < 1 || seatCount > 9) {
      throw new Error("Passenger count must be between 1 and 9");
    }

    if (flight.availableSeats < seatCount) {
      throw new Error("Not enough seats available");
    }

    for (const passenger of params.passengers) {
      if (!passenger.firstName?.trim() || !passenger.lastName?.trim()) {
        throw new Error("Each passenger needs a first and last name");
      }
    }

    const total = flight.price * seatCount;
    const now = new Date().toISOString();
    const bookingData: Omit<Booking, "id" | "flight"> = {
      pnr: generatePnr(),
      userId: params.userId,
      flightId: params.flightId,
      passengers: params.passengers,
      status: "confirmed",
      total,
      currency: flight.currency,
      createdAt: now,
    };

    transaction.update(flightRef, {
      availableSeats: flight.availableSeats - seatCount,
    });
    transaction.set(bookingRef, bookingData);

    return {
      id: bookingRef.id,
      ...bookingData,
      flight,
    };
  });

  return booking;
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  const snapshot = await db
    .collection(BOOKINGS)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();

  const bookings: Booking[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() as Omit<Booking, "id" | "flight">;
    const flight = await getFlightDetails(data.flightId);
    bookings.push({ id: doc.id, ...data, flight: flight ?? undefined });
  }
  return bookings;
}

export async function cancelBooking(params: {
  userId: string;
  bookingId?: string;
  pnr?: string;
}): Promise<Booking> {
  let bookingDoc: FirebaseFirestore.DocumentSnapshot | null = null;

  if (params.bookingId) {
    bookingDoc = await db.collection(BOOKINGS).doc(params.bookingId).get();
  } else if (params.pnr) {
    const snapshot = await db
      .collection(BOOKINGS)
      .where("pnr", "==", params.pnr.toUpperCase())
      .where("userId", "==", params.userId)
      .limit(1)
      .get();
    bookingDoc = snapshot.docs[0] ?? null;
  }

  if (!bookingDoc?.exists) {
    throw new Error("Booking not found");
  }

  const bookingRef = bookingDoc.ref;

  return db.runTransaction(async (transaction) => {
    const freshBooking = await transaction.get(bookingRef);
    if (!freshBooking.exists) {
      throw new Error("Booking not found");
    }

    const bookingData = freshBooking.data() as Omit<Booking, "id" | "flight">;
    if (bookingData.userId !== params.userId) {
      throw new Error("Unauthorized");
    }

    if (bookingData.status === "cancelled") {
      throw new Error("Booking is already cancelled");
    }

    const flightSnap = await transaction.get(
      db.collection(FLIGHTS).doc(bookingData.flightId),
    );
    if (!flightSnap.exists) {
      throw new Error("Associated flight not found");
    }

    const flight = mapFlight(flightSnap.id, flightSnap.data()!);
    transaction.update(flightSnap.ref, {
      availableSeats: flight.availableSeats + bookingData.passengers.length,
    });
    transaction.update(bookingRef, { status: "cancelled" });

    return {
      id: bookingDoc!.id,
      ...bookingData,
      status: "cancelled" as const,
      flight,
    };
  });
}

export async function getBookingByPnr(userId: string, pnr: string): Promise<Booking | null> {
  const snapshot = await db
    .collection(BOOKINGS)
    .where("pnr", "==", pnr.toUpperCase())
    .where("userId", "==", userId)
    .limit(1)
    .get();

  const doc = snapshot.docs[0];
  if (!doc) {
    return null;
  }

  const data = doc.data() as Omit<Booking, "id" | "flight">;
  const flight = await getFlightDetails(data.flightId);
  return { id: doc.id, ...data, flight: flight ?? undefined };
}
