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
        const panel = document.getElementById('info-panel');
        if (!panel) return;
        const content = document.getElementById('info-content');
        if (!content) return;

        if (!tower) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        const isMaxLevel = tower.level >= 3;
        const upgradeStats = isMaxLevel ? null : tower.upgradeStats;
        const upgradeCost = isMaxLevel ? 'MAX' : upgradeStats!.cost;
        const canUpgrade = !isMaxLevel && this.gameState.gold >= (upgradeCost as number);
        const sellValue = Math.floor(tower.totalInvestment * 0.5);

        content.innerHTML = `
            <div class="info-header">${tower.name} LV.${tower.level}</div>
            <div class="info-row"><span>Damage:</span><span id="info-damage">${Math.round(tower.damage)}</span></div>
            <div class="info-row"><span>Range:</span><span id="info-range">${tower.range.toFixed(1)}</span></div>
            <div class="info-row"><span>Fire Rate:</span><span id="info-firerate">${tower.fireRate.toFixed(1)}</span></div>
            <div class="info-row"><span>Kills:</span><span>${tower.killCount}</span></div>
            <div class="info-actions">
                ${isMaxLevel 
                    ? `<button class="btn" disabled>MAX LEVEL</button>`
                    : `<button class="btn" id="upgrade-btn" ${canUpgrade ? '' : 'disabled'}
                        data-new-dmg="${Math.round(upgradeStats!.damage)}"
                        data-new-range="${upgradeStats!.range.toFixed(1)}"
                        data-new-fr="${upgradeStats!.fireRate.toFixed(1)}"
                        data-old-dmg="${Math.round(tower.damage)}"
                        data-old-range="${tower.range.toFixed(1)}"
                        data-old-fr="${tower.fireRate.toFixed(1)}"><kbd>Q</kbd> UPGRADE (${upgradeCost}g)</button>`
                }
                <button class="btn btn-sell" id="sell-btn"><kbd>E</kbd> SELL (${sellValue}g)</button>
            </div>
        `;

        // Wire upgrade button
        const upgradeBtn = document.getElementById('upgrade-btn');
        if (upgradeBtn && !isMaxLevel) {
            upgradeBtn.onclick = () => this.onUpgrade(tower);

            // Hover preview: show new stats on hover
            const damageEl = document.getElementById('info-damage');
            const rangeEl = document.getElementById('info-range');
            const frEl = document.getElementById('info-firerate');

            upgradeBtn.addEventListener('mouseenter', () => {
                if (damageEl) {
                    damageEl.innerHTML = `<span style="color: var(--text-secondary); text-decoration: line-through; font-size: 0.7rem;">${upgradeBtn.dataset.oldDmg}</span> <span style="color: var(--color-green);">→ ${upgradeBtn.dataset.newDmg}</span>`;
                }
                if (rangeEl) {
                    rangeEl.innerHTML = `<span style="color: var(--text-secondary); text-decoration: line-through; font-size: 0.7rem;">${upgradeBtn.dataset.oldRange}</span> <span style="color: var(--color-green);">→ ${upgradeBtn.dataset.newRange}</span>`;
                }
                if (frEl) {
                    frEl.innerHTML = `<span style="color: var(--text-secondary); text-decoration: line-through; font-size: 0.7rem;">${upgradeBtn.dataset.oldFr}</span> <span style="color: var(--color-green);">→ ${upgradeBtn.dataset.newFr}</span>`;
                }
            });

            upgradeBtn.addEventListener('mouseleave', () => {
                if (damageEl) damageEl.textContent = upgradeBtn.dataset.oldDmg || '';
                if (rangeEl) rangeEl.textContent = upgradeBtn.dataset.oldRange || '';
                if (frEl) frEl.textContent = upgradeBtn.dataset.oldFr || '';
            });
        }

        const sellBtn = document.getElementById('sell-btn');
        if (sellBtn) {
            sellBtn.onclick = () => this.onSell(tower);
        }
    }
}
