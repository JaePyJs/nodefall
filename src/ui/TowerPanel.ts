import type { TowerType } from '../types';
import { TOWER_STATS } from '../constants';

export class TowerPanel {
    private onSelect: (type: TowerType) => void;

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

        types.forEach(type => {
            const stats = TOWER_STATS[type];
            const card = document.createElement('div');
            card.className = 'tower-card';
            card.id = `card-${type}`;
            card.innerHTML = `
                <div class="tower-name">
                    <span>${stats.name}</span>
                    <span class="tower-price">${stats.cost}g</span>
                </div>
                <div class="tower-desc">${stats.description}</div>
            `;
            card.onclick = () => {
                this.onSelect(type);
            };
            panel.appendChild(card);
        });
    }

    public highlightCard(type: TowerType | null): void {
        document.querySelectorAll('.tower-card').forEach(c => c.classList.remove('selected'));
        if (type) {
            document.getElementById(`card-${type}`)?.classList.add('selected');
        }
    }

    public updateAffordability(gold: number): void {
        const types: TowerType[] = ['FIREWALL', 'ENCRYPTION', 'OVERLOAD', 'EMP', 'ICE'];
        types.forEach(type => {
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
}
