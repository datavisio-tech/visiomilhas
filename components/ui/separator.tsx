"use client";

import type { HTMLAttributes } from "react";

export default function Separator({
  className = "",
  ...props
}: HTMLAttributes<HTMLHRElement>) {
  return <hr className={`border-slate-200 ${className}`} {...props} />;
}
