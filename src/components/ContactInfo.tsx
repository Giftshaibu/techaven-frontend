export function ContactInfo({ className = "" }: { className?: string }) {
  return (
    <address className={`grid gap-1 text-sm not-italic ${className}`}>
      <a className="flex min-h-11 items-center hover:underline" href="tel:+265983780656">
        +265 983 78 06 56
      </a>
      <a
        className="flex min-h-11 items-center break-all hover:underline"
        href="mailto:techaven.hire@gmail.com"
      >
        techaven.hire@gmail.com
      </a>
      <a className="flex min-h-11 items-center hover:underline" href="https://www.techavenmw.com">
        www.techavenmw.com
      </a>
    </address>
  );
}
