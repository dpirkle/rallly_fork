type SlotTime = {
  time: string;
};

type SlotTimesByDay = {
  [day: string]: SlotTime[];
};

export type SlotsByDay = {
  [day: string]: Set<string>;
};

export async function getAvailableSlots(
  startTime: string,
  endTime: string,
  userName: string,
  eventTypeSlug: string,
): Promise<SlotsByDay> {
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
  return Object.fromEntries(slotsByDay);
}
