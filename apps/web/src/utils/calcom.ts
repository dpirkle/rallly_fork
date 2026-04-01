import dayjs, { type Dayjs } from "dayjs";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { GetPollApiResponse } from "@/trpc/client/types";

const MIN_POLL_HOURS = 2 * 24;

export type CalcomParams = {
  userName: string;
  eventTypeSlug: string;
  minTime: string;
  maxTime: string;
  duration: string;
  title: string;
  step: string;
  minNotice: string;
};

export type SlotDjssByDay = {
  [day: string]: Dayjs[];
};

export function searchToCalcomParams(
  searchParams: ReadonlyURLSearchParams,
): CalcomParams {
  return {
    userName: searchParams.get("userName") ?? "",
    eventTypeSlug: searchParams.get("eventTypeSlug") ?? "",
    minTime: searchParams.get("minTime") ?? "",
    maxTime: searchParams.get("maxTime") ?? "",
    duration: searchParams.get("duration") ?? "180",
    title: searchParams.get("title") ?? "Odyssey Tabletop",
    step: searchParams.get("step") ?? "30",
    minNotice: searchParams.get("minNotice") ?? "48",
  };
}

export function getCalcomParamsFromPoll(
  poll: GetPollApiResponse,
): CalcomParams | null {
  return poll.description
    ? (JSON.parse(poll.description) as CalcomParams)
    : null;
}

type SlotTime = {
  time: string;
};

type SlotTimesByDay = {
  [day: string]: SlotTime[];
};

export type SlotsByDay = {
  [day: string]: Set<string>;
};

export type AvailableSlotsInfo = {
  slotsByDay: SlotsByDay;
  minTime: Date;
  maxTime: Date;
  earliestGoodSlot: Date;
};

export type CalcomAvailability = {
  isAvailableSlot: (slotTime: Date) => boolean;
  isWithinAvailableSlot: (slotTime: Date) => boolean;
  availableSlots: SlotsByDay;
  availableDjss: SlotDjssByDay;
  minTime: Date;
  maxTime: Date;
  earliestGoodSlot: Date;
  minPollHours: number;
  duration: number;
  step: number;
  minNotice: number;
};

export async function getAvailableSlots(
  startTime: string,
  endTime: string,
  userName: string,
  eventTypeSlug: string,
  duration: number,
  minTimeParam: string,
  maxTimeParam: string,
  minFuture: number,
): Promise<AvailableSlotsInfo> {
  const getScheduleInput = {
    json: {
      isTeamEvent: false,
      usernameList: [userName],
      eventTypeSlug,
      startTime,
      endTime,
      timeZone: "America/Los_Angeles",
      duration: null,
      rescheduleUid: null,
      orgSlug: null,
      teamMemberEmail: null,
      routedTeamMemberIds: null,
      skipContactOwner: false,
      routingFormResponseId: null,
      email: null,
      embedConnectVersion: "0",
      _isDryRun: false,
    },
    meta: {
      values: {
        duration: ["undefined"],
        orgSlug: ["undefined"],
        teamMemberEmail: ["undefined"],
        routingFormResponseId: ["undefined"],
      },
    },
  };

  const inputComponent = encodeURIComponent(JSON.stringify(getScheduleInput));
  const getScheduleUrl = `${process.env.NEXT_PUBLIC_CALCOM_URL}/api/trpc/slots/getSchedule?input=${inputComponent}`;
  const res = await fetch(getScheduleUrl);
  const resJson: { result: { data: { json: { slots: SlotTimesByDay } } } } =
    await res.json();
  const slots = resJson.result.data.json.slots;
  const slotsByDay = Object.entries(slots).map(([day, times]) => [
    day,
    new Set(times.map((t) => t.time)),
  ]);
  return {
    slotsByDay: Object.fromEntries(slotsByDay),
    earliestGoodSlot: getEarliestGoodSlot(slots, minFuture),
    ...getMinMaxTimes(slots, duration, minTimeParam, maxTimeParam),
  };
}

function getMinMaxTimes(
  slots: SlotTimesByDay,
  duration: number,
  minTimeParam: string,
  maxTimeParam: string,
) {
  if (minTimeParam && maxTimeParam) {
    return getTimeRange(minTimeParam, maxTimeParam);
  }
  const minTimes = Object.values(slots).map((times) =>
    times.at(0) ? dayjs(times.at(0)?.time).format("HH:mm") : null,
  );
  const maxTimes = Object.values(slots).map((times) =>
    times.at(-1) ? dayjs(times.at(-1)?.time).format("HH:mm") : null,
  );
  const minHm = minTimes.reduce((a, b) => (b === null || (a && a < b) ? a : b));
  const maxHm = maxTimes.reduce((a, b) => (b === null || (a && a > b) ? a : b));
  return getTimeRange(minHm ?? "12:00", maxHm ?? "18:00", duration);
}

function getTimeRange(minHm: string, maxHm: string, addToMax?: number) {
  const anyDate = dayjs("2026-03-21T00:00:00.000Z");
  const minParts = minHm.split(":");
  const minTime = anyDate
    .set("h", Number.parseInt(minParts[0], 10))
    .set("m", Number.parseInt(minParts.at(1) ?? "00", 10));
  const maxParts = maxHm.split(":");
  const maxTime = anyDate
    .set("h", Number.parseInt(maxParts[0], 10))
    .set("m", Number.parseInt(maxParts.at(1) ?? "00", 10))
    .add(addToMax ?? 0, "minute");
  return { minTime: minTime.toDate(), maxTime: maxTime.toDate() };
}

function getEarliestGoodSlot(slots: SlotTimesByDay, minFuture: number) {
  const sortedDays = Object.keys(slots).sort();
  const now = Date.now();
  const minFutureMs = minFuture * 60 * 60 * 1000;
  for (const day of sortedDays) {
    const goodSlot = slots[day].find(
      (d) => new Date(d.time).valueOf() - now >= minFutureMs,
    );
    if (goodSlot) {
      return new Date(goodSlot.time);
    }
  }
  return new Date();
}

export const fetchCalcomAvailability = async (
  ccParams: CalcomParams,
): Promise<CalcomAvailability> => {
  const startTime = dayjs();
  const endTime = startTime.add(3, "month");
  const duration = Number.parseInt(ccParams.duration, 10);
  const minNotice = Number.parseInt(ccParams.minNotice, 10);
  const fetchAvailableSlots = async () => {
    const slotsForRange = await getAvailableSlots(
      startTime.toISOString(),
      endTime.toISOString(),
      ccParams.userName,
      ccParams.eventTypeSlug,
      duration,
      ccParams.minTime,
      ccParams.maxTime,
      minNotice + MIN_POLL_HOURS,
    );
    const availableDateEntries = Object.entries(slotsForRange.slotsByDay).map(
      ([day, slots]) => [day, [...slots].map((s) => dayjs(s))],
    );
    return {
      availableSlots: slotsForRange.slotsByDay,
      availableDjss: Object.fromEntries(availableDateEntries) as SlotDjssByDay,
      minTime: slotsForRange.minTime,
      maxTime: slotsForRange.maxTime,
      earliestGoodSlot: slotsForRange.earliestGoodSlot,
      duration,
      minNotice,
      step: Number.parseInt(ccParams.step, 10),
    };
  };
  const slotInfo = await fetchAvailableSlots();

  const isAvailableSlot = (slotTime: Date) => {
    const laDayjs = dayjs(slotTime).tz("America/Los_Angeles", true);
    const laDate = laDayjs.format("YYYY-MM-DD");
    const utcDateAndTime = laDayjs.toISOString();
    return slotInfo.availableSlots[laDate]?.has(utcDateAndTime);
  };

  const isWithinAvailableSlot = (slotTime: Date) => {
    const laDayjs = dayjs(slotTime).tz("America/Los_Angeles", true);
    const laDate = laDayjs.format("YYYY-MM-DD");
    const slots = slotInfo.availableDjss[laDate];
    if (slots === undefined) {
      return false;
    }
    return slots.some((slot) =>
      laDayjs.isBetween(slot, slot.add(duration, "minute"), "minute", "[)"),
    );
  };
  return {
    ...slotInfo,
    minPollHours: MIN_POLL_HOURS,
    isAvailableSlot,
    isWithinAvailableSlot,
  };
};
