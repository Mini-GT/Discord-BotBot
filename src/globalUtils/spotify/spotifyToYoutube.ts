import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';
import { getSpotifyId } from './getSpotifyId.js';
import play from 'play-dl';

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyClientId,
  clientSecret: spotifyClientSecret,
});

// Function to convert Spotify track to YouTube search
export async function spotifyToYouTube(spotifyUrl: string) {
  const trackId = getSpotifyId(spotifyUrl);
  if (!trackId) throw new Error('Invalid Spotify URL');

  const data = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(data.body['access_token']);

  const ApiData = await spotifyApi.getTrack(trackId);
  const track = ApiData.body;
  const searchQuery = `${track.name} ${track.artists[0].name}`;

  // Search on YouTube
  const ytResults = await play.search(searchQuery, {
    limit: 1,
  });
  if (ytResults.length === 0) throw new Error('No YouTube results found');

  return {
    youtubeUrl: ytResults[0].url,
    spotifyTrackInfo: track,
  };
}
