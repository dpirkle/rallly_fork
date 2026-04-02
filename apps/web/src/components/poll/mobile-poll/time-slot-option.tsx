import { cn } from "@rallly/ui";
import { ClockIcon } from "lucide-react";
import type * as React from "react";
import type { PollOptionProps } from "./poll-option";
import PollOption from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
  isAvailable: boolean;
}

const TimeSlotOption: React.FunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  duration,
  isAvailable,
  ...rest
}) => {
  return (
    <PollOption isAvailable={isAvailable} {...rest}>
      <div
        className={cn("flex items-center gap-x-4 text-sm", {
          "line-through": !isAvailable,
        })}
      >
        <div>{startTime}</div>
        <div className="flex items-center gap-x-1.5 opacity-50">
          <ClockIcon className="size-4" />
          {duration}
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
