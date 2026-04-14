import { Button } from "@rallly/ui/button";
import { Card, CardDescription, CardHeader } from "@rallly/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useDialog,
} from "@rallly/ui/dialog";
import { FormField, FormMessage } from "@rallly/ui/form";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { isMobile } from "react-device-detect";
import { useFormContext } from "react-hook-form";
import { createBreakpoint } from "react-use";
import { Trans } from "@/components/trans";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import type { GetPollApiResponse } from "@/trpc/client/types";
import type { CalcomAvailability } from "@/utils/calcom";
import { fetchCalcomAvailability, getEventTypeSlug } from "@/utils/calcom";
import { getBrowserTimeZone } from "../../../utils/date-time-utils";
import type { NewEventData } from "../types";
import MonthCalendar from "./month-calendar";
import type { DateTimeOption, TimeOption } from "./types";
import WeekCalendar from "./week-calendar";

const useDevice = createBreakpoint({ desktop: 720, mobile: 360 });

export type PollOptionsData = {
  navigationDate: string; // used to navigate to the right part of the calendar
  duration: number; // duration of the event in minutes
  timeZone: string;
  view: string;
  options: DateTimeOption[];
};

interface PollOptionsFormProps {
  poll?: GetPollApiResponse;
}

const PollOptionsForm = ({
  poll,
  children,
}: React.PropsWithChildren<PollOptionsFormProps>) => {
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

  const eventTypeSlug = getEventTypeSlug(poll, useSearchParams());
  const eventTypeInfo = trpc.calcom.get.useQuery({ eventTypeSlug });
  const [isTooSoon, setTooSoon] = React.useState(false);

  const [availability, setAvailability] = React.useState<CalcomAvailability>();
  const [isAllAvailable, setAllAvailable] = React.useState(true);
  React.useEffect(() => {
    const fetchAndSetAvailability = async () => {
      if (eventTypeInfo?.data) {
        const ccAvailability = await fetchCalcomAvailability(
          eventTypeInfo.data,
        );
        setAvailability(ccAvailability);
      }
    };
    fetchAndSetAvailability();
  }, [eventTypeInfo]);

  React.useEffect(() => {
    setAllAvailable(
      watchOptions.every(
        (opt) =>
          availability?.isAvailableSlot(new Date((opt as TimeOption).start)) ??
          true,
      ),
    );
  }, [watchOptions, availability]);

  const watchNavigationDate = watch("navigationDate");
  const navigationDate = React.useMemo(() => {
    if (watchNavigationDate) {
      return new Date(watchNavigationDate);
    } else if (availability) {
      return new Date(availability.earliestGoodSlot);
    } else {
      return undefined;
    }
  }, [watchNavigationDate, availability]);

  React.useEffect(() => {
    if (availability?.earliestGoodSlot) {
      const tooSoon = watchOptions.some((opt) => {
        const start = (opt as TimeOption).start;
        const laDayjs = dayjs(start).tz("America/Los_Angeles", true);
        return laDayjs.isBefore(availability.earliestGoodSlot);
      });
      setTooSoon(tooSoon);
    }
  }, [watchOptions, availability]);

  const device = useDevice();
  const action = poll ? "Save" : "Create Poll";
  const selectTip = "Tip: select bottom-up for overlapping times.";
  const mobileDescription = `Touch and hold to select times, drag up to scroll down to the ${action} button. ${selectTip}`;
  const desktopDescription = `Click on the calendar to select potential times for your adventure. ${selectTip}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div>
            <CardDescription>
              {isMobile ? mobileDescription : desktopDescription}
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
                duration={availability?.duration ?? 60}
                onChangeDuration={(duration) => {
                  setValue("duration", duration);
                }}
                isAvailableSlot={availability?.isAvailableSlot}
                isWithinAvailableSlot={availability?.isWithinAvailableSlot}
                min={availability?.minTime}
                max={availability?.maxTime}
                step={availability?.step}
                device={device}
              />
              {formState.errors.options ? (
                <div className="border-t p-3 text-center text-destructive">
                  <FormMessage />
                </div>
              ) : null}
              {isTooSoon && availability?.earliestGoodSlot ? (
                <div className="border-t p-3 text-center text-destructive">
                  To allow {availability.minPollHours} hours to conduct your
                  poll, and {availability?.minNotice} hours minimum booking
                  notice, consider selecting options at or after{" "}
                  {availability?.earliestGoodSlot.toLocaleString()}.
                </div>
              ) : null}
              {!isAllAvailable ? (
                <div className="border-t p-3 text-center text-destructive">
                  Some times are no longer available.
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
