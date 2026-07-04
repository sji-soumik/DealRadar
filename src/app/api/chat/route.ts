import { NextResponse } from "next/server";
import { answerChat, ChatMessage } from "@/lib/chat";

export const dynamic = "force-dynamic";

interface ChatBody {
  messages: ChatMessage[];
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }
  const last = body.messages[body.messages.length - 1];
  if (last.role !== "user" || typeof last.content !== "string" || !last.content.trim()) {
    return NextResponse.json({ error: "last message must be from the user" }, { status: 400 });
  }

  const result = await answerChat(body.messages);
  return NextResponse.json(result);
}
