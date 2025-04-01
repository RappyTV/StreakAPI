# LabyMod Streak API

### 1️⃣ Create a config
Just copy the example json using this command:

```bash
cp config.json.example config.json
```

Then you can specify your desired port and enter the credentials to your MongoDB database.

### 2️⃣ Install the dependencies

```
bun i
```

### 3️⃣ Run the API

```bash
# Development mode
bun dev

# Production mode
bun start

# Daemonized
bun i -g pm2
pm2 start --name streakapi src/index.ts --interpreter ~/.bun/bin/bun # or what your bun location is
```