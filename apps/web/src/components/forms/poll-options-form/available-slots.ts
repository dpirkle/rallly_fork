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
  const getScheduleUrl = `https://calcom-web-app-production-8a86.up.railway.app/api/trpc/slots/getSchedule?input=${inputComponent}`;
  const res = await fetch(getScheduleUrl);
  const resJson: { result: { data: { json: { slots: SlotTimesByDay } } } } =
    await res.json();
  const slotsByDay = Object.entries(resJson.result.data.json.slots).map(
    ([day, times]) => [day, new Set(times.map((t) => t.time))],
  );
  const [minTime, maxTime] = getMinMaxTimes(
    resJson.result.data.json.slots,
    duration,
  );
  return {
    slotsByDay: Object.fromEntries(slotsByDay),
    minTime,
    maxTime,
  };
}

function getMinMaxTimes(slots: SlotTimesByDay, duration: number) {
  const minTimes = Object.values(slots).map((times) =>
    dayjs(times[0].time).format("HH:mm"),
  );
  const maxTimes = Object.values(slots).map((times) =>
    dayjs(times.at(-1)?.time).format("HH:mm"),
  );
  const minParts = minTimes.sort()[0].split(":");
  const maxParts = maxTimes.sort().at(-1)?.split(":");
  const anyDate = dayjs("2026-03-21T00:00:00.000Z");
  const minTime = anyDate
    .set("h", Number.parseInt(minParts[0], 10))
    .set("m", Number.parseInt(minParts[1], 10));
  const maxTime = anyDate
    .set("h", Number.parseInt(maxParts ? maxParts[0] : "9", 10))
    .set("m", Number.parseInt(maxParts ? maxParts[1] : "5", 10))
    .add(duration, "minute");
  return [minTime.toDate(), maxTime.toDate()];
}
