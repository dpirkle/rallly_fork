"use client";
import { Button } from "@rallly/ui/button";
import { Form } from "@rallly/ui/form";
import { toast } from "@rallly/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { useUnmount } from "react-use";
import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";
import { trpc } from "@/trpc/client";
import type { NewEventData } from "./forms";
import { PollOptionsForm } from "./forms";

const required = <T,>(v: T | undefined): T => {
  if (!v) {
    throw new Error("Required value is missing");
  }

  return v;
};

export interface CreatePollPageProps {
  title?: string;
  location?: string;
  description?: string;
  view?: "week" | "month";
}

export const CreatePoll: React.FunctionComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createGuestIfNeeded } = useUser();
  const form = useForm<NewEventData>({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      view: "week",
      options: [],
      hideScores: false,
      hideParticipants: false,
      disableComments: false,
      duration: 60,
    },
  });

  const { clear } = useFormPersist("new-poll", {
    watch: form.watch,
    setValue: form.setValue,
  });

  useUnmount(clear);

  const createPoll = trpc.polls.create.useMutation({
    networkMode: "always",
    onError: (error) => {
      if (error.data?.code === "BAD_REQUEST") {
        toast.error(error.message);
      }
    },
  });

  const eventTypeInfo = trpc.calcom.get.useQuery({
    eventTypeSlug: searchParams.get("eventTypeSlug") ?? "",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (formData) => {
          const title = required(eventTypeInfo.data?.title ?? "");
          await createGuestIfNeeded();
          await createPoll.mutateAsync(
            {
              title: title,
              location: formData?.location?.trim(),
              description: JSON.stringify({
                eventTypeSlug: searchParams.get("eventTypeSlug"),
              }),
              timeZone: "America/Los_Angeles",
              hideParticipants: formData?.hideParticipants,
              disableComments: formData?.disableComments,
              hideScores: formData?.hideScores,
              requireParticipantEmail: formData?.requireParticipantEmail,
              options: required(formData?.options).map((option) => ({
                startDate: option.type === "date" ? option.date : option.start,
                endDate: option.type === "timeSlot" ? option.end : undefined,
              })),
            },
            {
              onSuccess: (res) => {
                router.push(`/poll/${res.id}`);
              },
            },
          );
        })}
      >
        <div className="space-y-4">
          <PollOptionsForm />
          <Button
            loading={form.formState.isSubmitting || createPoll.isSuccess}
            size="lg"
            type="submit"
            className="w-full"
            variant="primary"
          >
            <Trans i18nKey="createPoll" defaults="Create poll" />
          </Button>
        </div>
      </form>
    </Form>
  );
};
