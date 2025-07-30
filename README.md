# Crypto Crash Game Backend API Documentation

This document describes the REST API endpoints of the Crypto Crash game backend server. The server manages user registration, buying cryptocurrencies, placing bets, cashing out, and wallet retrieval.

Base URL for all APIs:  `https://cryptocrash-game-api.onrender.com`

## 1. Register User

**POST** `/register`

Register a new user with a username and optionally specify a starting USD balance.

### Request Body

```json
{
  "username": "testplayer0",
  "usdBalance": 100
}
```

- `username` (string, required): The user's display name.
- `usdBalance` (number, optional): Initial USD balance to start with (default is 100 if omitted).

### Response

```json
{
  "success": true,
  "userId": "688a5f9108fac7fc4e03b1c5",
  "username": "testplayer0",
  "usdBalance": 100
}
```

- `success` (boolean): Indicates successful registration.
- `userId` (string): Unique user identifier.
- `username` (string): Registered user name.
- `usdBalance` (number): Starting USD balance.

## 2. Buy Cryptocurrency

**POST** `/buy`

Buy a specific amount of cryptocurrency (BTC or ETH) using USD balance.

### Request Body

```json
{
  "userId": "688a5f9108fac7fc4e03b1c5",
  "usd": 20,
  "currency": "BTC"
}
```

- `userId` (string, required): Unique user identifier.
- `usd` (number, required): USD amount to spend.
- `currency` (string, required): Cryptocurrency symbol to buy, must be `"BTC"` or `"ETH"`.

### Response

```json
{
  "success": true,
  "cryptoAmount": 0.0001699697453853214,
  "remainingUsd": 81.99204264327068
}
```

- `success` (boolean): Indicates successful purchase.
- `cryptoAmount` (number): Amount of cryptocurrency bought.
- `remainingUsd` (number): Updated USD balance after purchase.

## 3. Get Wallet Information

**GET** `/wallet/:userId`

Fetch the wallet details including available and locked crypto balances and their USD equivalent.

### URL Parameters

- `userId` (string, required): Unique user identifier.

### Response

```json
{
  "usdBalance": 81.99,
  "BTC": {
    "available": 0.0001699697453853214,
    "locked": 0,
    "totalUsd": 20
  },
  "ETH": {
    "available": 0,
    "locked": 0,
    "totalUsd": 0
  }
}
```

- `usdBalance` (number): Current USD balance.
- For each cryptocurrency (BTC, ETH):
  - `available` (number): Crypto amount available to use.
  - `locked` (number): Crypto amount locked in bets.
  - `totalUsd` (number): USD value of total crypto (available + locked).

## 4. Place a Bet

**POST** `/bet`

Place a bet by locking a certain amount of cryptocurrency for the current crash round.

### Request Body

```json
{
  "userId": "688a5f9108fac7fc4e03b1c5",
  "cryptoAmount": 0.0001699697453853214,
  "currency": "BTC"
}
```

- `userId` (string, required): Unique user identifier.
- `cryptoAmount` (number, required): Amount of cryptocurrency to bet.
- `currency` (string, required): Cryptocurrency type, either `"BTC"` or `"ETH"`.

### Response

```json
{
  "success": true,
  "cryptoAmount": 0.0001699697453853214
}
```

- `success` (boolean): Indicates successful bet placement.
- `cryptoAmount` (number): Amount of crypto locked as bet.

## 5. Cash Out

**POST** `/cashout`

Cash out the current bet to secure profits before the crash.

### Request Body

```json
{
  "userId": "688a5f9108fac7fc4e03b1c5"
}
```

- `userId` (string, required): Unique user identifier.

### Response

```json
{
  "success": true,
  "usdPayout": 20.41,
  "profit": 0.4,
  "originalBet": 20.01,
  "cashoutMultiplier": 1.04,
  "crashPoint": 3.23
}
```

- `success` (boolean): Indicates successful cashout.
- `usdPayout` (number): USD amount awarded after cashout.
- `profit` (number): Profit earned in USD (payout minus original bet).
- `originalBet` (number): USD value of the original bet.
- `cashoutMultiplier` (number): Multiplier at the moment of cashout.
- `crashPoint` (number): Crash multiplier for that round.

# Notes and Error Handling

- All endpoints respond with standard HTTP status codes:
  - `200 OK` for success.
  - `400 Bad Request` for invalid request parameters.
  - `404 Not Found` when user or resource doesn't exist.
  - `500 Internal Server Error` for unexpected server errors.

- The backend locks cryptocurrency amounts on bet placement and unlocks or settles on cashout or crash.

- Cryptocurrency prices are fetched live and cached internally.

- Use WebSocket (Socket.io) for real-time updates on multiplier and round events (not covered in this README).

# How to Run

1. Start MongoDB locally or remotely.
2. Configure `.env` with `MONGO_URI` pointing to your MongoDB database.
3. Run the backend server with Node.js (e.g., `node server.js`).
4. Use the above REST API endpoints to interact with the game backend.

If you need help with the frontend code or WebSocket real-time interactions, please refer to the frontend documentation or ask for assistance.

This README should help developers or testers understand and use your backend API effectively. Let me know if you want it in markdown file format or with extra sections!
