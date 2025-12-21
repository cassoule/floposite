# FlopoSite

**FlopoSite** is the official web companion for [FlopoBot](https://github.com/cassoule/flopobot_v2). It serves as a dashboard and interactive hub, featuring mini-games and integrations with the bot's ecosystem.

**Live Website :** [floposite.com](https://floposite.com)

## Project Structure
```
├── netlify/functions/  # Serverless functions for backend logic
├── public/             # Static assets (favicons, manifest, etc.)
├── server/             # Local server utilities or shared backend logic
├── src/                # Main Vue.js application source code
│   ├── assets/         # Images and global styles
│   ├── components/     # Reusable Vue components
│   └── views/          # Page definitions (inferred)
└── index.html          # App entry point
```

## Features
* **Mini-Games :** Interactive web-based multiplayer games.
* **Elo Rating System :** Competitive ranking for players.
* **Flopo Coins :** In-app currency for rewards and purchases.
* **Bot Integration :** Seamless interaction with FlopoBot for real-time data and commands.
* **Modern UI :** Fast and responsive interface powered by Vue 3 and Vite.

## Related Project
* [FlopoBot](https://github.com/cassoule/flopobot_v2) - The Discord bot that FlopoSite supports.