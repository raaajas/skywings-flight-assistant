import type { KnowledgeDoc } from "../types";

const ROUTES = [
  { origin: "DEL", originCity: "Delhi", destination: "BOM", destinationCity: "Mumbai" },
  { origin: "DEL", originCity: "Delhi", destination: "BLR", destinationCity: "Bangalore" },
  { origin: "BOM", originCity: "Mumbai", destination: "BLR", destinationCity: "Bangalore" },
  { origin: "DEL", originCity: "Delhi", destination: "CCU", destinationCity: "Kolkata" },
  { origin: "BOM", originCity: "Mumbai", destination: "MAA", destinationCity: "Chennai" },
  { origin: "BLR", originCity: "Bangalore", destination: "HYD", destinationCity: "Hyderabad" },
  { origin: "DEL", originCity: "Delhi", destination: "MAA", destinationCity: "Chennai" },
  { origin: "BOM", originCity: "Mumbai", destination: "GOI", destinationCity: "Goa" },
  { origin: "DEL", originCity: "Delhi", destination: "PNQ", destinationCity: "Pune" },
  { origin: "DEL", originCity: "Delhi", destination: "COK", destinationCity: "Cochin" },
  { origin: "MAA", originCity: "Chennai", destination: "BLR", destinationCity: "Bangalore" },
  { origin: "CCU", originCity: "Kolkata", destination: "BLR", destinationCity: "Bangalore" },
];

const CABINS = [
  { cabinClass: "economy" as const, multiplier: 1 },
  { cabinClass: "premium_economy" as const, multiplier: 1.5 },
  { cabinClass: "business" as const, multiplier: 3.0 },
  { cabinClass: "first" as const, multiplier: 5.0 },
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
        const durationMinutes = 120 + (index % 6) * 15; // Indian domestic flights are shorter (2-3 hrs)
        const basePrice = 3500 + (index % 20) * 250; // Pricing in INR (₹3,500 to ₹8,500 base)
        flights.push({
          id: `flight_${index}`,
          flightNumber: padFlightNumber(index),
          airline: "SkyWings India",
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
          currency: "INR",
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
      "As per DGCA guidelines, on domestic flights in India, economy class passengers are allowed 1 checked bag up to 15 kg. Premium economy allows 20 kg. Business and first class allow up to 30 kg total checked baggage. Overweight baggage is charged at ₹550 per kg.",
    keywords: ["baggage", "luggage", "checked", "weight", "allowance", "15kg", "domestic"],
  },
  {
    title: "Carry-on policy",
    category: "baggage",
    content:
      "Passengers on domestic Indian flights are allowed 1 piece of cabin baggage up to 7 kg (dimensions 55 x 35 x 25 cm) plus 1 small personal item (handbag, laptop bag, or duty-free shopping bag).",
    keywords: ["carry-on", "hand luggage", "personal item", "7kg", "cabin"],
  },
  {
    title: "Online check-in window",
    category: "check-in",
    content:
      "For domestic flights in India, check-in counters open 2 hours before departure and close 45 minutes prior. Web check-in is mandatory under current guidelines and is available from 48 hours up to 60 minutes before departure.",
    keywords: ["check-in", "online", "boarding pass", "web check-in", "mandatory"],
  },
  {
    title: "Refund and cancellation policy",
    category: "refunds",
    content:
      "Refundable fares receive a full refund minus a standard cancellation fee (approx. ₹3,000 per sector) within 7 working days. Under Indian DGCA rules, cancellations made within 24 hours of booking (provided flight departure is at least 7 days later) are fully refundable without fees.",
    keywords: ["refund", "cancel", "cancellation", "fee", "dgca", "charges"],
  },
  {
    title: "SkyWings Club loyalty program",
    category: "loyalty",
    content:
      "SkyWings Club members earn 5 points per ₹100 spent on economy tickets, 7 on premium economy, 10 on business, and 12 on first class. Points can be redeemed for free flights and seat upgrades across all Indian domestic routes.",
    keywords: ["points", "loyalty", "rewards", "club", "membership"],
  },
  {
    title: "Unaccompanied minors",
    category: "special assistance",
    content:
      "Children aged 5-12 years traveling alone must use the unaccompanied minor service. The fee is ₹3,000 per sector on domestic Indian routes, and parents must fill out the declaration form at the airport.",
    keywords: ["minor", "children", "unaccompanied", "alone", "kids"],
  },
  {
    title: "Pet travel policy",
    category: "special assistance",
    content:
      "Small pets (dogs, cats, birds) under 5 kg in government-approved carriers may travel in-cabin on select routes for ₹2,500 each way. Larger pets up to 32 kg must travel in the temperature-controlled cargo hold.",
    keywords: ["pet", "animal", "dog", "cat", "cargo", "cabin"],
  },
  {
    title: "Seat selection",
    category: "seats",
    content:
      "Standard middle seats are free during web check-in. Preferred seats (window/aisle, front rows) or extra legroom seats (Emergency exit rows) are chargeable and start from ₹200 to ₹1,500.",
    keywords: ["seat", "legroom", "exit row", "window", "chargeable"],
  },
  {
    title: "Flight delay compensation",
    category: "disruptions",
    content:
      "Under the DGCA Passenger Charter, if a flight is delayed by over 2 hours, the airline must provide free meals and refreshments. If delayed over 24 hours or cancelled without prior notice, passengers are eligible for free hotel accommodation or a full refund.",
    keywords: ["delay", "compensation", "disruption", "dgca", "charter", "hotel"],
  },
  {
    title: "Special meals",
    category: "onboard",
    content:
      "Special meals including Vegetarian (Hindu Veg / Jain Veg), Non-Vegetarian (Halal / Indian style), and diabetic-friendly meals can be pre-ordered for free at least 24 hours prior to departure.",
    keywords: ["meal", "vegetarian", "jain", "halal", "food", "veg", "non-veg"],
  },
];
