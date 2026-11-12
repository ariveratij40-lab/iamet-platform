import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  assistantConversations as conversations,
  assistantTurns as turns,
} from "../drizzle/schema";
export const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function recordAssistantTurn(input: {
  conversation?: { id: string; token: string };
  page: string;
  question: string;
  answer: string;
  mode: string;
  topic: string;
}) {
  const db = await getDb();
  if (!db) return null;
  const identity = input.conversation ?? {
    id: randomUUID(),
    token: randomBytes(32).toString("hex"),
  };
  await db.transaction(async (tx: any) => {
    if (input.conversation) {
      const [existing] = await tx
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          and(
            eq(conversations.id, identity.id),
            eq(conversations.tokenHash, hashToken(identity.token))
          )
        );
      if (!existing) throw new Error("Invalid conversation capability");
    } else {
      await tx
        .insert(conversations)
        .values({
          id: identity.id,
          tokenHash: hashToken(identity.token),
          page: input.page,
        });
    }
    await tx
      .insert(turns)
      .values({
        conversationId: identity.id,
        question: input.question,
        answer: input.answer,
        mode: input.mode,
        topic: input.topic,
      });
    await tx
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, identity.id));
  });
  return identity;
}
