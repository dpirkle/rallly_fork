## Running

Start it with `pnpm dev`. If it complains about the version of node, use `nvm` to change it (for example, `nvm use 24`).

You can change the version of Node to persist to future shell sessions by doing this: `nvm alias default 24`

It picks up env variables from `.env.local` which has to be in the `apps/web` directory!

If the web page is blank when you access the application, check to see that the port in `.env.local` is set correctly,
especially if you're running cal.com at the same time. Specfically, the port as it appears for `NEXT_PUBLIC_BASE_URL`
and `AUTH_URL`. Also check that the port is correct for `NEXT_PUBLIC_CALCOM_URL`,

## Debugging

Use the `Launch via pnpm dev" option in vscode Run and Debug tab.

## Docker build for Railway:

Before the build, make sure that NEXT_PUBLIC_CALCOM_URL is defined correctly in the .env file. This is needed in order to
have the right base URL for contacting Cal.com available at build time, for client-side code.

To build a new image:

```
docker compose build rallly_selfhosted
docker image tag rallly_fork-rallly_selfhosted dpirkle/rallly_fork-rallly_selfhosted:latest
docker push dpirkle/rallly_fork-rallly_selfhosted:latest
```

Then redeploy the app.

## Creating an account

After signing up on the login page, look in the `verifications` table to get the 6 digit code (since email isn't hooked up).