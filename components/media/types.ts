/** Serializable slot data handed from the server MediaSlot to client components. */
export type ClientSlot = {
  id: string;
  type: "video" | "image";
  role: string;
  alt: string;
  aspectCss: string;
  loop: boolean;
  durationSec: number | null;
  src: string | null;
  webmSrc: string | null;
  posterSrc: string | null;
  srcSet: string | null;
  width: number | null;
  height: number | null;
};
