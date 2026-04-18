"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type CreationResult = {
  kind: "idle" | "success" | "error";
  message: string;
  slug?: string;
};

const requiredFields = [
  { label: "Title", name: "title", type: "text" },
  { label: "Description", name: "description", type: "text" },
  { label: "Overview", name: "overview", type: "text" },
  { label: "Venue", name: "venue", type: "text" },
  { label: "Location", name: "location", type: "text" },
  { label: "Date", name: "date", type: "date" },
  { label: "Time", name: "time", type: "time" },
  { label: "Mode", name: "mode", type: "text" },
  { label: "Audience", name: "audience", type: "text" },
  { label: "Organizer", name: "organizer", type: "text" },
] as const;

const CreateEventForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreationResult>({ kind: "idle", message: "" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSubmitting(true);
    setResult({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        message?: string;
        event?: { slug?: string };
      };

      if (!response.ok) {
        throw new Error(payload.message ?? "Event creation failed.");
      }

      const createdSlug = payload.event?.slug;
      setResult({
        kind: "success",
        message: payload.message ?? "Event created successfully.",
        slug: createdSlug,
      });
      form.reset();
    } catch (error) {
      setResult({
        kind: "error",
        message: error instanceof Error ? error.message : "Event creation failed.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl">
      <h1 className="text-center">Create Event</h1>
      <p className="mt-4 text-center text-light-100">
        Fill the details below to publish a new developer event.
      </p>

      <form className="mt-10 grid gap-5" onSubmit={handleSubmit} encType="multipart/form-data">
        {requiredFields.map((field) => (
          <div className="flex flex-col gap-2" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              className="bg-dark-200 rounded-[6px] px-5 py-2.5"
              required
            />
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <label htmlFor="agenda">Agenda (comma separated)</label>
          <input
            id="agenda"
            name="agenda"
            type="text"
            className="bg-dark-200 rounded-[6px] px-5 py-2.5"
            placeholder="Opening keynote, Panel discussion, Q&A"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            id="tags"
            name="tags"
            type="text"
            className="bg-dark-200 rounded-[6px] px-5 py-2.5"
            placeholder="nextjs, react, meetup"
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="image">Banner image</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="bg-dark-200 rounded-[6px] px-5 py-2.5"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 w-full cursor-pointer rounded-[6px] px-4 py-2.5 text-lg font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating Event..." : "Create Event"}
        </button>
      </form>

      {result.kind !== "idle" && (
        <div className="mt-6 rounded-md border border-border-dark bg-dark-100 p-4">
          <p className={result.kind === "error" ? "text-red-300" : "text-green-300"}>
            {result.message}
          </p>
          {result.slug && (
            <Link className="mt-2 inline-block text-primary underline" href={`/event/${result.slug}`}>
              View Created Event
            </Link>
          )}
        </div>
      )}
    </section>
  );
};

export default CreateEventForm;
