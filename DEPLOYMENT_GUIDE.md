# Perc Fermé Network - Deployment Guide

This guide will walk you through hosting your bot on **Heroku**, setting up **Supabase**, and configuring the **Discord Developer Portal**.

---

## 1. Supabase Database Setup
Supabase is a high-performance PostgreSQL database.

1.  **Create Project**: Go to [supabase.com](https://supabase.com/) and create a new project.
2.  **Run SQL**: In the **SQL Editor**, paste the content of `perc-ferme-bot/supabase_schema.sql` and click **Run**. This will create all necessary tables.
3.  **Get Credentials**:
    *   Go to **Settings** -> **API**.
    *   Copy the **Project URL** (used for `SUPABASE_URL`).
    *   Copy the **service_role** key (used for `SUPABASE_SERVICE_ROLE_KEY`). *Keep this secret!*

---

## 2. Discord Developer Portal Configuration
You've already provided the token. Now set up the app features.

1.  **Applications Dashboard**: Go to [Discord Dev Portal](https://discord.com/developers/applications).
2.  **Bot Permissions**: 
    *   Ensure "Public Bot" is checked if you want others to invite it.
    *   Enable **Guild Intents** (Server Members/Presence if needed, but currently slash-only is fine).
3.  **Add App Button (Profile)**:
    *   Go to **Installation** -> **Default Installation Settings**.
    *   Set **Install Link** to "None" initially.
    *   Then go to **OAuth2** -> **General**.
    *   Set the **Default Authorization Link** to "Custom URL" and use the **Invite Link** below.

---

## 3. Bot Invite Link
Use this link to invite the bot to your server. It includes the required permissions for racing (Embeds & Attachments).

**Invite Link:**
[Invite Perc Fermé Network](https://discord.com/api/oauth2/authorize?client_id=1487436734244454630&permissions=2147600384&scope=bot%20applications.commands)

*(Permissions included: View Channels, Send Messages, Embed Links, Attach Files, Read Message History, Use Slash Commands)*

---

## 4. Heroku Hosting Setup
Heroku allows you to host the bot 24/7.

1.  **Install CLI**: Download and install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).
2.  **Login & Create App**:
    ```bash
    heroku login
    heroku create pf-network-bot
    ```
3.  **Add Buildpacks**:
    Because the bot uses `canvas` to draw racing leaderboards, you **MUST** add the canvas buildpack so Heroku can link library dependencies.
    ```bash
    heroku buildpacks:add heroku/nodejs
    heroku buildpacks:add https://github.com/mojodna/heroku-buildpack-canvas
    ```
4.  **Set Environment Variables**:
    Go to your Heroku dashboard -> **Settings** -> **Config Vars** and add:
    *   `DISCORD_TOKEN`: `MTQ4NzQzNjczNDI0NDQ1NDYzMA...` (your full token)
    *   `CLIENT_ID`: `1487436734244454630`
    *   `SUPABASE_URL`: (Your Supabase URL)
    *   `SUPABASE_SERVICE_ROLE_KEY`: (Your Supabase Service Key)

5.  **Deploy**:
    ```bash
    git add .
    git commit -m "Optimize for Heroku"
    git push heroku main
    ```

6.  **Scale Worker**: 
    Ensure the bot is running as a worker (background process).
    ```bash
    heroku ps:scale worker=1
    ```
