import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { BookingConfirmation } from "@/components/BookingConfirmation";
import { FlightResultCard } from "@/components/FlightResultCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createChatSession, sendChatMessage } from "@/services/agentApi";
import type { ChatMessage, UiPayload } from "@/types";

const SUGGESTED_PROMPTS = [
  "Find flights from JFK to LHR next week for 2 passengers",
  "What is the checked baggage allowance?",
  "Show my bookings",
  "What is the refund policy?",
];

function renderUiPayload(uiPayload?: UiPayload) {
  if (!uiPayload) {
    return null;
  }

  if (uiPayload.type === "flights") {
    return <FlightResultCard flights={uiPayload.items} />;
  }

  if (uiPayload.type === "booking") {
    return <BookingConfirmation booking={uiPayload.booking} />;
  }

  if (uiPayload.type === "bookings") {
    return (
      <div className="space-y-3">
        {uiPayload.items.map((booking) => (
          <BookingConfirmation key={booking.id} booking={booking} />
        ))}
      </div>
    );
  }

  return null;
}

export function ChatAssistant() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    createChatSession("Flight assistant")
      .then((id) => {
        if (active) {
          setSessionId(id);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!sessionId || !text.trim() || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await sendChatMessage(sessionId, text.trim());
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          uiPayload: response.uiPayload,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex h-[calc(100vh-8rem)] flex-col">
      <CardHeader>
        <CardTitle>SkyWings Flight Assistant</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search flights, book tickets, manage trips, and ask policy questions.
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pt-0">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              onClick={() => sendMessage(prompt)}
              disabled={loading || !sessionId}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border bg-background p-4">
          {messages.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">
              Ask about flights, bookings, baggage, refunds, or check-in.
            </p>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground"
                    : "max-w-[85%] rounded-lg bg-secondary px-4 py-3 text-sm"
                }
              >
                {message.content}
              </div>
              {message.uiPayload && renderUiPayload(message.uiPayload)}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Assistant is thinking...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about flights, bookings, or airline policies..."
            className="min-h-[56px] flex-1 resize-none"
            disabled={loading || !sessionId}
          />
          <Button type="submit" disabled={loading || !sessionId || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
