import { NextResponse } from "next/server";
import { answerChat, ChatMessage } from "@/lib/chat";
import { clearChatMessages, getChatMessages, saveChatMessage } from "@/lib/store";

export const dynamic = "force-dynamic";

interface ChatBody {
  messages: ChatMessage[];
  sessionId?: string;
}

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  try {
    const history = await getChatMessages(sessionId);
    return NextResponse.json({
      messages: history.map((m) => ({ role: m.role, content: m.content })),
    });
  } catch (err) {
    // History is best-effort — e.g. the chat_messages table has not been
    // created yet. The chat itself still works with an empty history.
    console.error("Failed to load chat history:", err);
    return NextResponse.json({ messages: [] });
  }
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

  // Persist the exchange when the client sends a session id. Best-effort:
  // a storage failure should not lose the reply the user is waiting on.
  if (body.sessionId) {
    try {
      await saveChatMessage({
        sessionId: body.sessionId,
        role: "user",
        content: last.content,
        source: null,
      });
      await saveChatMessage({
        sessionId: body.sessionId,
        role: "assistant",
        content: result.reply,
        source: result.source,
      });
    } catch (err) {
      console.error("Failed to persist chat messages:", err);
    }
  }

  return NextResponse.json(result);
}

export async function DELETE(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }
  await clearChatMessages(sessionId);
  return NextResponse.json({ ok: true });
}
