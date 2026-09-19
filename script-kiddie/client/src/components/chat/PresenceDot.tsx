import { cn } from "@/lib/utils";

export function PresenceDot({
  online,
  className,
  withRing = false,
}: {
  online: boolean;
  className?: string;

  withRing?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={online ? "Online" : "Offline"}
      className={cn(
        "block h-2.5 w-2.5 rounded-full border",
        online ? "border-success bg-success" : "border-base-borderStrong bg-transparent",
        withRing && "ring-2 ring-base-panel",
        className
      )}
    />
  );
}
