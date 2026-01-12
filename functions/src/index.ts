// FIX: Switched to standard ES module 'import from' syntax.
// The previous 'import = require()' syntax is for CommonJS modules and conflicts
// with this project's ECMAScript module target, causing deployment errors.
import * as functions from "firebase-functions";
import fetch from "node-fetch";
import cors from "cors";

const corsHandler = cors({origin: true});

// IMPORTANT: Your Trakt secrets are now stored in the functions/.env file.
// This file is automatically used by Firebase during deployment.
// It should be added to your .gitignore file to keep it out of source control.

export const traktAuth = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => {
  corsHandler(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const {code, refreshToken, redirectUri} = request.body;
    // The Trakt ID and Secret are loaded from the .env file into process.env
    const clientId = process.env.TRAKT_ID;
    const clientSecret = process.env.TRAKT_SECRET;

    if (!redirectUri) {
      response.status(400).json({error: "Missing 'redirectUri' in request body."});
      return;
    }

    let body: any;

    if (code) {
      // Exchange authorization code for a token
      body = {
        "code": code,
        "client_id": clientId,
        "client_secret": clientSecret,
        "redirect_uri": redirectUri,
        "grant_type": "authorization_code",
      };
    } else if (refreshToken) {
      // Refresh an existing token
      body = {
        "refresh_token": refreshToken,
        "client_id": clientId,
        "client_secret": clientSecret,
        "redirect_uri": redirectUri,
        "grant_type": "refresh_token",
      };
    } else {
      response.status(400).json({error: "Missing 'code' or 'refreshToken' in request body."});
      return;
    }

    try {
      const traktResponse = await fetch("https://api.trakt.tv/oauth/token", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      });

      const responseData = await traktResponse.json() as any;

      if (!traktResponse.ok) {
        functions.logger.error("Trakt API Error:", responseData);
        response.status(traktResponse.status).json({error: responseData.error_description || "Failed to authenticate with Trakt."});
        return;
      }

      response.status(200).json(responseData);
    } catch (error) {
      functions.logger.error("Error in traktAuth function:", error);
      response.status(500).json({error: "An internal server error occurred."});
    }
  });
});