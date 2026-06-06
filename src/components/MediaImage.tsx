/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

type MediaImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  alt: string;
};

export function MediaImage({ alt, ...props }: MediaImageProps) {
  return <img {...props} alt={alt} />;
}
