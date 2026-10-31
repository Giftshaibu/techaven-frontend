import { Icon as IconifyIcon } from "@iconify/react/offline";
import { solarIcons } from "@/lib/solar-icons";

/**
 * Techaven uses the Solar icon set.
 * Pass the bare Solar name, e.g. <Icon name="cart-large-2-linear" />.
 */
export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  return (
    <IconifyIcon
      icon={solarIcons[name] ?? solarIcons["question-circle-linear"]!}
      className={className}
      {...(size ? { width: size, height: size } : {})}
      aria-hidden
    />
  );
}
