import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";

type RouteContext = {
  params: Promise<{ slug?: string }>;
};

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateSlug(input: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof input !== "string") {
    return { ok: false, message: "Missing required route parameter: slug." };
  }

  const value = input.trim().toLowerCase();
  if (!value) {
    return { ok: false, message: "Missing required route parameter: slug." };
  }

  if (!SLUG_REGEX.test(value)) {
    return { ok: false, message: "Invalid slug format." };
  }

  return { ok: true, value };
}

export async function GET(_request: Request, { params }: RouteContext) {
  // Validate and normalize slug from route params.
  const { slug } = await params;
  const slugResult = validateSlug(slug);

  if (!slugResult.ok) {
    return NextResponse.json({ message: slugResult.message }, { status: 400 });
  }

  try {
    await connectToDatabase();

    // Fetch one event by slug.
    const event = await Event.findOne({ slug: slugResult.value }).lean();

    if (!event) {
      return NextResponse.json({ message: "Event not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Event fetched successfully.", event },
      { status: 200 }
    );
  } catch (error: unknown) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { message: "Invalid request data.", details: error.message },
        { status: 400 }
      );
    }

    console.error("GET /api/events/[slug] failed:", error);
    return NextResponse.json(
      { message: "Unexpected server error while fetching event." },
      { status: 500 }
    );
  }
}