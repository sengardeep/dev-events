import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { Booking, Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";

type BookingPayload = {
  eventId?: string;
  email?: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const body = (await req.json()) as BookingPayload;
    const eventId = body.eventId?.trim();
    const email = body.email?.trim().toLowerCase();

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return NextResponse.json(
        { message: "A valid eventId is required." },
        { status: 400 }
      );
    }

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { message: "A valid email is required." },
        { status: 400 }
      );
    }

    const eventExists = await Event.exists({ _id: eventId });
    if (!eventExists) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    const booking = await Booking.create({ eventId, email });

    return NextResponse.json(
      {
        message: "Booking created successfully.",
        booking,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid request body." },
        { status: 400 }
      );
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { message: "Invalid booking data.", details: error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error && "code" in error) {
      const mongoError = error as Error & { code?: number };
      if (mongoError.code === 11000) {
        return NextResponse.json(
          { message: "This email is already registered for the event." },
          { status: 409 }
        );
      }
    }

    console.error("POST /api/bookings failed:", error);
    return NextResponse.json(
      { message: "Booking creation failed." },
      { status: 500 }
    );
  }
}
