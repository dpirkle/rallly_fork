import { cn } from "@rallly/ui";
import { groupBy } from "lodash";
import type * as React from "react";
import type { OptionsAvailable } from "@/components/poll/desktop-poll/poll-header";
import type { ParsedDateTimeOpton } from "@/utils/date-time-utils";
import PollOptions from "./poll-options";

export interface GroupedOptionsProps {
  options: ParsedDateTimeOpton[];
  availabilities: OptionsAvailable;
  editable?: boolean;
  selectedParticipantId?: string;
  group: (option: ParsedDateTimeOpton) => string;
  groupClassName?: string;
}

const GroupedOptions: React.FunctionComponent<GroupedOptionsProps> = ({
  options,
  availabilities,
  editable,
  selectedParticipantId,
  group,
  groupClassName,
}) => {
  const grouped = groupBy(options, group);
  return (
    <div className="select-none divide-y">
      {Object.entries(grouped).map(([day, options]) => {
        return (
          <div key={day}>
            <div
              className={cn(
                "flex border-b bg-muted px-4 py-2 font-medium text-xs uppercase",
                groupClassName,
              )}
            >
              {day}
            </div>
            <PollOptions
              options={options}
              availabilities={availabilities}
              editable={editable}
              selectedParticipantId={selectedParticipantId}
            />
          </div>
        );
      })}
    </div>
  );
};

export default GroupedOptions;
