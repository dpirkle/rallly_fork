import postgres from "postgres";
import z from "zod";
import type { CalcomParams } from "@/trpc/client/types";
import { publicProcedure, router } from "../trpc";

const sql = postgres(process.env.CALCOM_DATABASE_URL)

export const calcom = router({
  get: publicProcedure
    .input(
      z.object({
        eventTypeSlug: z.string().nullable().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.eventTypeSlug) {
        return null;
      }
      const eventTypeInfo = await sql`
        SELECT title, length, "minimumBookingNotice", "slotInterval", users.username, users."defaultScheduleId"
        FROM public."EventType" JOIN public.users ON public.users.id = "userId"
        where slug = ${input.eventTypeSlug}
      `;
      const availabityInfo = await sql`
        SELECT "startTime", "endTime" FROM public."Availability"
        where "scheduleId" = ${eventTypeInfo[0].defaultScheduleId} and date is NULL
      `;

      const minTime = availabityInfo
        .map((row) => row.startTime)
        .reduce((prev, next) => (prev < next ? prev : next));
      const maxTime = availabityInfo
        .map((row) => row.endTime)
        .reduce((prev, next) => (prev > next ? prev : next));
      const response: CalcomParams = {
        userName: eventTypeInfo[0].username,
        eventTypeSlug: input.eventTypeSlug,
        minTime,
        maxTime,
        duration: eventTypeInfo[0].length,
        title: eventTypeInfo[0].title,
        step: eventTypeInfo[0].slotInterval,
        minNotice: eventTypeInfo[0].minimumBookingNotice / 60,
      };
      return response;
    }),
});
