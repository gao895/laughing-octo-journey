/** image is supported in the MVP. video / model are reserved for future releases. */
export type MediaType = 'image' | 'video' | 'model';

export interface Artwork {
  id: string;
  gallery_id: string;
  title: string;
  description: string;
  /** For group shows: creator of this artwork. Null = the exhibition's 作者名. */
  artist_name: string | null;
  media_type: MediaType;
  /** Image artworks: the image. Video artworks: the poster (first frame). */
  image_url: string;
  thumbnail_url: string;
  /** Video artworks (media_type 'video'): the MP4 file. */
  video_url: string | null;
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
    | 'artist_name'
    | 'order_index'
    | 'position_x'
    | 'position_y'
    | 'position_z'
    | 'rotation_y'
    | 'scale'
  >
>;

/** An optimised image (or a video with its poster frame) ready to be uploaded. */
export interface PreparedImage {
  full: Blob;
  thumbnail: Blob;
  width: number;
  height: number;
  /** Suggested title derived from the file name. */
  suggestedTitle: string;
  /** Set for video artworks: the original MP4 (full/thumbnail are its poster). */
  video?: Blob;
}
