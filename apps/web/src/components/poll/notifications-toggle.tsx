import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@rallly/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rallly/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@rallly/ui/form";
import { Icon } from "@rallly/ui/icon";
import { Input } from "@rallly/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { BellOffIcon, BellRingIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useMount } from "react-use";
import { z } from "zod";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { useTranslation } from "@/i18n/client";
import { trpc } from "@/trpc/client";
import { useFormValidation } from "@/utils/form-validation";
import { usePoll } from "../poll-context";

const NotificationsToggle: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const pathname = usePathname();
  const router = useRouter();

  const { data: watchers } = trpc.polls.getWatchers.useQuery(
    {
      pollId: poll.id,
    },
    {
      staleTime: Number.POSITIVE_INFINITY,
    },
  );

  const { user } = useUser();

  const isWatching = watchers?.some(({ userId }) => userId === user?.id);

  const queryClient = trpc.useUtils();

  const watch = trpc.polls.watch.useMutation({
    onSuccess: () => {
      queryClient.polls.getWatchers.setData(
        { pollId: poll.id },
        (oldWatchers) => {
          if (!oldWatchers || !user) {
            return;
          }
          return [...oldWatchers, { userId: user.id }];
        },
      );
    },
  });

  const unwatch = trpc.polls.unwatch.useMutation({
    onSuccess: () => {
      queryClient.polls.getWatchers.setData(
        { pollId: poll.id },
        (oldWatchers) => {
          if (!oldWatchers) {
            return;
          }
          return oldWatchers.filter(({ userId }) => userId !== user?.id);
        },
      );
    },
  });

  const { t } = useTranslation();
  const [isEmailModalVisible, setIsEmailModalVisible] = React.useState(false);

  return user ? (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            data-testid="notifications-toggle"
            variant="ghost"
            onClick={async () => {
              if (!user || user.isGuest) {
                router.push(
                  `/login?redirectTo=${encodeURIComponent(pathname)}`,
                );
                return;
              }
              // toggle
              if (isWatching) {
                await unwatch.mutateAsync({ pollId: poll.id });
              } else {
                setIsEmailModalVisible(true);
              }
            }}
          >
            {isWatching ? (
              <Icon>
                <BellRingIcon />
              </Icon>
            ) : (
              <Icon>
                <BellOffIcon />
              </Icon>
            )} Notifications
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {!user || user.isGuest ? (
            <Trans
              i18nKey="notificationsGuestTooltip"
              defaults="Create an account or login to turn on notifications"
            />
          ) : isWatching
                  ? `Notifying ${poll.user?.email} (click twice to change email)` : "Notifications are off"}
        </TooltipContent>
      </Tooltip>
      <EmailModal
        open={isEmailModalVisible}
        onOpenChange={setIsEmailModalVisible}
        onSuccess={async() => await watch.mutateAsync({ pollId: poll.id })}
        email={poll.user?.email}
      />
    </>
  ) : null;
};

type EmailForm = {
  email: string;
};

const emailSchema = z.object({
  email: z.email(),
});

const EmailModal = (props: {
  email?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) => {
  const { email, onOpenChange, onSuccess } = props;

  const form = useForm({
    defaultValues: {
      email: email || "",
    },
    resolver: zodResolver(emailSchema),
  });

  const { control, reset, handleSubmit, setFocus, formState } = form;

  useMount(() => {
    setFocus("email", {
      shouldSelect: true,
    });
  });


  const changeEmail = trpc.user.changeEmail.useMutation();

  const handler = React.useCallback<SubmitHandler<EmailForm>>(
    async ({ email }) => {
      await changeEmail.mutateAsync({
        email,
      });
      onOpenChange(false);
      onSuccess()
    },
    [changeEmail, onOpenChange, onSuccess],
  );

  const { requiredString } = useFormValidation();
  const { t } = useTranslation();
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Email Notifications</DialogTitle>
          <DialogDescription>Enter an email address to notify whenever a vote is added to your poll.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="email-notifications" onSubmit={handleSubmit(handler)}>
            <FormField
              control={control}
              name="email"
              rules={{
                validate: requiredString(t("email")),
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input
                      className="w-full"
                      {...field}
                      disabled={formState.isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the email address for notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            disabled={formState.isSubmitting}
            onClick={() => {
              reset();
              props.onOpenChange(false);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            form="email-notifications"
            loading={formState.isSubmitting}
            type="submit"
            variant="primary"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsToggle;
