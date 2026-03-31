import { Button } from "@rallly/ui/button";
import { useDialog } from "@rallly/ui/dialog";
import { Icon } from "@rallly/ui/icon";
import { CalendarCheck2Icon, TableIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { DuplicateDialog } from "@/app/[locale]/(optional-space)/poll/[urlId]/duplicate-dialog";
import { SchedulePollDialog } from "@/components/poll/manage-poll/schedule-poll-dialog";
import { Trans } from "@/components/trans";
import { usePoll } from "@/contexts/poll";
import { DeletePollDialog } from "./manage-poll/delete-poll-dialog";

const ManagePoll: React.FunctionComponent<{
  disabled?: boolean;
}> = ({ disabled }) => {
  const poll = usePoll();
  const router = useRouter();

  const [showDeletePollDialog, setShowDeletePollDialog] = React.useState(false);
  const duplicateDialog = useDialog();
  const scheduleDialog = useDialog();

  return disabled ? null : (
    <>
      <Button
        variant="ghost"
        onClick={() => router.push(`/poll/${poll.id}/edit-options`)}
      >
        <Icon>
          <TableIcon />
        </Icon>
        Edit
      </Button>
      {poll.status === "scheduled" || poll.status === "canceled" ? null : (
        <Button
          variant="ghost"
          disabled={!!poll.event}
          onClick={() => {
            scheduleDialog.trigger();
          }}
        >
          <Icon>
            <CalendarCheck2Icon />
          </Icon>
          <Trans i18nKey="schedulePoll" defaults="Schedule" />
        </Button>
      )}
      <Button
        variant="destructive"
        onClick={() => {
          setShowDeletePollDialog(true);
        }}
      >
        <TrashIcon className="size-4 opacity-75" />
        <Trans i18nKey="delete" />
      </Button>

      <DeletePollDialog
        urlId={poll.adminUrlId}
        open={showDeletePollDialog}
        onOpenChange={setShowDeletePollDialog}
      />
      <DuplicateDialog
        pollId={poll.id}
        pollTitle={poll.title}
        {...duplicateDialog.dialogProps}
      />
      <SchedulePollDialog {...scheduleDialog.dialogProps} />
    </>
  );
};

export default ManagePoll;
