export type CabinClass = "economy" | "premium_economy" | "business" | "first";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface Passenger {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email?: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  cabinClass: CabinClass;
  price: number;
  currency: string;
  availableSeats: number;
}

export interface Booking {
  id: string;
  pnr: string;
  userId: string;
  flightId: string;
  flight?: Flight;
  passengers: Passenger[];
  status: BookingStatus;
  total: number;
  currency: string;
  createdAt: string;
}

export type UiPayload =
  | { type: "flights"; items: Flight[] }
  | { type: "booking"; booking: Booking }
  | { type: "bookings"; items: Booking[] };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  uiPayload?: UiPayload;
}

export interface AgentChatResponse {
  reply: string;
  sessionId: string;
  uiPayload?: UiPayload;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt?: { seconds: number };
}
