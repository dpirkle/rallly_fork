import { FrownIcon } from "lucide-react";
import type * as React from "react";

export interface ComponentProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon: Icon = FrownIcon,
  title,
  description,
}) => {
  return (
    <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <Icon className="mb-4 inline-block size-24 text-muted-foreground" />
          <div className="mb-2 font-bold text-3xl text-foreground">{title}</div>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
