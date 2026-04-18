"use client";

import { FormEvent, useMemo, useState } from "react";

type BookEventProps = {
  eventId: string;
  slug: string;
};

type StatusState = {
  kind: "idle" | "success" | "error";
  message: string;
};

const BookEvent = ({ eventId, slug }: BookEventProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    kind: "idle",
    message: "",
  });

  const disabled = useMemo(() => {
    return isSubmitting || email.trim().length === 0;
  }, [email, isSubmitting]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setIsSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          email: email.trim().toLowerCase(),
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Booking failed");
      }

      setStatus({
        kind: "success",
        message: payload.message ?? `Spot reserved for ${slug}.`,
      });
      setEmail("");
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Booking failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="book-event">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="booking-email">Email address</label>
          <input
            id="booking-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={disabled}>
          {isSubmitting ? "Booking..." : "Book Event"}
        </button>
      </form>

      {status.kind !== "idle" && (
        <p className={status.kind === "error" ? "text-red-300" : "text-green-300"}>
          {status.message}
        </p>
      )}
    </div>
  );
};

export default BookEvent;
