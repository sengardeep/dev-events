import "server-only";

import type { IEvent } from "@/database";
import { Booking, Event } from "@/database";
import { events as fallbackEvents } from "@/lib/constants";
import connectToDatabase from "@/lib/mongodb";

const FALLBACK_LIMIT = 3;

type EventWithId = IEvent & { _id: string };
type EventDocumentWithObjectId = IEvent & { _id: { toString(): string } | string };

const normalizeFallbackEvents = (limit?: number): IEvent[] => {
  const normalized = fallbackEvents.map((event) => ({
    ...event,
    description: "",
    overview: "",
    venue: "",
    mode: "",
    audience: "",
    agenda: [],
    organizer: "",
    tags: [],
  })) as IEvent[];

  return typeof limit === "number" ? normalized.slice(0, limit) : normalized;
};

const fetchFallbackEvents = async (slug: string, limit: number): Promise<IEvent[]> => {
  try {
    const events = await Event.find({ slug: { $ne: slug } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return events as IEvent[];
  } catch (error) {
    console.error("Falling back to static events for similar event lookup:", error);
    return normalizeFallbackEvents(limit).filter((event) => event.slug !== slug);
  }
};

export const getLatestEvents = async (limit?: number): Promise<IEvent[]> => {
  try {
    await connectToDatabase();

    const query = Event.find().sort({ createdAt: -1 });
    if (typeof limit === "number") {
      query.limit(limit);
    }

    const events = await query.lean();
    return events as IEvent[];
  } catch (error) {
    console.error("Falling back to static events for latest events:", error);
    return normalizeFallbackEvents(limit);
  }
};

export const getEventBySlug = async (slug: string): Promise<EventWithId | null> => {
  try {
    await connectToDatabase();
    const event = (await Event.findOne({ slug }).lean()) as EventDocumentWithObjectId | null;
    if (event) {
      return {
        ...event,
        _id: typeof event._id === "string" ? event._id : event._id.toString(),
      };
    }

    const fallbackEvent = normalizeFallbackEvents().find((item) => item.slug === slug);
    if (!fallbackEvent) {
      return null;
    }

    return {
      ...fallbackEvent,
      _id: "",
    };
  } catch (error) {
    console.error("Failed to fetch event by slug:", error);
    const fallbackEvent = normalizeFallbackEvents().find((item) => item.slug === slug);
    return fallbackEvent
      ? {
          ...fallbackEvent,
          _id: "",
        }
      : null;
  }
};

export const getBookingsCountByEventId = async (eventId: string): Promise<number> => {
  try {
    await connectToDatabase();
    return Booking.countDocuments({ eventId });
  } catch (error) {
    console.error("Failed to count bookings:", error);
    return 0;
  }
};

export const getSimilarEventsBySlug = async (
  slug: string,
  limit = FALLBACK_LIMIT
): Promise<IEvent[]> => {
  try {
    await connectToDatabase();

    const event = (await Event.findOne({ slug }).select("tags").lean()) as
      | { tags?: string[] }
      | null;

    if (!event) {
      return [];
    }

    const tags = Array.isArray(event.tags)
      ? event.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean)
      : [];

    if (tags.length === 0) {
      return fetchFallbackEvents(slug, limit);
    }

    const similarEvents = await Event.find({
      slug: { $ne: slug },
      tags: { $in: tags },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (similarEvents.length > 0) {
      return similarEvents as IEvent[];
    }

    return fetchFallbackEvents(slug, limit);
  } catch (error) {
    console.error("Falling back to static events for similar events:", error);
    return normalizeFallbackEvents(limit).filter((event) => event.slug !== slug);
  }
};
