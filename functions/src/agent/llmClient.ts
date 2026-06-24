import { createGenAiClient, buildChatConfig } from "./geminiClient";
import { SYSTEM_PROMPT } from "./prompt";
import { toolDeclarations } from "./tools";

export interface ChatSession {
  sendMessage(params: {
    message: string | any[];
  }): Promise<{
    text?: string;
    functionCalls?: Array<{ name: string; id?: string; args?: Record<string, unknown> }>;
  }>;
}

const openaiTools = toolDeclarations.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));

export class OpenAiChatSession implements ChatSession {
  private messages: any[] = [];
  private apiKey: string;
  private apiBase: string;
  private model: string;

  constructor(params: {
    history: any[];
    apiKey: string;
    apiBase: string;
    model: string;
  }) {
    this.apiKey = params.apiKey;
    this.apiBase = params.apiBase.endsWith("/") ? params.apiBase.slice(0, -1) : params.apiBase;
    this.model = params.model;

    // Initialize messages starting with System Prompt
    this.messages.push({
      role: "system",
      content: SYSTEM_PROMPT,
    });

    // Add translated history
    for (const msg of params.history) {
      const role = msg.role === "model" ? "assistant" : "user";
      const text = msg.parts?.[0]?.text || "";
      if (text) {
        this.messages.push({ role, content: text });
      }
    }
  }

  async sendMessage(params: { message: string | any[] }): Promise<{
    text?: string;
    functionCalls?: Array<{ name: string; id?: string; args?: Record<string, unknown> }>;
  }> {
    const messageContent = params.message;

    // If message is an array of function responses (tool result inputs from orchestrator)
    if (Array.isArray(messageContent)) {
      for (const part of messageContent) {
        if (part.functionResponse) {
          const resp = part.functionResponse;
          this.messages.push({
            role: "tool",
            tool_call_id: resp.id || "call_dummy",
            name: resp.name,
            content: JSON.stringify(resp.response),
          });
        }
      }
    } else {
      // Normal user message
      this.messages.push({
        role: "user",
        content: String(messageContent),
      });
    }

    const payload = {
      model: this.model,
      messages: this.messages,
      tools: openaiTools,
      tool_choice: "auto",
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(`${this.apiBase}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI-compatible LLM error (${response.status}): ${text}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const assistantMessage = choice?.message;

    if (!assistantMessage) {
      throw new Error("Empty response from OpenAI-compatible API");
    }

    // Append assistant response message to local history so we keep context for the next turn
    this.messages.push(assistantMessage);

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const functionCalls = assistantMessage.tool_calls.map((tc: any) => {
        let args: Record<string, unknown> = {};
        try {
          args = typeof tc.function.arguments === "string" 
            ? JSON.parse(tc.function.arguments) 
            : (tc.function.arguments || {});
        } catch {
          // fallback
        }
        return {
          id: tc.id,
          name: tc.function.name,
          args,
        };
      });

      return { functionCalls };
    }

    return { text: assistantMessage.content || "" };
  }
}

export class GeminiChatSession implements ChatSession {
  private chat: any;

  constructor(apiKey: string, modelName: string, history: any[]) {
    const ai = createGenAiClient(apiKey);
    this.chat = ai.chats.create({
      model: modelName,
      config: buildChatConfig(),
      history,
    });
  }

  async sendMessage(params: { message: string | any[] }): Promise<{
    text?: string;
    functionCalls?: Array<{ name: string; id?: string; args?: Record<string, unknown> }>;
  }> {
    const response = await this.chat.sendMessage(params);
    return {
      text: response.text,
      functionCalls: response.functionCalls,
    };
  }
}

export class LocalMockChatSession implements ChatSession {
  async sendMessage(params: { message: string | any[] }): Promise<{
    text?: string;
    functionCalls?: Array<{ name: string; id?: string; args?: Record<string, unknown> }>;
  }> {
    const content = params.message;

    // Handle tool results
    if (Array.isArray(content)) {
      const toolResponsePart = content.find((part) => part.functionResponse);
      if (toolResponsePart) {
        const resp = toolResponsePart.functionResponse;
        if (resp.name === "searchFlights") {
          const flights = resp.response?.flights || [];
          if (flights.length > 0) {
            return {
              text: `I found ${flights.length} SkyWings flight(s) matching your request. I've rendered them below:`,
            };
          } else {
            return {
              text: "I couldn't find any available flights for your search route. Try searching for DEL to BOM flights.",
            };
          }
        } else if (resp.name === "searchKnowledgeBase") {
          const docs = resp.response?.documents || [];
          if (docs.length > 0) {
            const summary = docs.map((d: any) => `* **${d.title}**: ${d.content}`).join("\n\n");
            return {
              text: `Here is the relevant information from our knowledge base:\n\n${summary}`,
            };
          } else {
            return {
              text: "I couldn't find specific guidelines in our knowledge base, but standard domestic check-in baggage allowance is 15 kg per passenger.",
            };
          }
        } else if (resp.name === "createBooking") {
          const booking = resp.response;
          return {
            text: `Your ticket has been booked successfully! Confirmation PNR: **${booking?.pnr || "SW8888"}**. You can view it in the Bookings tab.`,
          };
        } else if (resp.name === "cancelBooking") {
          return {
            text: "Your booking has been cancelled successfully.",
          };
        }
      }
      return { text: "Request completed successfully." };
    }

    const query = String(content).toLowerCase();

    // Greeting
    if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("greeting")) {
      return {
        text: "Namaste! Welcome to SkyWings Flight Assistant. I am running in local fallback mode. I can help you search flights (e.g. from Delhi to Mumbai), check policy rules, or manage bookings. How can I help you today?",
      };
    }

    // Flight search intent
    if (query.includes("flight") || query.includes("book") || query.includes("search") || query.includes("del") || query.includes("bom") || query.includes("goi") || query.includes("goa")) {
      let origin = "DEL";
      let destination = "BOM";
      if (query.includes("goi") || query.includes("goa")) {
        destination = "GOI";
      }
      return {
        functionCalls: [
          {
            id: "call_mock_flights",
            name: "searchFlights",
            args: {
              origin,
              destination,
              departureDate: new Date().toISOString().slice(0, 10),
              passengers: 1,
            },
          },
        ],
      };
    }

    // Policy rules intent
    if (query.includes("baggage") || query.includes("refund") || query.includes("cancel") || query.includes("rule") || query.includes("policy") || query.includes("limit")) {
      return {
        functionCalls: [
          {
            id: "call_mock_kb",
            name: "searchKnowledgeBase",
            args: {
              query: String(content),
            },
          },
        ],
      };
    }

    return {
      text: "I am running in local backup mode because the Gemini API rate limit has been exceeded. I can still help you search flights (e.g., DEL to BOM or DEL to GOI) or look up baggage limits. What would you like to do?",
    };
  }
}

export function getChatSession(params: {
  userId: string;
  history: any[];
  geminiApiKey: string;
  modelName: string;
}): ChatSession {
  const provider = process.env.MODEL_PROVIDER || "gemini";
  if (provider === "openai") {
    const openAiApiKey = process.env.OPENAI_API_KEY || "";
    const openAiApiBase = process.env.OPENAI_API_BASE || "http://localhost:11434/v1";
    const openAiModel = process.env.OPENAI_MODEL || "llama3";
    return new OpenAiChatSession({
      history: params.history,
      apiKey: openAiApiKey,
      apiBase: openAiApiBase,
      model: openAiModel,
    });
  } else if (provider === "mock") {
    return new LocalMockChatSession();
  }

  return new GeminiChatSession(params.geminiApiKey, params.modelName, params.history);
}
