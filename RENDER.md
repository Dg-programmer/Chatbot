# Host BABY on Render Free

The Blueprint provisions one Free web service with HTTPS. Render currently provides 750 free instance hours per workspace each calendar month. The service sleeps after 15 minutes without incoming traffic, and the next visit can take about a minute to wake it. If you leave the Render workspace without a payment method, Render pauses free services or new builds when you exhaust the applicable bandwidth or build allowance. [Render Free limits](https://render.com/docs/free)

BABY uses your OpenAI API key for AI replies and analysis. OpenAI bills API usage separately. [OpenAI API billing](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform)

## Deploy and sign in

1. Extract `BABY-Render-source.zip`, then commit and push its contents to a new private repository you control. Put `render.yaml`, `package.json`, and `server.mjs` at the repository root. Keep the `dist/` and `extension/` directories in place, including `dist/baby-page-pet.zip`, which the app serves directly. Keep API keys, passwords, and local `.env` files out of Git.
2. In the Render Dashboard, select **New → Blueprint**. Connect your repository, select its branch, and verify that the proposed `baby-voice` service shows the **Free** plan. [Render Blueprint setup](https://render.com/docs/infrastructure-as-code#setup)
3. When Render prompts for environment values, enter the two credentials below. Render generates `BABY_SESSION_SECRET` automatically. [Render Blueprint environment variables](https://render.com/docs/blueprint-spec#environment-variables)

   | Environment variable | Value |
   | --- | --- |
   | `BABY_OWNER_PASSWORD` | A unique password of at least 12 characters that you will use to sign in to BABY. |
   | `SAATHI_AI_API_KEY` | Your OpenAI API key. |

4. Select **Deploy Blueprint**. Once the service is live, open its `https://…onrender.com` URL and sign in with your owner password. Send a question, attach a small document, and try BABY's microphone and speaker controls to verify the browser experience. The `/healthz` endpoint checks that the server is running.

For an existing Blueprint, enter any missing prompted values in the service's **Environment** tab and deploy again. Render prompts for `sync: false` values when creating a Blueprint. [Render Blueprint environment variables](https://render.com/docs/blueprint-spec#environment-variables)

## Connect the browser pet

1. In the hosted BABY app, open **Browser pet** and download `baby-page-pet.zip`. Unzip it to a folder you can keep.
2. Go to `chrome://extensions` in Chrome or `edge://extensions` in Edge, turn on **Developer mode**, and select **Load unpacked**. Choose the folder containing `manifest.json`. For an existing installation, update the files in the loaded folder and use its **Reload** control on the extensions page.
3. In the hosted BABY app, select **Browser pet → Create connection code**. Open the pet's **Connection settings**, fill in **Hosted BABY URL** and **Pairing code**, and select **Connect**. Allow the pet to access your Render host when the browser asks.
4. Reload an ordinary webpage, open the floating pet, and ask a question about the page. You can also use the pet's attachment, microphone, and speaker controls where supported by the browser.

If Render has put the service to sleep, open the hosted app and wait for it to wake. Connection codes are single-use and expire after five minutes. The pet stays paired for 14 days. Generate a new code from the signed-in app when the pet asks you to reconnect.
