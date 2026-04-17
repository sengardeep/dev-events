import EventCard from "@/components/EventCard"
import ExportBtn from "@/components/ExportBtn"
import { events } from "@/lib/constants"

const Home = () => {
    return (
        <section>
            <h1 className="text-center">
                The Hub for everyday <br /> Event you can not miss
            </h1>
            <p className="text-center">Hackathons, Meetups, and Conferences, All in one page</p>
            <ExportBtn />
            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>
                <ul className="events list-none">
                    {events.map((e) => (
                        <li key={e.title}>
                            <EventCard {...e} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Home