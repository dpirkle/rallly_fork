"use client";
import { Alert, AlertDescription, AlertTitle } from "@rallly/ui/alert";
import { InfoIcon } from "lucide-react";

import { Trans } from "@/components/trans";
import { useUser } from "@/components/user-provider";

export const GuestPollAlert = () => {
  const { user } = useUser();

  if (user?.isGuest === false) {
    return null;
  }
  return (
    <Alert>
      <InfoIcon />
      <AlertTitle>
        <Trans
          i18nKey="guestPollAlertTitle"
          defaults="Your administrator rights can be lost if you clear your cookies"
        />
      </AlertTitle>
      <AlertDescription>
        <p className="text-sm" />
      </AlertDescription>
    </Alert>
  );
};
