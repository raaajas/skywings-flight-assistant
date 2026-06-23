import type { KnowledgeDoc } from "../types";

const ROUTES = [
  { origin: "JFK", originCity: "New York", destination: "LHR", destinationCity: "London" },
  { origin: "JFK", originCity: "New York", destination: "CDG", destinationCity: "Paris" },
  { origin: "JFK", originCity: "New York", destination: "DXB", destinationCity: "Dubai" },
  { origin: "LAX", originCity: "Los Angeles", destination: "NRT", destinationCity: "Tokyo" },
  { origin: "LAX", originCity: "Los Angeles", destination: "SYD", destinationCity: "Sydney" },
  { origin: "ORD", originCity: "Chicago", destination: "FRA", destinationCity: "Frankfurt" },
  { origin: "SFO", originCity: "San Francisco", destination: "SIN", destinationCity: "Singapore" },
  { origin: "MIA", originCity: "Miami", destination: "CUN", destinationCity: "Cancun" },
  { origin: "BOS", originCity: "Boston", destination: "DUB", destinationCity: "Dublin" },
  { origin: "SEA", originCity: "Seattle", destination: "ICN", destinationCity: "Seoul" },
  { origin: "ATL", originCity: "Atlanta", destination: "MCO", destinationCity: "Orlando" },
  { origin: "DFW", originCity: "Dallas", destination: "LAX", destinationCity: "Los Angeles" },
];

const CABINS = [
  { cabinClass: "economy" as const, multiplier: 1 },
  { cabinClass: "premium_economy" as const, multiplier: 1.6 },
  { cabinClass: "business" as const, multiplier: 3.2 },
  { cabinClass: "first" as const, multiplier: 5.5 },
];

function addDays(base: Date, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function padFlightNumber(index: number): string {
  return `SW${String(100 + index).padStart(3, "0")}`;
}

export function buildSeedFlights() {
  const flights = [];
  const today = new Date();
  let index = 0;

  for (const route of ROUTES) {
    for (let dayOffset = 1; dayOffset <= 14; dayOffset += 1) {
      for (const cabin of CABINS) {
        index += 1;
        const departureHour = 6 + (index % 12);
        const durationMinutes = 180 + (index % 8) * 45;
        const basePrice = 120 + (index % 20) * 35;
        flights.push({
          id: `flight_${index}`,
          flightNumber: padFlightNumber(index),
          airline: "SkyWings Airlines",
          origin: route.origin,
          originCity: route.originCity,
          destination: route.destination,
          destinationCity: route.destinationCity,
          departureDate: addDays(today, dayOffset),
          departureTime: `${String(departureHour).padStart(2, "0")}:${index % 2 === 0 ? "00" : "30"}`,
          arrivalTime: `${String((departureHour + Math.floor(durationMinutes / 60)) % 24).padStart(2, "0")}:${String(durationMinutes % 60).padStart(2, "0")}`,
          durationMinutes,
          cabinClass: cabin.cabinClass,
          price: Math.round(basePrice * cabin.multiplier),
          currency: "USD",
          availableSeats: 20 + (index % 30),
        });
      }
    }
  }

  return flights;
}

export const seedKnowledgeDocs: Omit<KnowledgeDoc, "id">[] = [
  {
    title: "Checked baggage allowance",
    category: "baggage",
    content:
      "Economy passengers may check one bag up to 23 kg (50 lb). Premium economy allows two bags. Business and first class allow two bags up to 32 kg each. Overweight bags incur a $75 fee per segment.",
    keywords: ["baggage", "luggage", "checked", "weight", "allowance"],
  },
  {
    title: "Carry-on policy",
    category: "baggage",
    content:
      "All fares include one carry-on bag up to 56 x 45 x 25 cm plus one personal item. Basic economy on select routes limits carry-on to personal item only.",
    keywords: ["carry-on", "hand luggage", "personal item"],
  },
  {
    title: "Online check-in window",
    category: "check-in",
    content:
      "Online check-in opens 24 hours before departure and closes 60 minutes before domestic flights or 90 minutes before international flights.",
    keywords: ["check-in", "online", "boarding pass"],
  },
  {
    title: "Refund and cancellation policy",
    category: "refunds",
    content:
      "Refundable fares receive a full refund to the original payment method within 7 business days. Non-refundable fares receive a travel credit minus a $50 change fee. Cancellations within 24 hours of booking are fully refundable for all fare types.",
    keywords: ["refund", "cancel", "cancellation", "credit"],
  },
  {
    title: "SkyMiles loyalty program",
    category: "loyalty",
    content:
      "SkyMiles members earn 5 miles per dollar on economy, 7 on premium economy, 10 on business, and 12 on first class. Miles do not expire for active members with activity in the past 24 months.",
    keywords: ["miles", "loyalty", "rewards", "skymiles"],
  },
  {
    title: "Unaccompanied minors",
    category: "special assistance",
    content:
      "Children aged 5-14 traveling alone must use the unaccompanied minor service. The fee is $100 each way on domestic routes and $150 on international routes.",
    keywords: ["minor", "children", "unaccompanied"],
  },
  {
    title: "Pet travel policy",
    category: "special assistance",
    content:
      "Small pets in approved carriers may travel in cabin on select routes for $125 each way. Pets over 8 kg must travel in cargo. Advance booking is required.",
    keywords: ["pet", "animal", "dog", "cat"],
  },
  {
    title: "Seat selection",
    category: "seats",
    content:
      "Standard seat selection is free at check-in. Preferred seats with extra legroom start at $25. Exit row seats require eligibility confirmation at the gate.",
    keywords: ["seat", "legroom", "exit row"],
  },
  {
    title: "Flight delay compensation",
    category: "disruptions",
    content:
      "For delays over 3 hours on controllable causes, passengers may request meal vouchers and rebooking at no cost. EU261-style compensation may apply on applicable routes.",
    keywords: ["delay", "compensation", "disruption"],
  },
  {
    title: "Special meals",
    category: "onboard",
    content:
      "Vegetarian, vegan, kosher, halal, and gluten-free meals must be requested at least 24 hours before departure through Manage Booking or the assistant.",
    keywords: ["meal", "vegetarian", "kosher", "halal", "food"],
  },
];
