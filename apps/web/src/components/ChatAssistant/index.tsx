import { useEffect, useRef, useState } from "react";
import { Send, Bot, Sparkles, Plane } from "lucide-react";
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

function renderUiPayload(uiPayload?: UiPayload, onSendMessage?: (msg: string) => void) {
  if (!uiPayload) {
    return null;
  }

  if (uiPayload.type === "flights") {
    return <FlightResultCard flights={uiPayload.items} onBookFlight={onSendMessage} />;
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

function formatMessageContent(content: string) {
  if (!content) return null;
  const lines = content.split("\n");
  return lines.map((line, lineIndex) => {
    const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
    const cleanLine = isBullet ? line.trim().substring(2) : line;

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const contentNode = parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-extrabold text-indigo-200">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <div key={lineIndex} className="flex gap-2 ml-2 my-0.5 items-start">
          <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
          <span className="text-sm text-foreground">{contentNode}</span>
        </div>
      );
    }

    return (
      <p key={lineIndex} className="min-h-[1.25rem] leading-relaxed text-sm text-foreground">
        {contentNode}
      </p>
    );
  });
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
    <Card className="flex h-[calc(100vh-9rem)] flex-col glass-panel border border-white/5 shadow-2xl">
      <CardHeader className="border-b border-white/5 bg-slate-900/10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold tracking-wide text-white">SkyWings Flight Assistant</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Search flights, book tickets, manage trips, and ask policy questions in real-time.
            </p>
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden pt-4">
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="rounded-full text-xs bg-slate-900/40 hover:bg-primary/20 text-muted-foreground hover:text-white border-white/5 hover:border-primary/40 transition-all duration-300"
              onClick={() => sendMessage(prompt)}
              disabled={loading || !sessionId}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/20 p-4 shadow-inner">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center min-h-[360px] text-center p-8 animate-fade-in max-w-md mx-auto space-y-6">
              {/* Futuristic AI Brand Indicator */}
              <div className="relative flex items-center justify-center w-28 h-28">
                {/* Glowing Aura Rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-xl animate-pulse" />
                <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-30 blur-md animate-spin" style={{ animationDuration: '10s' }} />
                <div className="absolute -inset-4 rounded-full border border-dashed border-indigo-500/15 opacity-45 animate-spin" style={{ animationDuration: '20s' }} />
                
                {/* Core Glass Sphere */}
                <div className="relative flex items-center justify-center w-22 h-22 rounded-full border border-white/15 bg-slate-950/70 shadow-2xl shadow-indigo-500/25 backdrop-blur-2xl">
                  <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-400/20 flex items-center justify-center">
                    <Plane className="h-10 w-10 text-white animate-pulse-glow" strokeWidth={1.5} />
                  </div>
                  {/* Floating sparkly particle */}
                  <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-indigo-300 animate-bounce" style={{ animationDuration: '3s' }} />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-[10px] font-bold tracking-wider text-indigo-300 uppercase shadow-inner shadow-indigo-500/5">
                  <Bot className="h-3 w-3" />
                  Premium AI Assistant
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-200">
                  Welcome to SkyWings AI
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Plan, search, book, and explore flight policies seamlessly using our state-of-the-art natural language travel assistant.
                </p>
              </div>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm pt-2">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm hover:border-indigo-500/20 transition-all duration-300">
                  <span className="text-[10px] font-bold text-indigo-300 tracking-wider uppercase mb-1">Instant Search</span>
                  <span className="text-[11px] text-muted-foreground text-center">JFK to LHR, schedules, & pricing</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm hover:border-indigo-500/20 transition-all duration-300">
                  <span className="text-[10px] font-bold text-purple-300 tracking-wider uppercase mb-1">Policy Answers</span>
                  <span className="text-[11px] text-muted-foreground text-center">Baggage, refunds, and support</span>
                </div>
              </div>

              {/* Subtle visual prompt instructions */}
              <div className="flex items-center gap-2 text-xs text-indigo-300/40 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/40 animate-pulse"></span>
                Select a suggested prompt below or type to start chatting
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-3 animate-slide-up">
              <div className="flex flex-col">
                <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 px-1 ${
                  message.role === "user" ? "text-indigo-400 text-right" : "text-violet-400"
                }`}>
                  {message.role === "user" ? "You" : "SkyWings Agent"}
                </span>
                <div
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[80%] rounded-2xl rounded-tr-none bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-3 text-sm text-white shadow-lg shadow-indigo-600/10 border border-indigo-400/20"
                      : "max-w-[80%] rounded-2xl rounded-tl-none bg-secondary/80 px-4 py-3 text-sm text-foreground border border-white/5 shadow-md shadow-black/10"
                  }
                >
                  {message.role === "user" ? message.content : formatMessageContent(message.content)}
                </div>
              </div>
              {message.uiPayload && (
                <div className="pl-1 max-w-[90%] md:max-w-[80%] animate-fade-in">
                  {renderUiPayload(message.uiPayload, sendMessage)}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground animate-pulse-glow pl-2 py-2">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary/80 animate-pulse">SkyWings Agent is formulating response...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="text-xs font-semibold text-destructive pl-1">{error}</p>}

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
            className="min-h-[56px] flex-1 resize-none rounded-xl border-white/5 bg-slate-900/60 focus-visible:ring-indigo-500/50 backdrop-blur-md text-sm text-white placeholder:text-muted-foreground/50"
            disabled={loading || !sessionId}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (input.trim() && !loading) {
                  void sendMessage(input);
                }
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={loading || !sessionId || !input.trim()}
            className="gradient-btn h-auto px-5 rounded-xl transition-all duration-300"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
