## Running

Start it with `pnpm dev`. If it complains about the version of node, use `nvm` to change it (for example, `nvm use 24`).

You can change the version of Node to persist to future shell sessions by doing this: `nvm alias default 24`

It picks up env variables from `.env.local` which has to be in the `apps/web` directory!

## Debugging

Use the `Launch via pnpm dev" option in vscode Run and Debug tab.

## Docker build for Railway:

Do this before the build:

```cp .env.docker.build apps/web/.env.local
```

And this after:

```cp .env.local apps/web
```

This is needed in order to have the right base URL for the Railway deploy available at build time.

To build a new image:

```
docker compose build rallly_selfhosted
docker image tag rallly_fork-rallly_selfhosted dpirkle/rallly_fork-rallly_selfhosted:latest
docker push dpirkle/rallly_fork-rallly_selfhosted:latest
```

Then go to Railway to redeploy the app.

## Creating an account

After signing up on the login page, look in the `verifications` table to get the 6 digit code (since email isn't hooked up).