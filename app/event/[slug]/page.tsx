import EventDetails from "@/components/EventDetails";

const EventPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    return <EventDetails slug={slug} />;
}

export default EventPage