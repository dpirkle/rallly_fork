import dayjs from "dayjs";

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
};

export async function getAvailableSlots(
  startTime: string,
  endTime: string,
  userName: string,
  eventTypeSlug: string,
  duration: number,
  minTimeParam: string,
  maxTimeParam: string,
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
  const slotsByDay = Object.entries(resJson.result.data.json.slots).map(
    ([day, times]) => [day, new Set(times.map((t) => t.time))],
  );
  const [minTime, maxTime] = getMinMaxTimes(
    resJson.result.data.json.slots,
    duration,
    minTimeParam,
    maxTimeParam,
  );
  return {
    slotsByDay: Object.fromEntries(slotsByDay),
    minTime,
    maxTime,
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
  return [minTime.toDate(), maxTime.toDate()];
}
