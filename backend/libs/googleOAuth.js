const { google } = require('googleapis');
require('dotenv').config();

function getOAuth2Client() {
return new google.auth.OAuth2(
process.env.GOOGLE_CLIENT_ID,
process.env.GOOGLE_CLIENT_SECRET,
"http://localhost:5000/auth/google/callback"
);
}

module.exports = { getOAuth2Client };