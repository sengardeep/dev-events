import EventCard from "@/components/EventCard"
import ExportBtn from "@/components/ExportBtn"
import type { IEvent } from "@/database";
import { getLatestEvents } from "@/lib/actions/event.actions";

const Home = async () => {
    const events: IEvent[] = await getLatestEvents();

    return (
        <section>
            <h1 className="text-center">
                The Hub for everyday <br /> Event you can not miss
            </h1>
            <p className="text-center">Hackathons, Meetups, and Conferences, All in one page</p>
            <ExportBtn />
            <div className="mt-20 space-y-7" id="events">
                <h3>Featured Events</h3>
                <ul className="events list-none" aria-live="polite">
                    {events.length > 0 && events.map((e: IEvent) => (
                        <li key={e.slug}>
                            <EventCard {...e} />
                        </li>
                    ))}
                </ul>
                {events.length === 0 && (
                    <p className="text-light-100 text-sm">No events are available right now.</p>
                )}
            </div>
        </section>
    )
}

export default Home