# Ulisha Bot

## Prerequisites

- Node.js (>=18.x)
- MySQL

  You can changed the db provider in `prisma/schema.prisma`

- Redis/Valkey
- WhatsApp Account

## Getting started

1. **Clone repo**

   ```sh
   git clone https://github.com/ulisha-limited/ulisha-bot.git
   cd ulisha-bot

   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Setup environment variables**

   ```sh
   cp .env.example .env
   ```

4. **Run Migration**

   ```sh
   npx prisma migrate dev
   ```

5. **Start bot**

   ```sh
   npm run dev
   ```

#### PM2

1. **Build**

   ```
   npm run build
   ```

2. **Start**

   ```
   pm2 start ecosystem.config.js
   ```

#### NodeJS

1. **Build**

   ```
   npm run build
   ```

2. **Start**

   ```
   npm run start
   ```

## License

Ulisha Bot is licensed under the [**Custom Binary Distribution License (v1.0)**](./LICENSE).

This project builds upon the mrepol742/project-canis Template, which is licensed under the
[Apache License](./LICENSE-APACHE).

Unless otherwise noted, all new code, assets, and configurations added for
Ulisha Store are covered by the Custom Binary Distribution License (v1.0).
