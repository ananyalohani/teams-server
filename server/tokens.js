const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

const generateToken = (config) => {
  return new AccessToken(
    config.twilio.accountSid,
    config.twilio.apiKey,
    config.twilio.apiSecret
  );
};

const videoToken = (identity, room, config) => {
  let videoGrant;
  if (room) videoGrant = new VideoGrant({ room });
  else videoGrant = new VideoGrant();

  const token = generateToken(config);
  token.addGrant(videoGrant);
  token.identity = identity;
  return token;
};

module.exports = { videoToken };
