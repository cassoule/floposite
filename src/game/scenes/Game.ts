import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class Game extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    playerMap: Object;

    private localPlayerId: string | null = null;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('Game');
    }

    create() {
        this.playerMap = {}

        const map = this.add.tilemap('map');
        const tileset = map.addTilesetImage('tilesheet', 'tileset');

        // Create layers using the tileset
        map.layers.forEach((layerData, layerIndex) => {
            const layer = map.createLayer(layerIndex, tileset, 0, 0);
            layer.setInteractive(); // Enable input correctly for Phaser 3
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        EventBus.on('local-player-id', (id: string) => {
            this.localPlayerId = id;
        });
        EventBus.on('add-player', (id: number, x: number, y: number) => {
            console.log('adding player', id);
            this.addNewPlayer(id, x, y);
        });
        EventBus.on('remove-player', (id: number) => {
            console.log('remove player', id);
            this.removePlayer(id)
        })

        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (!this.localPlayerId) return;

        const speed = 3;
        const player = this.playerMap[this.localPlayerId];
        let moved = false;
        let dx = 0;
        let dy = 0;

        if (this.cursors.left.isDown) {
            dx = -speed;
            moved = true;
        } else if (this.cursors.right.isDown) {
            dx = speed;
            moved = true;
        }

        if (this.cursors.up.isDown) {
            dy = -speed;
            moved = true;
        } else if (this.cursors.down.isDown) {
            dy = speed;
            moved = true;
        }

        if (moved && player) {
            player.x += dx;
            player.y += dy;
            socket.emit('playermove', { x: player.x, y: player.y });
        }

        // Update existing player-moved handler
        EventBus.on('player-moved', (id: string, x: number, y: number) => {
            if (this.playerMap[id] && id !== this.localPlayerId) {
                this.playerMap[id].setPosition(x, y);
            }
        });
    }



    changeScene ()
    {
        this.scene.start('GameOver');
    }

    addNewPlayer(id: number, x: number, y: number): void {
        console.log('adding new player ', id);
        this.playerMap[id] = this.add.sprite(x, y, 'sprite');
    }

    removePlayer(id: number): void {
        this.playerMap[id].delete();
        delete this.playerMap[id];
    }
}
