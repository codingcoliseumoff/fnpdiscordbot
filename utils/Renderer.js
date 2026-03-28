const { createCanvas, loadImage } = require('canvas');

class Renderer {
    async drawLeaderboard(session, title = "RACE LEADERBOARD") {
        const width = 600;
        const driverHeight = 40;
        const drivers = session.competitors_sorted || [];
        const height = 100 + drivers.length * driverHeight;
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Header
        ctx.fillStyle = '#1c1c25';
        ctx.fillRect(0, 0, width, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(title, 20, 40);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px Arial';
        ctx.fillText(`LAP ${session.lap} / ${session.totalLaps} • ${session.weather.toUpperCase()} • GRIP: ${(session.trackGrip || 1).toFixed(2)}`, width - 250, 40);

        // Columns
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#555555';
        ctx.fillText('POS', 20, 85);
        ctx.fillText('DRIVER', 60, 85);
        ctx.fillText('GAP', width - 100, 85);

        // Drivers
        drivers.forEach((d, i) => {
            const y = 100 + i * driverHeight;
            
            // Zebra striping
            if (i % 2 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.02)';
                ctx.fillRect(0, y, width, driverHeight);
            }

            // Position
            ctx.fillStyle = d.position <= 3 ? '#ffcc00' : '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(d.position, 20, y + 25);

            // Team color bar
            const competitor = session.competitors.find(c => c.drivers.d1.driver.id === d.driver.id || c.drivers.d2.driver.id === d.driver.id);
            ctx.fillStyle = competitor?.team?.color || '#ffffff';
            ctx.fillRect(45, y + 10, 4, 20);

            // Driver Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(d.driver.name.toUpperCase(), 60, y + 25);

            // Status/Gap
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '14px Arial';
            let statusText = "";
            if (d.status === 'Retired') {
              statusText = `DNF (${d.retirementReason || "Incident"})`;
              ctx.fillStyle = '#ff4444';
            } else if (d.status === 'Finished') {
              statusText = "FINISH";
              ctx.fillStyle = '#44ff44';
            } else if (d.status === 'Pitting') {
              statusText = "PIT";
              ctx.fillStyle = '#ffff44';
            } else {
              statusText = d.position === 1 ? 'LEADER' : `+${d.gapToLeader.toFixed(2)}s`;
            }
            ctx.fillText(statusText, width - 120, y + 25);
            
            // Tyres
            const tyreColor = this.getTyreColor(d.tyreType);
            ctx.fillStyle = tyreColor;
            ctx.beginPath();
            ctx.arc(width - 150, y + 20, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(d.tyreType[0], width - 153, y + 23);
        });

        return canvas.toBuffer();
    }

    getTyreColor(type) {
        switch (type) {
            case 'Soft': return '#bf40bf';
            case 'Medium': return '#ffd300';
            case 'Hard': return '#ffffff';
            case 'Inter': return '#43b02a';
            case 'Wet': return '#003087';
            default: return '#777777';
        }
    }
}

module.exports = { Renderer };
