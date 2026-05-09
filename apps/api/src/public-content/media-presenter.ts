import { MediaFile, MediaStatus } from "@prisma/client";

type PublicMediaUrls = {
  public_url: string | null;
  thumbnail_url: string | null;
  medium_url: string | null;
  large_url: string | null;
  poster_url: string | null;
  video_url: string | null;
};

export function getPublicMediaUrls(media: MediaFile | null | undefined): PublicMediaUrls {
  if (!media || media.status !== MediaStatus.COMPLETED) {
    return {
      public_url: null,
      thumbnail_url: null,
      medium_url: null,
      large_url: null,
      poster_url: null,
      video_url: null,
    };
  }

  return {
    public_url: media.publicUrl,
    thumbnail_url: media.thumbnailUrl,
    medium_url: media.mediumUrl,
    large_url: media.largeUrl,
    poster_url: media.posterUrl,
    video_url: media.videoUrl,
  };
}

export function getBestImageUrl(media: MediaFile | null | undefined): string | null {
  const urls = getPublicMediaUrls(media);
  return urls.large_url ?? urls.medium_url ?? urls.public_url ?? urls.thumbnail_url;
}

export function getThumbnailUrl(media: MediaFile | null | undefined): string | null {
  const urls = getPublicMediaUrls(media);
  return urls.thumbnail_url ?? urls.medium_url ?? urls.public_url;
}

export function getMediumUrl(media: MediaFile | null | undefined): string | null {
  const urls = getPublicMediaUrls(media);
  return urls.medium_url ?? urls.large_url ?? urls.public_url ?? urls.thumbnail_url;
}
