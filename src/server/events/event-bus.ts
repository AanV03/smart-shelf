/**
 * Event Bus - Sistema de eventos asíncrono para flujos de negocio
 * 
 * Uso para:
 * - Invitaciones de managers/empleados (async emails)
 * - Cálculos de costos en background
 * - Detección de anomalías
 * - Alertas al manager
 * 
 * Arquitectura:
 * 1. Event Producer (Next.js API) - Publica evento
 * 2. Event Store (Base de datos) - Persiste eventos para reliability
 * 3. Event Consumer (Serverless Worker) - Procesa evento en background
 */

import { db } from "@/server/db";

export type EventType = 
  | "manager.invited"
  | "employee.invited"
  | "batch.received"
  | "inventory.anomaly"
  | "payment.completed";

export interface Event {
  id: string;
  type: EventType;
  payload: Record<string, unknown>;
  storeId: string;
  createdAt: Date;
  processedAt?: Date;
  status: "pending" | "processing" | "success" | "failed";
  error?: string;
  retries: number;
}

/**
 * Publish an event for asynchronous processing
 * 
 * Example:
 * ```typescript
 * await eventBus.publish('manager.invited', {
 *   storeId: 'store_123',
 *   payload: {
 *     managerId: 'user_456',
 *     email: 'manager@example.com',
 *     storeId: 'store_123'
 *   }
 * })
 * ```
 */
export async function publishEvent(
  type: EventType,
  storeId: string,
  payload: Record<string, unknown>
): Promise<Event> {
  console.log(`[EVENT_BUS] Publishing event: ${type}`, { storeId, payload });

  // TODO: Implement event persistence when Event model is added to Prisma schema
  // For now, we'll use an in-memory queue (NOT RECOMMENDED for production)
  
  // In production, this should:
  // 1. Save to database with status='pending'
  // 2. Publish to message queue (Bull, RabbitMQ, etc)
  // 3. Return the saved event
  
  const event: Event = {
    id: `evt_${Date.now()}`,
    type,
    storeId,
    payload,
    createdAt: new Date(),
    status: "pending",
    retries: 0,
  };

  // TEMPORARY: In-memory storage (will be replaced with DB)
  globalThis.eventQueue = globalThis.eventQueue || [];
  globalThis.eventQueue.push(event);

  return event;
}

/**
 * Subscribe to events for background processing
 * 
 * Example:
 * ```typescript
 * async function onManagerInvited(event: Event) {
 *   const payload = event.payload as { email: string; managerId: string };
 *   await sendEmail(payload.email, 'You are invited to manage...');
 * }
 * 
 * subscribe('manager.invited', onManagerInvited);
 * ```
 */
export function subscribe(
  type: EventType,
  handler: (event: Event) => Promise<void>
): void {
  console.log(`[EVENT_BUS] Subscribing to event: ${type}`);

  // TEMPORARY: In-memory listener (will be replaced with message queue consumer)
  globalThis.eventListeners = globalThis.eventListeners || {};
  globalThis.eventListeners[type] = handler;
}

/**
 * Get pending events (used by background worker)
 * 
 * Example:
 * ```typescript
 * const pendingEvents = await eventBus.getPendingEvents();
 * for (const event of pendingEvents) {
 *   await eventBus.processEvent(event);
 * }
 * ```
 */
export async function getPendingEvents(
  limit = 100
): Promise<Event[]> {
  // TODO: Query from database when Event model is added
  // For now, return from in-memory queue
  
  globalThis.eventQueue = globalThis.eventQueue || [];
  return globalThis.eventQueue.filter(
    (e: Event) => e.status === "pending" && e.retries < 3
  ).slice(0, limit);
}

/**
 * Process a single event
 * 
 * Example:
 * ```typescript
 * const event = await eventBus.getPendingEvents(1);
 * await eventBus.processEvent(event[0]);
 * ```
 */
export async function processEvent(event: Event): Promise<void> {
  console.log(`[EVENT_BUS] Processing event: ${event.type}`, { eventId: event.id });

  const listeners = globalThis.eventListeners || {};
  const handler = listeners[event.type];

  if (!handler) {
    console.warn(`[EVENT_BUS] No handler for event type: ${event.type}`);
    return;
  }

  try {
    await handler(event);
    console.log(`[EVENT_BUS] Event processed successfully: ${event.id}`);
    // TODO: Update event status to 'success' in database
  } catch (error) {
    console.error(`[EVENT_BUS] Error processing event: ${event.id}`, error);
    // TODO: Update event status to 'failed' and increment retries in database
  }
}

/**
 * Global type augmentation for event queue
 */
declare global {
  var eventQueue: Event[];
  var eventListeners: Record<EventType, (event: Event) => Promise<void>>;
}

export const eventBus = {
  publish: publishEvent,
  subscribe,
  getPendingEvents,
  processEvent,
};
