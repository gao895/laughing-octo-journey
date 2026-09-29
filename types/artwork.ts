/** image is supported in the MVP. video / model are reserved for future releases. */
export type MediaType = 'image' | 'video' | 'model';

export interface Artwork {
  id: string;
  gallery_id: string;
  title: string;
  description: string;
  media_type: MediaType;
  image_url: string;
  thumbnail_url: string;
  /** Original pixel size after optimisation; used to keep the aspect ratio in 3D. */
  width: number;
  height: number;
  order_index: number;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  rotation_y: number | null;
  scale: number | null;
  created_at: string;
  updated_at: string;
}

export type ArtworkUpdate = Partial<
  Pick<
    Artwork,
    | 'title'
    | 'description'
    | 'order_index'
    | 'position_x'
    | 'position_y'
    | 'position_z'
    | 'rotation_y'
    | 'scale'
  >
>;

/** An optimised image ready to be uploaded. */
export interface PreparedImage {
  full: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  /** Suggested title derived from the file name. */
  suggestedTitle: string;
}
