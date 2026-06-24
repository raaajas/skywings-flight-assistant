import type { CabinClass, Flight } from "../types";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

function getAmadeusCredentials() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  
  if (!clientId || !clientSecret || clientId === "your-client-id" || clientSecret === "your-client-secret") {
    return null;
  }
  return { clientId, clientSecret };
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const url = "https://test.api.amadeus.com/v1/security/oauth2/token";
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Amadeus authentication failed: ${response.statusText}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = now + (data.expires_in - 10) * 1000; // Buffer of 10s
  return cachedToken;
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

function mapCabinClass(amadeusCabin: string): CabinClass {
  const cabin = amadeusCabin.toUpperCase();
  if (cabin.includes("PREMIUM")) return "premium_economy";
  if (cabin.includes("BUSINESS")) return "business";
  if (cabin.includes("FIRST")) return "first";
  return "economy";
}

interface AmadeusFlightOffer {
  id: string;
  numberOfBookableSeats: number;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: { iataCode: string; at: string };
      arrival: { iataCode: string; at: string };
      carrierCode: string;
      number: string;
    }>;
  }>;
  price: {
    currency: string;
    total: string;
  };
  travelerPricings: Array<{
    fareDetailsBySegment: Array<{
      cabin: string;
    }>;
  }>;
}

interface AmadeusResponse {
  data?: AmadeusFlightOffer[];
  dictionaries?: {
    carriers?: Record<string, string>;
  };
}

export async function searchAmadeusFlights(params: {
  origin: string;
  destination: string;
  departureDate: string;
  passengers: number;
  cabinClass?: CabinClass;
  maxResults?: number;
}): Promise<Flight[] | null> {
  const creds = getAmadeusCredentials();
  if (!creds) {
    return null; // Fallback to mock DB
  }

  try {
    const token = await getAccessToken(creds.clientId, creds.clientSecret);
    const query = new URLSearchParams({
      originLocationCode: params.origin.toUpperCase(),
      destinationLocationCode: params.destination.toUpperCase(),
      departureDate: params.departureDate,
      adults: String(params.passengers),
      max: String(params.maxResults ?? 10),
    });

    if (params.cabinClass) {
      const amadeusClassMap: Record<CabinClass, string> = {
        economy: "ECONOMY",
        premium_economy: "PREMIUM_ECONOMY",
        business: "BUSINESS",
        first: "FIRST",
      };
      query.append("travelClass", amadeusClassMap[params.cabinClass]);
    }

    const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?${query.toString()}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null; // Fallback on API errors
    }

    const body = (await response.json()) as AmadeusResponse;
    if (!body.data?.length) {
      return [];
    }

    const carriers = body.dictionaries?.carriers ?? {};

    return body.data.map((offer) => {
      // For simplicity, take the outbound itinerary
      const itinerary = offer.itineraries[0];
      const segments = itinerary.segments;
      const firstSegment = segments[0];
      const lastSegment = segments[segments.length - 1];

      const airlineCode = firstSegment.carrierCode;
      const airlineName = carriers[airlineCode] || airlineCode;
      
      const depDateTime = firstSegment.departure.at.split("T");
      const arrDateTime = lastSegment.arrival.at.split("T");

      const cabin = offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || "ECONOMY";

      return {
        id: `amadeus_${offer.id}`,
        flightNumber: `${airlineCode} ${firstSegment.number}`,
        airline: airlineName,
        origin: firstSegment.departure.iataCode,
        originCity: firstSegment.departure.iataCode, // Fallback to IATA code
        destination: lastSegment.arrival.iataCode,
        destinationCity: lastSegment.arrival.iataCode,
        departureDate: depDateTime[0],
        departureTime: depDateTime[1]?.slice(0, 5) || "00:00",
        arrivalTime: arrDateTime[1]?.slice(0, 5) || "00:00",
        durationMinutes: parseDuration(itinerary.duration),
        cabinClass: mapCabinClass(cabin),
        price: parseFloat(offer.price.total),
        currency: offer.price.currency,
        availableSeats: offer.numberOfBookableSeats,
      };
    });
  } catch (error) {
    console.error("Amadeus API flight search failed:", error);
    return null; // Fallback to mock DB on crash
  }
}
