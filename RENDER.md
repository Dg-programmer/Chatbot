# Host BABY on Render Free

The Blueprint provisions one Free web service with HTTPS. Render currently provides 750 free instance hours per workspace each calendar month. The service sleeps after 15 minutes without incoming traffic, and the next visit can take about a minute to wake it. If you leave the Render workspace without a payment method, Render pauses free services or new builds when you exhaust the applicable bandwidth or build allowance. [Render Free limits](https://render.com/docs/free)

The Blueprint uses Gemini 3.5 Flash-Lite for chat and webpage analysis. Use your own Google AI Studio key from an eligible Free project. Google may use free-tier prompts and responses to improve its products, so use non-confidential material. BABY uses the browser for microphone input and spoken replies. The Gemini connection supports text, including page text from the pet. File attachments and audio uploads require BABY’s OpenAI integration. [Gemini pricing](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite) · [Gemini data terms](https://aistudio.google.com/docs/terms#data-use-unpaid)

## Deploy and sign in

1. Use a GitHub repository you control with `render.yaml`, `package.json`, and `server.mjs` at its root. If you started from the source ZIP, extract and push its contents to that repository. Keep `dist/` and `extension/` in place. The app serves `dist/baby-page-pet.zip` directly. Use `.env.example` for placeholders and keep your local `.env` out of Git.
2. In the Render Dashboard, select **New → Blueprint**. Connect your repository, select its branch, and verify that the proposed `baby-voice` service shows the **Free** plan. [Render Blueprint setup](https://render.com/docs/infrastructure-as-code#setup)
3. When Render prompts for environment values, enter the two credentials below. Render generates `BABY_SESSION_SECRET` automatically. [Render Blueprint environment variables](https://render.com/docs/blueprint-spec#environment-variables)

   | Environment variable | Value |
   | --- | --- |
   | `BABY_OWNER_PASSWORD` | A unique password of at least 12 characters that you will use to sign in to BABY. |
   | `GEMINI_API_KEY` | Your personal Google AI Studio API key. |

4. Select **Deploy Blueprint**. Once the service is live, open its `https://…onrender.com` URL and sign in with your owner password. Send a question and try **Play reply** and the microphone. The `/healthz` endpoint checks that the server is running.

For an existing Blueprint, enter `GEMINI_API_KEY` in the service’s **Environment** tab and select **Save and deploy** after the Blueprint has synced. Render only prompts for `sync: false` values when creating a Blueprint. Keep the **Free** plan selected. The existing owner password still applies. [Render Blueprint environment variables](https://render.com/docs/blueprint-spec#environment-variables)

## Connect the browser pet

1. In the hosted BABY app, open **Browser pet** and download `baby-page-pet.zip`. Unzip it to a folder you can keep.
2. Go to `chrome://extensions` in Chrome or `edge://extensions` in Edge, turn on **Developer mode**, and select **Load unpacked**. Choose the folder containing `manifest.json`. For an existing installation, update the files in the loaded folder and use its **Reload** control on the extensions page.
3. In the hosted BABY app, select **Browser pet → Create connection code**. Open the pet's **Connection settings**, fill in **Hosted BABY URL** and **Pairing code**, and select **Connect**. Allow the pet to access your Render host when the browser asks.
4. Reload an ordinary webpage, open the floating pet, and ask a question about the page. Try the microphone and **Play reply** where supported by the browser.

If Render has put the service to sleep, open the hosted app and wait for it to wake. Connection codes are single-use and expire after five minutes. The pet stays paired for 14 days. Generate a new code from the signed-in app when the pet asks you to reconnect.
