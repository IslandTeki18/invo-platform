import type { LogEventType } from "../enums/log-event";

export interface LogEvent {
  id: string;
  eventType: LogEventType;
  actorId: string | null;
  orgId: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: number;
}
