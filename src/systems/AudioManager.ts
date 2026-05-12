import { Howl } from 'howler';

export class AudioManager {
    private sounds: { [key: string]: Howl } = {};

    constructor() {
        // In a real project, we would load actual files. 
        // For this demo, we'll define the structure.
        // this.sounds['shot'] = new Howl({ src: ['/sounds/shot.mp3'] });
    }

    public play(name: string): void {
        if (this.sounds[name]) {
            this.sounds[name].play();
        }
    }

    // Since I don't have actual sound files, I'll implement a stub 
    // that the user can later fill with assets if they want.
    // Or I could use some procedurally generated sounds if Howler supported it, 
    // but usually it's for file playback.
}
