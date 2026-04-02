"use client";

import { FileSearchIcon } from "lucide-react";
import type * as React from "react";

export interface ComponentProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
}

const ErrorPage: React.FunctionComponent<ComponentProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="inset-0 flex h-full w-full items-center justify-center lg:absolute">
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          {icon || (
            <FileSearchIcon className="mb-4 inline-block size-24 text-gray-400" />
          )}
          <div className="mb-2 font-bold text-3xl text-primary">{title}</div>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
