import { notFound } from "next/navigation";
import type { IEvent } from "@/database";
import {
    getBookingsCountByEventId,
    getEventBySlug,
    getSimilarEventsBySlug,
} from "@/lib/actions/event.actions";
import Image from "next/image";
import BookEvent from "./BookEvent";
import EventCard from "@/components/EventCard";

type EventWithId = IEvent & { _id: string };

type EventDetailsProps = {
    slug: string;
}

const EventDetailItem = ({ icon, alt, label }: { icon: string; alt: string; label: string; }) => (
    <div className="flex-row-gap-2 items-center">
        <Image src={icon} alt={alt} width={17} height={17} />
        <p>{label}</p>
    </div>
)

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => (
    <div className="agenda">
        <h2>Agenda</h2>
        <ul>
            {agendaItems.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
            ))}
        </ul>
    </div>
)

const EventTags = ({ tags }: { tags: string[] }) => (
    <div className="flex flex-row gap-1.5 flex-wrap">
        {tags.map((tag) => (
            <div className="pill" key={tag}>{tag}</div>
        ))}
    </div>
)

const EventDetails = async ({ slug }: EventDetailsProps) => {

    let event: EventWithId | null = null;
    try {
        event = await getEventBySlug(slug);
    } catch (error) {
        console.error('Error fetching event:', error);
    }

    if (!event) {
        return notFound();
    }

    const { description, image, overview, date, time, location, mode, agenda, audience, tags, organizer } = event;
    const normalizedAgenda = Array.isArray(agenda) ? agenda : [];
    const normalizedTags = Array.isArray(tags) ? tags : [];
    const eventId = typeof event._id === "string" ? event._id : String(event._id);
    const canBookEvent = /^[a-f\d]{24}$/i.test(eventId);

    if (!description) return notFound();

    const bookings = canBookEvent ? await getBookingsCountByEventId(eventId) : 0;

    let similarEvents: IEvent[] = [];
    try {
        similarEvents = await getSimilarEventsBySlug(slug);
    } catch (error) {
        console.error("Error loading similar events:", error);
    }

    return (
        <section id="event">
            <div className="header">
                <h1>Event Description</h1>
                <p>{description}</p>
            </div>

            <div className="details">
                {/*    Left Side - Event Content */}
                <div className="content">
                    <Image src={image} alt="Event Banner" width={800} height={800} className="banner" />

                    <section className="flex-col-gap-2">
                        <h2>Overview</h2>
                        <p>{overview}</p>
                    </section>

                    <section className="flex-col-gap-2">
                        <h2>Event Details</h2>

                        <EventDetailItem icon="/icons/calendar.svg" alt="calendar" label={date} />
                        <EventDetailItem icon="/icons/clock.svg" alt="clock" label={time} />
                        <EventDetailItem icon="/icons/pin.svg" alt="pin" label={location} />
                        <EventDetailItem icon="/icons/mode.svg" alt="mode" label={mode} />
                        <EventDetailItem icon="/icons/audience.svg" alt="audience" label={audience} />
                    </section>

                    <EventAgenda agendaItems={normalizedAgenda} />

                    <section className="flex-col-gap-2">
                        <h2>About the Organizer</h2>
                        <p>{organizer}</p>
                    </section>

                    <EventTags tags={normalizedTags} />
                </div>

                {/*    Right Side - Booking Form */}
                <aside className="booking">
                    <div className="signup-card">
                        <h2>Book Your Spot</h2>
                        {bookings > 0 ? (
                            <p className="text-sm">
                                Join {bookings} people who have already booked their spot!
                            </p>
                        ) : (
                            <p className="text-sm">Be the first to book your spot!</p>
                        )}

                        {canBookEvent ? (
                            <BookEvent eventId={eventId} slug={event.slug} />
                        ) : (
                            <p className="text-sm">Bookings are temporarily unavailable for this event.</p>
                        )}
                    </div>
                </aside>
            </div>

            <div className="flex w-full flex-col gap-4 pt-20">
                <h2>Similar Events</h2>
                <div className="events">
                    {similarEvents.length > 0 && similarEvents
                        .filter((similarEvent) => similarEvent.slug !== slug)
                        .map((similarEvent: IEvent) => (
                            <EventCard key={similarEvent.slug} {...similarEvent} />
                    ))}
                </div>
            </div>
        </section>
    )
}
export default EventDetails