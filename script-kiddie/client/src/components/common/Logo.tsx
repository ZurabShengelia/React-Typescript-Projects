import { cn } from "@/lib/utils";

export function LogoMark({ className, alt = "" }: { className?: string; alt?: string }) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={256}
      height={256}
      draggable={false}
      className={cn("h-7 w-7 shrink-0 select-none object-contain", className)}
    />
  );
}

export function LogoLockup({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className={markClassName} />
      <span className="font-mono text-base font-semibold tracking-tight text-ink">SCRIPT_KIDDIE</span>
    </span>
  );
}
