import Image from "next/image";

type VstahLogoProps = {
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function VstahLogo({
  size = 32,
  alt = "VSTAH",
  className = "",
  priority = false
}: VstahLogoProps) {
  return (
    <Image
      src="/logo-vstah-clean.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 object-contain ${className}`.trim()}
    />
  );
}
