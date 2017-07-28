# 🍅 Votabia

Centralized Pomodoro server built with node.js and emitting on WS. It needs a Redis server to store data.

## Launch

### NPM
```
npm install
REDIS="//127.0.0.1:6379" PORT=8012 node index.js
```

### Docker

```
docker build -t votabia .
docker run -it -e REDIS=//192.168.1.25 --rm -p 8012:8012 votabia
```
