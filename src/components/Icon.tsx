import { Icon as IconifyIcon } from "@iconify/react";

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
      icon={`solar:${name}`}
      className={className}
      {...(size ? { width: size, height: size } : {})}
      aria-hidden
    />
  );
}
