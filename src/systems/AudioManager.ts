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
    private ready: boolean = false;
    private pendingPlays: SoundId[] = [];

    constructor() {
        // Pre-load all sounds
        for (const id of SOUND_IDS) {
            const howl = new Howl({
                src: [`/audio/${id}.wav`],
                volume: 1,
                preload: true,
                html5: false,
                onload: () => {
                    console.log(`[Audio] Loaded: ${id}`);
                },
                onloaderror: (_soundId: number, error: any) => {
                    console.warn(`[Audio] Failed to load ${id}:`, error);
                },
                onplayerror: (_soundId: number, error: any) => {
                    console.warn(`[Audio] Play error for ${id}:`, error);
                    Howler.autoUnlock = true;
                }
            });
            this.sounds.set(id, howl);
        }

        // Restore mute state from localStorage
        const stored = localStorage.getItem('nodefall_muted');
        if (stored === 'true') {
            this.muted = true;
            Howler.mute(true);
        }
        
        this.ready = true;
        
        // Play any sounds that were requested before ready
        this.pendingPlays.forEach(id => this.playNow(id));
        this.pendingPlays = [];
    }

    public play(id: SoundId): void {
        if (this.muted) return;
        
        if (!this.ready) {
            this.pendingPlays.push(id);
            return;
        }
        
        this.playNow(id);
    }
    
    private playNow(id: SoundId): void {
        const howl = this.sounds.get(id);
        if (!howl) {
            console.warn(`[Audio] Sound not found: ${id}`);
            return;
        }
        const state = howl.state();

        if (state === 'loaded') {
            try {
                howl.play();
            } catch (e) {
                console.warn(`[Audio] Play failed for ${id}:`, e);
            }
        } else if (state === 'unloaded') {
            // Try to reload and play
            howl.load();
            howl.once('load', () => {
                if (!this.muted) {
                    howl.play();
                }
            });
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
    
    public stopAll(): void {
        Howler.stop();
    }
}
