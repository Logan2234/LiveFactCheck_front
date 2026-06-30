// Client for the per-user webhook API (/v1/webhooks), gated by the user token via
// userFetch. Mirrors the WebhookOut/WebhookCreate schemas in backend/app/schemas/webhook.py.

import type { VerificationStatus } from "$lib/stores/claims";
import { userFetch } from "$lib/stores/userAuth";

// Destination type — drives the payload the backend sends (see schemas/webhook.py).
export type WebhookKind = "slack" | "discord" | "custom";

export const WEBHOOK_KINDS: { value: WebhookKind; label: string }[] = [
  { value: "slack", label: "Slack" },
  { value: "discord", label: "Discord" },
  { value: "custom", label: "Autre (JSON brut)" }
];

export interface Webhook {
  id: string;
  name: string;
  url: string;
  kind: WebhookKind;
  trigger_statuses: VerificationStatus[];
  enabled: boolean;
  secret: string;
  created_at: string;
  last_triggered_at: string | null;
  last_error: string | null;
  failure_count: number;
}

export interface WebhookInput {
  name: string;
  url: string;
  kind: WebhookKind;
  trigger_statuses: VerificationStatus[];
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    // A 422 carries a pydantic error list, not a string — keep the message human.
    const message =
      typeof detail === "string" ? detail : `Erreur ${res.status}`;
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function listWebhooks(): Promise<Webhook[]> {
  return unwrap(await userFetch("/webhooks"));
}

export async function createWebhook(input: WebhookInput): Promise<Webhook> {
  return unwrap(
    await userFetch("/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await userFetch(`/webhooks/${id}`, { method: "DELETE" });
  // 204 No Content on success; only a real failure has a body to surface.
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Erreur ${res.status}`);
  }
}
