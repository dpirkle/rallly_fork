import { Section } from "@react-email/components";

import type { EmailContext } from "../types";
import { EmailLayout } from "./email-layout";
import { Button } from "./styled-components";

export interface NotificationBaseProps {
  title: string;
  pollUrl: string;
  disableNotificationsUrl: string;
  ctx: EmailContext;
}

export interface NotificationEmailProps extends NotificationBaseProps {
  preview: string;
}

export const NotificationEmail = ({
  pollUrl,
  preview,
  children,
  ctx,
}: React.PropsWithChildren<NotificationEmailProps>) => {
  const { domain } = ctx;
  return (
    <EmailLayout ctx={ctx} preview={preview}>
      {children}
      <Section style={{ marginTop: 32, marginBottom: 32 }}>
        <Button href={pollUrl} color={ctx.primaryColor}>
          {ctx.t("common_viewOn", {
            ns: "emails",
            defaultValue: "View Poll",
            domain,
          })}
        </Button>
      </Section>
    </EmailLayout>
  );
};

export default NotificationEmail;
