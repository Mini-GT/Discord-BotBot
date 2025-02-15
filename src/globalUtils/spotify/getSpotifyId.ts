// Helper function to extract Spotify ID from URL
export function getSpotifyId(url: string) {
  const matches = url.match(/track\/([a-zA-Z0-9]+)/);
  return matches ? matches[1] : null;
};