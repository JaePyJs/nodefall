import type { TowerType } from '../types';
import { TOWER_STATS, TIER_UNLOCKS } from '../constants';

export class TowerPanel {
    private onSelect: (type: TowerType) => void;
    private currentWave: number = 0;

    constructor(onSelect: (type: TowerType) => void) {
        this.onSelect = onSelect;
        this.init();
    }

    private init(): void {
        const panel = document.getElementById('tower-panel');
        if (!panel) return;

        const types: TowerType[] = ['FIREWALL', 'ENCRYPTION', 'OVERLOAD', 'EMP', 'ICE'];
        
        panel.innerHTML = `
            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 5px; border-bottom: 1px solid var(--border-cyan); padding-bottom: 5px;">
                BUILD SYSTEMS
            </div>
        `;

        types.forEach((type, idx) => {
            const stats = TOWER_STATS[type];
            const unlockWave = TIER_UNLOCKS[type];
            const card = document.createElement('div');
            card.className = 'tower-card';
            card.id = `card-${type}`;
            card.dataset.wave = unlockWave.toString();
            card.innerHTML = `
                <div class="tower-name">
                    <span><kbd>${idx + 1}</kbd> ${stats.name}</span>
                    <span class="tower-price">${stats.cost}g</span>
                </div>
                <div class="tower-desc">${stats.description}</div>
                <div class="tower-unlock" style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px;">
                    Unlocks Wave ${unlockWave}
                </div>
            `;
            card.onclick = () => {
                this.onSelect(type);
            };
            panel.appendChild(card);
        });
        
        // Initial unlock check
        this.updateUnlock(1);
    }

    public highlightCard(type: TowerType | null): void {
        document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
        if (type) {
            document.getElementById(`card-${type}`)?.classList.add('selected');
        }
    }

    public updateAffordability(gold: number): void {
        const types: TowerType[] = ['FIREWALL', 'ENCRYPTION', 'OVERLOAD', 'EMP', 'ICE'];
        types.forEach((type) => {
            const card = document.getElementById(`card-${type}`);
            if (card) {
                if (gold < TOWER_STATS[type].cost) {
                    card.classList.add('disabled');
                } else {
                    card.classList.remove('disabled');
                }
            }
        });
    }

    /** Show/hide tower cards based on wave progression */
    public updateUnlock(wave: number): void {
        this.currentWave = wave;
        const types: TowerType[] = ['FIREWALL', 'ENCRYPTION', 'OVERLOAD', 'EMP', 'ICE'];
        types.forEach((type) => {
            const card = document.getElementById(`card-${type}`);
            const unlockEl = card?.querySelector('.tower-unlock') as HTMLElement;
            if (!card || !unlockEl) return;
            
            const unlockWave = TIER_UNLOCKS[type];
            const isUnlocked = wave >= unlockWave;
            
            if (isUnlocked) {
                card.classList.remove('locked');
                card.classList.remove('disabled');
                unlockEl.style.display = 'none';
            } else {
                card.classList.add('locked');
                unlockEl.style.display = 'block';
            }
        });
    }

    public getCurrentWave(): number {
        return this.currentWave;
    }
}
