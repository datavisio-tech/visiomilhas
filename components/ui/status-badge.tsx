import React from "react";

export default function StatusBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
      {children}
    </span>
  );
}
