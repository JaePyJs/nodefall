import { Tower } from '../entities/Tower';
import { GameState } from '../systems/GameState';

export class InfoPanel {
    private gameState: GameState;
    private onUpgrade: (tower: Tower) => void;
    private onSell: (tower: Tower) => void;

    constructor(gameState: GameState, onUpgrade: (tower: Tower) => void, onSell: (tower: Tower) => void) {
        this.gameState = gameState;
        this.onUpgrade = onUpgrade;
        this.onSell = onSell;
    }

    public update(tower: Tower | null): void {
        const panel = document.getElementById('info-panel')!;
        const content = document.getElementById('info-content')!;

        if (!tower) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        const upgradeCost = tower.level < 3 ? tower.upgradeStats.cost : 'MAX';

        content.innerHTML = `
            <div class="info-header">${tower.name} LV.${tower.level}</div>
            <div class="info-row"><span>Damage:</span><span>${Math.round(tower.damage)}</span></div>
            <div class="info-row"><span>Range:</span><span>${tower.range}</span></div>
            <div class="info-row"><span>Kills:</span><span>${tower.killCount}</span></div>
            <div class="info-actions">
                <button class="btn" id="upgrade-btn" ${tower.level >= 3 || this.gameState.gold < (upgradeCost as number) ? 'disabled' : ''}>
                    UPGRADE (${upgradeCost}g)
                </button>
                <button class="btn btn-sell" id="sell-btn">SELL (${Math.floor(tower.cost * 0.5)}g)</button>
            </div>
        `;

        document.getElementById('upgrade-btn')!.onclick = () => this.onUpgrade(tower);
        document.getElementById('sell-btn')!.onclick = () => this.onSell(tower);
    }
}
