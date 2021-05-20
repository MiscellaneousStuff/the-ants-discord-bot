# The Ants Discord Bot

## Setup

Create a `config.js` file in the same directory as `index.js` with the following format:

```javascript
module.exports = {
    token: "<discord bot token>",
    channelId: "<discord text channel id>",
    userId: "<discord user id>"
};
```

## About

Sends a local notification from a users phone to a discord bot for the ants android game.

## Platforms

Currently supports only Android via logcat at the moment.