import { io } from 'socket.io-client'
import { EventBus } from './EventBus.js'

export const socket = io('http://localhost:3001');

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