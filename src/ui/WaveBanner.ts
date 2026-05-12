export class WaveBanner {
    constructor(onStart: () => void) {
        const btn = document.getElementById('start-wave-btn');
        if (btn) btn.onclick = onStart;
    }

    public show(wave: number): void {
        const banner = document.getElementById('wave-banner');
        if (!banner) return;

        const title = banner.querySelector('.banner-title') as HTMLElement;
        const details = document.getElementById('wave-details');
        
        banner.style.display = 'block';
        if (title) title.innerText = `WAVE ${wave} INCOMING`;
        if (details) details.innerText = `Prepare your network defenses.`;
    }

    public hide(): void {
        const banner = document.getElementById('wave-banner');
        if (banner) banner.style.display = 'none';
    }
}
