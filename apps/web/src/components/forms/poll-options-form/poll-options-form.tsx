import { Button } from "@rallly/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rallly/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { FormField, FormMessage } from "@rallly/ui/form";
import dayjs, { type Dayjs, type ManipulateType } from "dayjs";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { useFormContext } from "react-hook-form";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { getBrowserTimeZone } from "../../../utils/date-time-utils";
import type { NewEventData } from "../types";
import type { SlotsByDay } from "./available-slots";
import { getAvailableSlots } from "./available-slots";
import MonthCalendar from "./month-calendar";
import type { DateTimeOption } from "./types";
import WeekCalendar from "./week-calendar";

export type PollOptionsData = {
  navigationDate: string; // used to navigate to the right part of the calendar
  duration: number; // duration of the event in minutes
  timeZone: string;
  view: string;
  options: DateTimeOption[];
};

type SlotDjssByDay = {
  [day: string]: Dayjs[];
};

const PollOptionsForm = ({ children }: React.PropsWithChildren) => {
  const { t } = useTranslation();
  const form = useFormContext<NewEventData>();

  const { watch, setValue, formState } = form;

  const views = React.useMemo(() => {
    const res = [
      {
        label: t("monthView"),
        value: "month",
        Component: MonthCalendar,
      },
      {
        label: t("weekView"),
        value: "week",
        Component: WeekCalendar,
      },
    ];
    return res;
  }, [t]);

  const watchView = watch("view");

  const selectedView = React.useMemo(
    () => views.find((view) => view.value === watchView) ?? views[1],
    [views, watchView],
  );

  const watchOptions = watch("options", []);
  const watchTimeZone = watch("timeZone");

  const dateOrTimeRangeDialog = useDialog();

  React.useEffect(() => {
    if (watchOptions.length > 1) {
      const optionType = watchOptions[0].type;
      // all options needs to be the same type
      if (watchOptions.some((option) => option.type !== optionType)) {
        dateOrTimeRangeDialog.trigger();
      }
    }
  }, [watchOptions, dateOrTimeRangeDialog]);

  const watchNavigationDate = watch("navigationDate");
  const navigationDate = React.useMemo(
    () => new Date(watchNavigationDate ?? Date.now()),
    [watchNavigationDate],
  );

  const searchParams = useSearchParams();
  const duration = Number.parseInt(searchParams.get("duration") ?? "180", 10);
  const step = Number.parseInt(searchParams.get("step") ?? "30", 10);
  const [availableSlots, setAvailableSlots] = React.useState<SlotsByDay>({});
  const [availableDjss, setAvailableDjss] = React.useState<SlotDjssByDay>({});
  const [minTime, setMinTime] = React.useState<Date>();
  const [maxTime, setMaxTime] = React.useState<Date>();
  React.useEffect(() => {
    const navDate = dayjs(navigationDate);
    const startTime = navDate.subtract(2, selectedView.value as ManipulateType);
    const endTime = navDate.add(2, selectedView.value as ManipulateType);
    const userName = searchParams.get("userName");
    const eventTypeSlug = searchParams.get("eventTypeSlug");
    if (userName && eventTypeSlug) {
      const fetchAvailableSlots = async () => {
        const slotsForRange = await getAvailableSlots(
          startTime.toISOString(),
          endTime.toISOString(),
          userName,
          eventTypeSlug,
          duration,
          searchParams.get("minTime"),
          searchParams.get("maxTime"),
        );
        setAvailableSlots(slotsForRange.slotsByDay);
        const availableDateEntries = Object.entries(
          slotsForRange.slotsByDay,
        ).map(([day, slots]) => [day, [...slots].map((s) => dayjs(s))]);
        setAvailableDjss(Object.fromEntries(availableDateEntries));
        setMinTime(slotsForRange.minTime);
        setMaxTime(slotsForRange.maxTime);
      };
      fetchAvailableSlots();
    }
  }, [navigationDate, selectedView.value, searchParams.get, duration]);

  const isAvailableSlot = (localSlotTime: Date) => {
    const localDayjs = dayjs(localSlotTime);
    const localDate = localDayjs.format("YYYY-MM-DD");
    const utcDateAndTime = localDayjs.toISOString();
    return availableSlots[localDate]?.has(utcDateAndTime);
  };

  const isWithinAvailableSlot = (localSlotTime: Date) => {
    const localDayjs = dayjs(localSlotTime);
    const localDate = localDayjs.format("YYYY-MM-DD");
    const slots = availableDjss[localDate];
    if (slots === undefined) {
      return false;
    }
    return slots.some((slot) =>
      localDayjs.isBetween(slot, slot.add(duration, "minute"), "minute", "[)"),
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <CardTitle>
              <Trans i18nKey="calendar">Calendar</Trans>
            </CardTitle>
            <CardDescription>
              <Trans
                i18nKey="selectPotentialDates"
                values={{ title: searchParams.get("title") }}
              >
                Select potential dates for your event
              </Trans>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Dialog {...dateOrTimeRangeDialog.dialogProps}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Trans i18nKey="mixedOptionsTitle" />
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm">
            <Trans i18nKey="mixedOptionsDescription" />
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setValue(
                  "options",
                  watchOptions.filter((option) => option.type === "date"),
                );
                setValue("timeZone", "");
                dateOrTimeRangeDialog.dismiss();
              }}
            >
              <Trans i18nKey="mixedOptionsKeepDates" />
            </Button>
            <Button
              onClick={() => {
                setValue(
                  "options",
                  watchOptions.filter((option) => option.type === "timeSlot"),
                );
                if (!watchTimeZone) {
                  setValue("timeZone", getBrowserTimeZone());
                }
                dateOrTimeRangeDialog.dismiss();
              }}
              variant="primary"
            >
              <Trans i18nKey="mixedOptionsKeepTimes" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <FormField
          control={form.control}
          name="options"
          rules={{
            validate: (options) => {
              return options.length > 0
                ? true
                : t("calendarHelp", {
                    defaultValue:
                      "You can't create a poll without any options. Add at least one option to continue.",
                  });
            },
          }}
          render={({ field }) => (
            <div>
              <selectedView.Component
                options={field.value}
                date={navigationDate}
                onNavigate={(date) => {
                  setValue("navigationDate", date.toISOString());
                }}
                onChange={(options) => {
                  field.onChange(options);
                }}
                duration={duration}
                onChangeDuration={(duration) => {
                  setValue("duration", duration);
                }}
                isAvailableSlot={isAvailableSlot}
                isWithinAvailableSlot={isWithinAvailableSlot}
                min={minTime}
                max={maxTime}
                step={step}
              />
              {formState.errors.options ? (
                <div className="border-t p-3 text-center text-destructive">
                  <FormMessage />
                </div>
              ) : null}
            </div>
          )}
        />
      </div>
      {children}
    </Card>
  );
};

export default React.memo(PollOptionsForm);
