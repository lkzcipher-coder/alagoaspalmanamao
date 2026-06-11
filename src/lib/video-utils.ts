/**
 * Validates and normalizes YouTube URLs to extract the video ID correctly.
 * Supports:
 * - https://www.youtube.com/watch?v=ID
 * - https://youtu.be/ID
 * - https://www.youtube.com/shorts/ID
 * - https://www.youtube.com/embed/ID
 */
export const getYouTubeInfo = (url: string) => {
  if (!url) return { id: null, isShort: false, normalizedUrl: null };

  // Regex to capture the 11-character video ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  const id = match ? match[1] : null;

  // Check if it's a Shorts URL
  const isShort = url.toLowerCase().includes('/shorts/') || 
                  url.toLowerCase().includes('youtube.com/shorts');

  // Normalize to a standard watch URL for maximum player compatibility
  const normalizedUrl = id ? `https://www.youtube.com/watch?v=${id}` : url;

  return { id, isShort, normalizedUrl };
};

/**
 * Validates if a string is a potentially valid YouTube URL.
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  if (!url) return false;
  const { id } = getYouTubeInfo(url);
  return !!id;
};
