import { io } from 'socket.io-client'
import { EventBus } from './EventBus.js'

export const socket = io('http://localhost:3001');

// Handle initial connection and player creation
socket.on('connect', () => {
  console.log('Connected to server with socket id:', socket.id);
});

socket.on('yourplayer', (data) => {
  console.log('Received own player data:', data);
  EventBus.emit('local-player-id', data.id);
  EventBus.emit('add-player', data.id, data.x, data.y);
});

socket.on('newplayer', (data) => {
  console.log('newplayer', data);
  EventBus.emit('add-player', data.id, data.x, data.y);
});

socket.on('allplayers', (players) => {
  console.log(players);
  players.forEach(player => {
    EventBus.emit('add-player', player.id, player.x, player.y);
  });
});

socket.on('playermoved', (data) => {
  EventBus.emit('player-moved', data.id, data.x, data.y);
});

socket.on('removeplayer', (id) => {
  EventBus.emit('remove-player', id);
});

// Add this new event to handle your own player creation
socket.on('yourplayer', (data) => {
  console.log('yourplayer', data);
  EventBus.emit('local-player-id', data.id);
  EventBus.emit('add-player', data.id, data.x, data.y);
});