import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';

const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyClientId,
  clientSecret: spotifyClientSecret,
});

// Refresh Spotify access token periodically
export async function refreshSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    // Token expires in 1 hour, refresh after 45 minutes
    setTimeout(refreshSpotifyToken, 45 * 60 * 1000);
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    // Retry after 1 minute if failed
    setTimeout(refreshSpotifyToken, 60 * 1000);
  }
}
