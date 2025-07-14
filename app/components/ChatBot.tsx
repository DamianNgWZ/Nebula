"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, Minus, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Message = {
  sender: "user" | "bot";
  text: string;
};

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await res.json();
      const botMessage: Message = { sender: "bot", text: data.answer };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  console.log("Chatbot loaded");

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <Card className="w-[350px] h-[500px] flex flex-col shadow-xl border">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <Bot size={18} />
              Nebula Assistant
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <Minus size={16} />
            </Button>
          </div>
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-md max-w-xs ${
                  msg.sender === "user"
                    ? "ml-auto bg-primary text-white"
                    : "mr-auto bg-muted"
                }`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </CardContent>
          <div className="flex gap-2 p-4 border-t">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              className="flex-1"
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send size={16} />
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg bg-primary text-white"
        >
          <MessageSquare size={20} />
        </Button>
      )}
    </div>
  );
}
