// Rendering and drawing functions

// Draw game elements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw accelerator based on shape
    drawAccelerator(centerX, centerY);
    
    // Draw particles and effects
    drawParticles();
    drawClickEffects();
}

// Draw the accelerator based on selected shape
function drawAccelerator(centerX, centerY) {
    // Get magnets positions
    const magnets = calculateMagnetPositions();
	drawCircularAccelerator(centerX, centerY, magnets);
    
    
    
    // Draw center core (exists for all shapes)
    const coreSize = 15 + (game.acceleratorEfficiency * 5);
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, coreSize
    );
    gradient.addColorStop(0, '#f06292');
    gradient.addColorStop(1, 'rgba(240, 98, 146, 0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Draw circular accelerator
function drawCircularAccelerator(centerX, centerY, magnets) {
    const ringRadius = (canvas.width / 2) * (0.3 + (game.acceleratorSize * 0.1));
    const ringWidth = 5 + (game.acceleratorSize * 2);
    
    // Main ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth;
    ctx.strokeStyle = '#333';
    ctx.stroke();
    
    // Energy glow based on efficiency
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
    ctx.lineWidth = ringWidth * 0.8;
    ctx.strokeStyle = `rgba(79, 195, 247, ${0.1 + (game.acceleratorEfficiency * 0.05)})`;
    ctx.stroke();
    
    // Draw magnets
    drawMagnets(magnets);
}


// Draw magnets
function drawMagnets(magnets) {
    for (const magnet of magnets) {
        // Magnet housing
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 8 + game.acceleratorSize, 0, Math.PI * 2);
        ctx.fillStyle = '#555';
        ctx.fill();
        
        // Magnet center with glow based on power
        const magnetGlow = ctx.createRadialGradient(
            magnet.x, magnet.y, 0,
            magnet.x, magnet.y, 6 + (game.acceleratorSize / 2)
        );
        magnetGlow.addColorStop(0, '#7b1fa2');
        magnetGlow.addColorStop(0.7, '#7b1fa2');
        magnetGlow.addColorStop(1, 'rgba(123, 31, 162, 0.1)');
        
        ctx.beginPath();
        ctx.arc(magnet.x, magnet.y, 4 + (game.acceleratorSize / 2), 0, Math.PI * 2);
        ctx.fillStyle = magnetGlow;
        ctx.fill();
        
        // Add power indicator if magnetPower > 1
        if (game.magnetPower > 1) {
            // Draw magnetic field lines
            const fieldSize = 15 + (game.magnetPower * 5);
            ctx.beginPath();
            ctx.arc(magnet.x, magnet.y, fieldSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(123, 31, 162, ${0.05 + (game.magnetPower * 0.05)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// Draw particles and effects
function drawParticles() {
    // Draw collision effects
    for (const effect of collisionEffects) {
        if (effect.type === 'magnet') {
            // Draw lightning-like effect between magnet and particle
            ctx.beginPath();
            ctx.moveTo(effect.x, effect.y);
            ctx.lineTo(effect.targetX, effect.targetY);
            ctx.strokeStyle = `rgba(${hexToRgb(effect.color)}, ${effect.opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw small glow at both ends
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(effect.color)}, ${effect.opacity})`;
            ctx.fill();
            
            ctx.beginPath();
            ctx.arc(effect.targetX, effect.targetY, 5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(effect.color)}, ${effect.opacity * 0.8})`;
            ctx.fill();
        } else {
            // Standard collision or click effect
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${hexToRgb(effect.color)}, ${effect.opacity})`;
            ctx.fill();
        }
    }
    
    // Draw particles
    for (const particle of game.particles) {
        // Get base color from particle type
        const baseColor = particle.color;
        
        // Calculate color based on speed
        const speedRatio = particle.currentSpeed / (0.5 + (game.particleSpeed * 0.5));
        let particleColor = baseColor;
        
        // Make faster particles glow brighter and change color
        if (speedRatio > 3) {
            // Super fast particles - intense white core with color trail
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(0.2, '#ffcc00');  // Yellow-orange
            gradient.addColorStop(0.4, baseColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            particleColor = gradient;
        } else if (speedRatio > 1.5) {
            // Fast particles - color with white core
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(0.3, baseColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            particleColor = gradient;
        }
        
        // Draw the particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();
        
        // Draw glow around particles - intensity based on speed
        const glowSize = particle.size * (1 + (speedRatio * 0.5));
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${hexToRgb(baseColor)}, ${0.2 + (speedRatio * 0.1)})`;
        ctx.fill();
        
        // Add speed trail for fast particles
        if (speedRatio > 1.5) {
            // Draw a trail behind fast-moving particles
            const trailLength = Math.min(speedRatio * 5, 15); // Cap maximum trail length
            const trailAngle = particle.angle - Math.PI; // Opposite of movement direction
            
            // Create a gradient trail
            const trailGradient = ctx.createLinearGradient(
                particle.x, particle.y,
                particle.x + Math.cos(trailAngle) * trailLength * particle.size,
                particle.y + Math.sin(trailAngle) * trailLength * particle.size
            );
            
            trailGradient.addColorStop(0, `rgba(${hexToRgb(baseColor)}, 0.7)`);
            trailGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(
                particle.x + Math.cos(trailAngle) * trailLength * particle.size,
                particle.y + Math.sin(trailAngle) * trailLength * particle.size
            );
            ctx.lineWidth = particle.size * 2;
            ctx.strokeStyle = trailGradient;
            ctx.stroke();
        }
        
        // Show particle type indicator
        if (Object.values(game.particleTypes).filter(p => p.unlocked).length > 1) {
            // Display a small indicator for particle type
            let typeIndicator = '';
            switch (particle.type) {
                case 'electron':
                    typeIndicator = 'e-';
                    break;
                case 'positron':
                    typeIndicator = 'e+';
                    break;
                case 'muon':
                    typeIndicator = 'μ';
                    break;
                case 'tauon':
                    typeIndicator = 'τ';
                    break;
            }
            
            if (typeIndicator) {
                ctx.font = `${Math.max(8, particle.size * 0.8)}px Arial`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(typeIndicator, particle.x, particle.y);
            }
        }
        
        // Draw direction indicator (small arrow showing direction)
        const arrowLength = particle.size * 2;
        const arrowX = particle.x + Math.cos(particle.angle) * arrowLength;
        const arrowY = particle.y + Math.sin(particle.angle) * arrowLength;
        
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(arrowX, arrowY);
        ctx.strokeStyle = particle.boosted ? '#ffb74d' : baseColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // If particle is boosted, add a special effect
        if (particle.boosted) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffb74d';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // If particle is near a magnet, show magnetic field interaction
        if (particle.nearMagnet) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(123, 31, 162, 0.7)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw speed indicator for fast particles
        if (speedRatio > 1.2) {
            const speedText = `${speedRatio.toFixed(1)}x`;
            ctx.font = '10px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.textAlign = 'center';
            ctx.fillText(speedText, particle.x, particle.y - particle.size * 2);
            
            // For very fast particles, add lap counter
            if (particle.laps > 0 && speedRatio > 2) {
                const lapText = `${particle.laps} lap${particle.laps > 1 ? 's' : ''}`;
                ctx.font = '8px Arial';
                ctx.fillStyle = 'rgba(255, 215, 0, 0.7)'; // Gold color
                ctx.fillText(lapText, particle.x, particle.y - particle.size * 3.5);
            }
        }
    }
}

// Draw click text effects
function drawClickEffects() {
    for (const effect of clickEffects) {
        ctx.font = '16px Arial';
        ctx.fillStyle = effect.color ? 
                       `rgba(${hexToRgb(effect.color)}, ${effect.opacity})` : 
                       `rgba(255, 183, 77, ${effect.opacity})`;
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
    }
}