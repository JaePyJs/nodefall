import { Howl, Howler } from 'howler';

export const SOUND_IDS = [
    'firewall_fire',
    'encryption_fire',
    'overload_fire',
    'emp_fire',
    'ice_fire',
    'enemy_death',
    'wave_start',
    'boss_incoming',
    'core_damage',
    'tower_place',
    'tower_sell',
    'ui_hover',
    'ui_click',
] as const;

export type SoundId = typeof SOUND_IDS[number];

export class AudioManager {
    private sounds: Map<SoundId, Howl> = new Map();
    private muted: boolean = false;

    constructor() {
        for (const id of SOUND_IDS) {
            this.sounds.set(id, new Howl({
                src: [`/audio/${id}.wav`],
                volume: 1,
                preload: true,
                html5: false,
            }));
        }
        const stored = localStorage.getItem('nodefall_muted');
        if (stored === 'true') {
            this.muted = true;
            Howler.mute(true);
        }
    }

    public play(id: SoundId): void {
        if (this.muted) return;
        const howl = this.sounds.get(id);
        if (howl && howl.state() === 'loaded') {
            howl.play();
        }
    }

    public setMuted(muted: boolean): void {
        this.muted = muted;
        Howler.mute(muted);
        localStorage.setItem('nodefall_muted', String(muted));
    }

    public isMuted(): boolean {
        return this.muted;
    }
}