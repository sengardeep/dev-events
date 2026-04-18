import { Event } from "@/database";
import connectToDatabase from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary'
import mongoose from "mongoose";

type CloudinaryUploadResult = {
    secure_url: string;
}

const normalizeListField = (values: FormDataEntryValue[]): string[] => {
    return values
        .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
}

const readTextField = (formData: FormData, fieldName: string): string => {
    const value = formData.get(fieldName);
    return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const formData = await req.formData();

        const file = formData.get('image');
        if (!(file instanceof File)) {
            return NextResponse.json({ message: "Image is required" }, { status: 400 });
        }

        const agenda = normalizeListField(formData.getAll("agenda"));
        const tags = normalizeListField(formData.getAll("tags"));

        if (agenda.length === 0) {
            return NextResponse.json({ message: "Agenda is required" }, { status: 400 });
        }

        if (tags.length === 0) {
            return NextResponse.json({ message: "Tags are required" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image', folder: 'DevEvent' },
                (err, result) => {
                    if (err || !result?.secure_url) {
                        return reject(err ?? new Error("Cloudinary upload failed"));
                    }

                    resolve({ secure_url: result.secure_url });
                }
            ).end(buffer);
        });

        const eventPayload = {
            title: readTextField(formData, "title"),
            description: readTextField(formData, "description"),
            overview: readTextField(formData, "overview"),
            venue: readTextField(formData, "venue"),
            location: readTextField(formData, "location"),
            date: readTextField(formData, "date"),
            time: readTextField(formData, "time"),
            mode: readTextField(formData, "mode"),
            audience: readTextField(formData, "audience"),
            organizer: readTextField(formData, "organizer"),
            agenda,
            tags,
            image: uploadResult.secure_url,
        };

        const createdEvent = await Event.create(eventPayload);

        return NextResponse.json({
            message: "Event Created Successfully",
            event: createdEvent
        }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof mongoose.Error.ValidationError) {
            return NextResponse.json(
                { message: "Invalid event data", error: error.message },
                { status: 400 }
            );
        }

        console.error("POST /api/events failed:", error);
        return NextResponse.json({
            message: 'Event Creation Failed',
            error: error instanceof Error ? error.message : 'Unknown'
        }, { status: 500 })
    }
}

export async function GET() {
    try {
        await connectToDatabase();
        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events Fetched Successfully', events }, { status: 200 });
    } catch (error) {
        console.error("GET /api/events failed:", error);
        return NextResponse.json({ message: 'event fetching failed' }, { status: 500 });
    }
}