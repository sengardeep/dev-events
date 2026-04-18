import {
    model,
    models,
    Schema,
    type HydratedDocument,
    type Model,
    type Types,
} from "mongoose"
import Event from "./event.model"

interface IBooking {
    eventId: Types.ObjectId
    email: string
    createdAt?: Date
    updatedAt?: Date
}

type BookingDocument = HydratedDocument<IBooking>

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const bookingSchema = new Schema<IBooking>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
    },
    {
        strict: true,
        timestamps: true,
    }
)

bookingSchema.index({ eventId: 1 })
bookingSchema.index({ eventId: 1, email: 1 }, { unique: true })

bookingSchema.pre("save", async function (this: BookingDocument) {
    // Keep email normalized so uniqueness checks and lookups are deterministic.
    this.email = this.email.trim().toLowerCase()

    if (!emailRegex.test(this.email)) {
        throw new Error("Email must be a valid email address.")
    }

    // Ensure every booking points to a real event before persisting.
    if (this.isModified("eventId") || this.isNew) {
        const eventExists = await Event.exists({ _id: this.eventId })

        if (!eventExists) {
            throw new Error("Cannot create booking for a non-existent event.")
        }
    }
})

const Booking =
    (models.Booking as Model<IBooking>) || model<IBooking>("Booking", bookingSchema)

export default Booking
export type { IBooking }