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

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  uiPayload?: UiPayload;
  toolCalls?: ToolCallRecord[];
}

export type UiPayload =
  | { type: "flights"; items: Flight[] }
  | { type: "booking"; booking: Booking }
  | { type: "bookings"; items: Booking[] };

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AgentChatResponse {
  reply: string;
  sessionId: string;
  uiPayload?: UiPayload;
  toolTrace?: ToolCallRecord[];
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  embedding?: number[];
}
