import {
    model,
    models,
    Schema,
    type HydratedDocument,
    type Model,
} from "mongoose"

interface IEvent {
    title: string
    slug: string
    description: string
    overview: string
    image: string
    venue: string
    location: string
    date: string
    time: string
    mode: string
    audience: string
    agenda: string[]
    organizer: string
    tags: string[]
    createdAt?: Date
    updatedAt?: Date
}

type EventDocument = HydratedDocument<IEvent>

const toSlug = (value: string): string => {
    return value
        .toLowerCase()
        .trim()
        .replace(/["']/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

const normalizeDateToIso = (value: string): string => {
    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Date must be a valid date value.")
    }

    return parsedDate.toISOString()
}

const normalizeTime = (value: string): string => {
    const trimmed = value.trim().toLowerCase()
    const twentyFourHourMatch = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/)

    if (twentyFourHourMatch) {
        const hours = twentyFourHourMatch[1].padStart(2, "0")
        const minutes = twentyFourHourMatch[2]
        return `${hours}:${minutes}`
    }

    const meridiemMatch = trimmed.match(/^(1[0-2]|0?[1-9])(?::([0-5]\d))?\s?(am|pm)$/)

    if (meridiemMatch) {
        let hours = Number(meridiemMatch[1])
        const minutes = meridiemMatch[2] ?? "00"
        const meridiem = meridiemMatch[3]

        if (meridiem === "pm" && hours !== 12) {
            hours += 12
        }

        if (meridiem === "am" && hours === 12) {
            hours = 0
        }

        return `${String(hours).padStart(2, "0")}:${minutes}`
    }

    throw new Error("Time must be in HH:mm or h:mm AM/PM format.")
}

const normalizeRequiredText = (value: string, fieldName: string): string => {
    const trimmed = value.trim()

    if (!trimmed) {
        throw new Error(`${fieldName} is required.`)
    }

    return trimmed
}

const eventSchema = new Schema<IEvent>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String },
        description: { type: String, required: true, trim: true },
        overview: { type: String, required: true, trim: true },
        image: { type: String, required: true, trim: true },
        venue: { type: String, required: true, trim: true },
        location: { type: String, required: true, trim: true },
        date: { type: String, required: true, trim: true },
        time: { type: String, required: true, trim: true },
        mode: { type: String, required: true, trim: true },
        audience: { type: String, required: true, trim: true },
        agenda: { type: [String], required: true },
        organizer: { type: String, required: true, trim: true },
        tags: { type: [String], required: true },
    },
    {
        strict: true,
        timestamps: true,
    }
)

eventSchema.index({ slug: 1 }, { unique: true })

eventSchema.pre("save", function (this: EventDocument) {
    this.title = normalizeRequiredText(this.title, "Title")
    this.description = normalizeRequiredText(this.description, "Description")
    this.overview = normalizeRequiredText(this.overview, "Overview")
    this.image = normalizeRequiredText(this.image, "Image")
    this.venue = normalizeRequiredText(this.venue, "Venue")
    this.location = normalizeRequiredText(this.location, "Location")
    this.date = normalizeRequiredText(this.date, "Date")
    this.time = normalizeRequiredText(this.time, "Time")
    this.mode = normalizeRequiredText(this.mode, "Mode")
    this.audience = normalizeRequiredText(this.audience, "Audience")
    this.organizer = normalizeRequiredText(this.organizer, "Organizer")

    if (!Array.isArray(this.agenda)) {
        throw new Error("Agenda is required.")
    }

    this.agenda = this.agenda
        .map((item) => item.trim())
        .filter((item): item is string => item.length > 0)

    if (this.agenda.length === 0) {
        throw new Error("Agenda must include at least one non-empty item.")
    }

    if (!Array.isArray(this.tags)) {
        throw new Error("Tags are required.")
    }

    this.tags = this.tags
        .map((tag) => tag.trim().toLowerCase())
        .filter((tag): tag is string => tag.length > 0)

    if (this.tags.length === 0) {
        throw new Error("Tags must include at least one non-empty value.")
    }

    // Keep stable URLs by only changing the slug when title changes.
    if (this.isModified("title")) {
        this.slug = toSlug(this.title)
    }

    // Store a normalized ISO date string for consistent querying and formatting.
    if (this.isModified("date")) {
        this.date = normalizeDateToIso(this.date)
    }

    // Normalize time to a 24-hour HH:mm format regardless of input style.
    if (this.isModified("time")) {
        this.time = normalizeTime(this.time)
    }
})

const Event = (models.Event as Model<IEvent>) || model<IEvent>("Event", eventSchema)

export default Event
export type { IEvent }