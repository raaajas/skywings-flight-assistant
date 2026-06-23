import type { CabinClass } from "../types";
import {
  cancelBooking,
  createBooking,
  getBookingByPnr,
  getFlightDetails,
  getUserBookings,
  searchFlights,
} from "../booking/bookingService";
import { searchKnowledgeBase } from "../rag/knowledgeService";
import type { ToolCallRecord, UiPayload } from "../types";

export interface ToolContext {
  userId: string;
  geminiApiKey: string;
}

export interface ToolExecutionResult {
  result: unknown;
  uiPayload?: UiPayload;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolExecutionResult> {
  switch (name) {
    case "searchFlights": {
      const flights = await searchFlights({
        origin: String(args.origin ?? ""),
        destination: String(args.destination ?? ""),
        departureDate: String(args.departureDate ?? ""),
        passengers: Number(args.passengers ?? 1),
        cabinClass: args.cabinClass as CabinClass | undefined,
        maxResults: Number(args.maxResults ?? 10),
      });
      return {
        result: { count: flights.length, flights },
        uiPayload: flights.length ? { type: "flights", items: flights } : undefined,
      };
    }
    case "getFlightDetails": {
      const flight = await getFlightDetails(String(args.flightId ?? ""));
      return { result: flight ?? { error: "Flight not found" } };
    }
    case "createBooking": {
      const passengers = (args.passengers as Array<{ firstName: string; lastName: string }>) ?? [];
      const booking = await createBooking({
        userId: context.userId,
        flightId: String(args.flightId ?? ""),
        passengers,
      });
      return {
        result: booking,
        uiPayload: { type: "booking", booking },
      };
    }
    case "getUserBookings": {
      const bookings = await getUserBookings(context.userId);
      return {
        result: { count: bookings.length, bookings },
        uiPayload: bookings.length ? { type: "bookings", items: bookings } : undefined,
      };
    }
    case "cancelBooking": {
      const booking = await cancelBooking({
        userId: context.userId,
        bookingId: args.bookingId ? String(args.bookingId) : undefined,
        pnr: args.pnr ? String(args.pnr) : undefined,
      });
      return {
        result: booking,
        uiPayload: { type: "booking", booking },
      };
    }
    case "getBookingStatus": {
      const pnr = String(args.pnr ?? "");
      const booking = await getBookingByPnr(context.userId, pnr);
      return {
        result: booking ?? { error: "Booking not found" },
        uiPayload: booking ? { type: "booking", booking } : undefined,
      };
    }
    case "searchKnowledgeBase": {
      const docs = await searchKnowledgeBase(
        String(args.query ?? ""),
        context.geminiApiKey,
      );
      return {
        result: {
          count: docs.length,
          documents: docs.map((doc) => ({
            title: doc.title,
            category: doc.category,
            content: doc.content,
          })),
        },
      };
    }
    default:
      return { result: { error: `Unknown tool: ${name}` } };
  }
}

export const toolDeclarations = [
  {
    name: "searchFlights",
    description: "Search available SkyWings flights by route, date, passengers, and optional cabin class.",
    parameters: {
      type: "object",
      properties: {
        origin: { type: "string", description: "IATA airport code, e.g. JFK" },
        destination: { type: "string", description: "IATA airport code, e.g. LHR" },
        departureDate: { type: "string", description: "ISO date YYYY-MM-DD" },
        passengers: { type: "number", description: "Number of passengers" },
        cabinClass: {
          type: "string",
          enum: ["economy", "premium_economy", "business", "first"],
        },
        maxResults: { type: "number" },
      },
      required: ["origin", "destination", "departureDate"],
    },
  },
  {
    name: "getFlightDetails",
    description: "Get details for a specific flight by ID.",
    parameters: {
      type: "object",
      properties: {
        flightId: { type: "string" },
      },
      required: ["flightId"],
    },
  },
  {
    name: "createBooking",
    description: "Book seats on a flight for the authenticated user. Confirm passenger names first.",
    parameters: {
      type: "object",
      properties: {
        flightId: { type: "string" },
        passengers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              dateOfBirth: { type: "string" },
              email: { type: "string" },
            },
            required: ["firstName", "lastName"],
          },
        },
      },
      required: ["flightId", "passengers"],
    },
  },
  {
    name: "getUserBookings",
    description: "List the authenticated user's bookings.",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "cancelBooking",
    description: "Cancel a booking by bookingId or PNR.",
    parameters: {
      type: "object",
      properties: {
        bookingId: { type: "string" },
        pnr: { type: "string" },
      },
    },
  },
  {
    name: "getBookingStatus",
    description: "Look up booking status by PNR.",
    parameters: {
      type: "object",
      properties: {
        pnr: { type: "string" },
      },
      required: ["pnr"],
    },
  },
  {
    name: "searchKnowledgeBase",
    description: "Search airline policies, baggage rules, check-in, refunds, and FAQs.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
];

export function buildToolTrace(
  name: string,
  args: Record<string, unknown>,
  result: unknown,
): ToolCallRecord {
  return { name, args, result };
}
