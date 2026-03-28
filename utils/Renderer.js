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
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(title, 20, 40);
        
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '14px sans-serif';
        ctx.fillText(`LAP ${session.lap} / ${session.totalLaps} • ${session.weather.toUpperCase()} • GRIP: ${(session.trackGrip || 1).toFixed(2)}`, width - 250, 40);

        // Columns
        ctx.font = 'bold 12px sans-serif';
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
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(d.position || i + 1, 20, y + 25);

            // Team color bar
            const competitor = session.competitors.find(c => c.drivers.d1.driver.id === d.driver.id || c.drivers.d2.driver.id === d.driver.id);
            ctx.fillStyle = competitor?.team?.color || '#ffffff';
            ctx.fillRect(45, y + 10, 4, 20);

            // Driver Name
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
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

    async drawTrackMap(session, trackPath, title = "TRACK MAP") {
        const width = 600;
        const height = 600;
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

        // Parse path into segments for interpolation
        const points = this.parsePath(trackPath);
        if (points.length === 0) return canvas.toBuffer();

        // Draw track outline
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 15;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw cars
        const drivers = session.competitors_sorted || [];
        drivers.forEach(d => {
            if (d.status === 'Retired') return;
            
            const pos = this.getPointOnPath(points, d.progress % 1.0);
            const competitor = session.competitors.find(c => c.drivers.d1.driver.id === d.driver.id || c.drivers.d2.driver.id === d.driver.id);
            const color = competitor?.team?.color || '#ffffff';

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Initials
            ctx.fillStyle = this.getContrastColor(color);
            ctx.font = 'bold 8px Arial';
            ctx.textAlign = 'center';
            const initials = d.driver.name.split(' ').map(n => n[0]).join('').substring(0, 3).toUpperCase();
            ctx.fillText(initials, pos.x, pos.y + 3);
        });

        return canvas.toBuffer();
    }

    parsePath(pathStr) {
        const points = [];
        const commands = pathStr.match(/[MLZ][^MLZ]*/g) || [];
        commands.forEach(cmd => {
            const type = cmd[0];
            const coords = cmd.substring(1).trim().split(/[\s,]+/).map(Number);
            if (type === 'M' || type === 'L') {
                points.push({ x: coords[0], y: coords[1] });
            }
        });
        return points;
    }

    getPointOnPath(points, progress) {
        if (points.length < 2) return { x: 300, y: 300 };
        // Simplified interpolation along segments
        const totalPoints = points.length;
        const index = progress * (totalPoints - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const t = index - lower;

        const p1 = points[lower];
        const p2 = points[upper % totalPoints];

        return {
            x: p1.x + (p2.x - p1.x) * t,
            y: p1.y + (p2.y - p1.y) * t
        };
    }

    async drawWallet(user, username) {
        const width = 500;
        const height = 300;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background Gradient
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Glassmorphism effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(20, 20, width - 40, height - 40);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.strokeRect(20, 20, width - 40, height - 40);

        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(username.toUpperCase(), 40, 70);
        ctx.fillStyle = '#4ecca3';
        ctx.font = '14px Arial';
        ctx.fillText('FINANCIAL ACCOUNT OVERVIEW', 40, 95);

        // Stats boxes
        const drawStat = (x, y, label, value, color) => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(x, y, 140, 80);
            ctx.fillStyle = color;
            ctx.font = 'bold 24px Arial';
            ctx.fillText(value, x + 15, y + 45);
            ctx.fillStyle = '#bbbbbb';
            ctx.font = '12px Arial';
            ctx.fillText(label, x + 15, y + 65);
        };

        drawStat(40, 120, 'TOTAL MONEY', `$${(user.money || 0).toLocaleString()}`, '#ffcc00');
        drawStat(190, 120, 'EXPERIENCE', `${(user.xp || 0)} XP`, '#3498db');
        drawStat(340, 120, 'HISTORY PTS', `${(user.history_points || 0)}`, '#e74c3c');

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'italic 12px Arial';
        ctx.fillText('Perc Fermé Network • Bank Authority', 40, 270);

        return canvas.toBuffer();
    }

    async drawTeamInfo(team, username) {
        const width = 600;
        const height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Base
        ctx.fillStyle = '#0f0f12';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = team.color || '#ffffff';
        ctx.fillRect(0, 0, 10, height);

        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px Arial';
        ctx.fillText(team.name.toUpperCase(), 40, 60);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`PRINCIPAL: ${username.toUpperCase()}`, 40, 85);

        // Perf Bars
        const drawBar = (x, y, label, value, max = 100) => {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(label, x, y - 10);
            ctx.fillStyle = '#222226';
            ctx.fillRect(x, y, 200, 8);
            ctx.fillStyle = team.color || '#ffffff';
            ctx.fillRect(x, y, (value / max) * 200, 8);
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Arial';
            ctx.fillText(value.toFixed(1), x + 210, y + 8);
        };

        drawBar(40, 150, 'AERODYNAMICS', team.aero || 20);
        drawBar(40, 200, 'CHASSIS INTEGRITY', team.chassis || 20);
        drawBar(40, 250, 'POWER UNIT', team.engine_power || 20);
        drawBar(40, 300, 'PIT CREW SKILL', team.pit_crew || 20);
        drawBar(40, 350, 'DURABILITY', team.durability || 20);

        // Budget Circle
        ctx.beginPath();
        ctx.arc(450, 250, 80, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 15;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(450, 250, 80, -Math.PI / 2, (Math.PI * 2 * (team.tier / 10)) - Math.PI / 2);
        ctx.strokeStyle = team.color || '#ffffff';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`TIER ${team.tier}`, 450, 245);
        ctx.font = '12px Arial';
        ctx.fillText(`BUDGET`, 450, 270);

        return canvas.toBuffer();
    }

    async drawGlobalLeaderboard(users, category = 'money') {
        const width = 600;
        const driverHeight = 50;
        const height = 150 + users.length * driverHeight;
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        const grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0, '#f1c40f');
        grad.addColorStop(1, '#e67e22');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, 80);

        ctx.fillStyle = '#000000';
        ctx.font = '900 32px Arial';
        ctx.fillText(`TOP BY ${category.toUpperCase()}`, 30, 52);

        users.forEach((u, i) => {
            const y = 120 + i * driverHeight;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent';
            ctx.fillRect(0, y - 30, width, driverHeight);

            ctx.fillStyle = i < 3 ? '#f1c40f' : '#ffffff';
            ctx.font = 'bold 24px Arial';
            ctx.fillText(i + 1, 30, y + 5);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
            ctx.fillText((u.username || 'unknown').substring(0, 20).toUpperCase(), 80, y + 5);

            const val = category === 'money' ? `$${(u.money || 0).toLocaleString()}` : (category === 'xp' ? `${u.xp} XP` : `${u.history_points} PTS`);
            ctx.fillStyle = '#aaaaaa';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(val, width - 30, y + 5);
            ctx.textAlign = 'left';
        });

        return canvas.toBuffer();
    }

    getContrastColor(hex) {
        if (!hex || hex.length < 7) return '#ffffff';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return yiq >= 128 ? '#000000' : '#ffffff';
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

    async drawProfile(user, team, username) {
        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 800, 450);
        
        ctx.strokeStyle = team ? team.color : '#e74c3c';
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, 800, 450);

        // Header
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px sans-serif';
        ctx.fillText(username.toUpperCase(), 50, 80);
        
        ctx.font = '24px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(team ? `Principal of ${team.name}` : 'Free Agent Principal', 50, 120);

        // Stats boxes
        const drawStat = (label, val, x, y) => {
            ctx.fillStyle = '#222222';
            ctx.beginPath();
            ctx.roundRect(x, y, 220, 100, 10);
            ctx.fill();
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '18px sans-serif';
            ctx.fillText(label, x + 20, y + 40);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px sans-serif';
            ctx.fillText(val, x + 20, y + 80);
        }

        drawStat('💰 BALANCE', `$${(user.money || 0).toLocaleString()}`, 50, 160);
        drawStat('⭐ TOTAL XP', `${(user.xp || 0).toLocaleString()}`, 290, 160);
        drawStat('📜 CAREER PTS', `${(user.history_points || 0).toLocaleString()}`, 530, 160);
        
        if (team) {
            drawStat('🏎️ AERO', `${team.aero?.toFixed(1) || 20}`, 50, 280);
            drawStat('⚙️ ENGINE', `${team.engine_power?.toFixed(1) || 20}`, 290, 280);
            drawStat('🛠️ CHASSIS', `${team.chassis?.toFixed(1) || 20}`, 530, 280);
        }
        return canvas.toBuffer();
    }

    async drawTrackInfo(track, mapBuffer) {
        const canvas = createCanvas(800, 500);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, 800, 500);
        
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 10;
        ctx.strokeRect(0, 0, 800, 500);

        // Map rendering
        if (mapBuffer) {
            const mapImg = await loadImage(mapBuffer);
            ctx.drawImage(mapImg, 400, 50, 350, 350);
        }

        // Text Info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(track.name.toUpperCase(), 50, 70);
        
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(track.location, 50, 100);

        const statsY = 160;
        const drawStat = (label, val, x, y) => {
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(x, y, 160, 80);
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '14px sans-serif';
            ctx.fillText(label, x + 10, y + 25);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillText(val, x + 10, y + 60);
        }

        drawStat('LENGTH', `${track.lengthKm} KM`, 50, statsY);
        drawStat('LAPS', `${track.laps || 50}`, 220, statsY);
        drawStat('CORNERS', `${track.corners || 18}`, 50, statsY + 90);
        drawStat('DRS ZONES', `${track.drsZones}`, 220, statsY + 90);
        
        // Difficulty Bars
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('TYRE WEAR', 50, 380);
        ctx.fillStyle = '#333';
        ctx.fillRect(50, 390, 300, 10);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(50, 390, 300 * track.tyreWearFactor, 10);

        ctx.fillStyle = '#ffffff';
        ctx.fillText('OVERTAKING DIFFICULTY', 50, 430);
        ctx.fillStyle = '#333';
        ctx.fillRect(50, 440, 300, 10);
        ctx.fillStyle = '#3498db';
        ctx.fillRect(50, 440, 300 * track.overtakeDifficulty, 10);

        return canvas.toBuffer();
    }
}

module.exports = { Renderer };
