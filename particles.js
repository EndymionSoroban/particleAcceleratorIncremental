// Particle management functions

// Count particles by type - defined here to resolve dependency
function countParticlesByType(type) {
    return game.particles.filter(p => p.type === type).length;
}

// Create a new particle
function createParticle(type = null) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let radius, angle, direction;
	radius = (canvas.width / 2) * (0.3 + (game.acceleratorSize * 0.1));
    angle = Math.random() * Math.PI * 2;
    
    
    // Determine particle type
    let particleType = type;
    if (!particleType) {
        // If no type specified, randomly select from unlocked types based on weights
        const unlockedTypes = [];
        const weights = [];
        
        for (const type in game.particleTypes) {
            if (game.particleTypes[type].unlocked) {
                // Check if we have space for this type
                const typeCount = countParticlesByType(type);
                const typeMax = game.settings.maxParticlesByType[type] || 
                                game.particleTypes[type].maxCount;
                
                if (typeCount < typeMax) {
                    unlockedTypes.push(type);
                    weights.push(game.settings.spawnWeights[type] || 
                                game.particleTypes[type].spawnRate);
                }
            }
        }
        
        if (unlockedTypes.length === 0) {
            // Default to electron if no types are available
            particleType = 'electron';
        } else {
            // Weighted random selection
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
            let random = Math.random() * totalWeight;
            
            for (let i = 0; i < weights.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    particleType = unlockedTypes[i];
                    break;
                }
            }
        }
    }
    
    // Get particle properties from type
    const properties = game.particleTypes[particleType];
    direction = properties.direction;
    
    // Calculate particle stability
    const stability = properties.stability ? 
                      properties.stability * game.particleStability : 
                      game.particleStability;
    
    // Calculate starting position on the track
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    // Base speed is affected by both particleSpeed upgrade and accelerator size
    const sizeSpeedBonus = (game.acceleratorSize - 1) * 0.1; // 10% speed bonus per size level
    const baseSpeed = (0.5 + (game.particleSpeed * 0.5)) * (1 + sizeSpeedBonus);
    
    // Particle properties
    return {
        x: x,
        y: y,
        angle: angle + (Math.PI / 2 * direction), // Tangent to the circle
        baseSpeed: baseSpeed,
        currentSpeed: baseSpeed,
        size: 2 + (game.particleSize * 0.5),
        color: properties.color,
        lastCollision: 0,
        direction: direction,
        boosted: false,
        boostTime: 0,
        distanceTraveled: 0,
        creationTime: Date.now(),
        lifespan: 0, // Will be updated as the particle travels
        speedGain: 0, // Track accumulated speed from travel distance
        laps: 0, // Track how many times the particle has gone around
        type: particleType,
        stability: stability, // How resistant it is to decay
        nearMagnet: false, // Track if near a magnet for boost
        lastMagnetBoost: 0, // Time of last magnet boost
        specialParticle: properties.special || false // Special particle type
    };
}

// Create a particle at a specific position for non-circular accelerators
function createCustomParticle(x, y, angle, type = null) {
    const particle = createParticle(type);
    particle.x = x;
    particle.y = y;
    
    // Adjust angle to be tangent to the path at this point
    if (game.acceleratorShape === 'oval') {
        // For oval, angle is already tangential
        particle.angle = angle + (Math.PI / 2 * particle.direction);
    } else if (game.acceleratorShape === 'figure8') {
        // For figure8, need to calculate tangent
        const derivative = {
            x: 2 * Math.cos(angle * 2), // d/dθ[sin(2θ)]
            y: Math.cos(angle)          // d/dθ[sin(θ)]
        };
        const tangentAngle = Math.atan2(derivative.y, derivative.x);
        particle.angle = tangentAngle + (particle.direction > 0 ? 0 : Math.PI);
    } else if (game.acceleratorShape === 'line') {
        // For line, particles move left/right
        particle.angle = angle;
    }
    
    return particle;
}

// Initialize particles
function initParticles() {
    game.particles = [];
    // Start with just one electron
    game.particles.push(createParticle('electron'));
    game.lastSpawnTime = Date.now();
}

// Check if a particle is near a magnet
function isNearMagnet(particle, magnets) {
    for (const magnet of magnets) {
        const dx = particle.x - magnet.x;
        const dy = particle.y - magnet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if particle is close to a magnet
        const magnetInfluenceRadius = 20 + (game.magnetPower * 5); // Size of magnetic field
        if (distance < magnetInfluenceRadius) {
            return { 
                nearMagnet: true, 
                magnetX: magnet.x, 
                magnetY: magnet.y,
                angle: magnet.angle
            };
        }
    }
    
    return { nearMagnet: false };
}

// Update particle positions
function updateParticles() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const now = Date.now();
    
    // Get magnet positions
    const magnets = calculateMagnetPositions();
    
    // Count current particle types
    const particleCounts = {};
    for (const type in game.particleTypes) {
        particleCounts[type] = countParticlesByType(type);
    }
    
    // Check if we need to spawn a new particle
    if (game.particles.length < game.maxParticles && 
        now - game.lastSpawnTime > game.particleSpawnRate * 1000) {
        
        // Check if any particle type has space
        let canSpawn = false;
        for (const type in game.particleTypes) {
            if (game.particleTypes[type].unlocked) {
                const maxForType = game.settings.maxParticlesByType[type] || 
                                  game.particleTypes[type].maxCount;
                if (particleCounts[type] < maxForType) {
                    canSpawn = true;
                    break;
                }
            }
        }
        
        if (canSpawn) {
            game.particles.push(createParticle());
            game.lastSpawnTime = now;
        }
    }

// Calculate base parameters for different accelerator shapes
    let baseRadius, xRadius, yRadius, circumference;
	
	baseRadius = (canvas.width / 2) * (0.3 + (game.acceleratorSize * 0.1));
    circumference = 2 * Math.PI * baseRadius;
    
    
    // Apply passive energy generation from research assistants
    if (game.researchAssistants > 0) {
        const assistantBonus = 0.1 * game.researchAssistants;
        const detectorMultiplier = 1 + (game.particleDetectors * 0.2);
        const recyclingMultiplier = 1 + (game.energyRecycling * 0.5);
        
        // The research assistants generate energy, scaling with other advanced upgrades
        const passiveEnergy = assistantBonus * detectorMultiplier * recyclingMultiplier * game.particles.length * 0.02;
        game.energy += passiveEnergy * (now - game.lastUpdateTime) / 1000;
    }
    
    // Process each particle
    for (let i = game.particles.length - 1; i >= 0; i--) {
        const particle = game.particles[i];
        
        // Update boost state (from clicks)
        if (particle.boosted) {
            // Calculate how much time has passed since the boost started
            const elapsedTime = now - particle.boostTime;
            const boostDuration = 3000; // 3 seconds for the boost to fade out
            
            if (elapsedTime >= boostDuration) {
                // Boost has expired
                particle.currentSpeed = particle.baseSpeed;
                particle.boosted = false;
            } else {
                // Gradually reduce the speed bonus
                const boostRatio = 1 - (elapsedTime / boostDuration);
                const boostAmount = 1.5 * boostRatio; // Maximum boost is 1.5x, reduces linearly
                particle.currentSpeed = particle.baseSpeed * (1 + boostAmount);
            }
        }
        
        // Calculate previous position
        const prevX = particle.x;
        const prevY = particle.y;
        
        // Calculate previous angle for lap detection
        let prevAngle;
        if (game.acceleratorShape === 'circle' || game.acceleratorShape === 'oval') {
            prevAngle = Math.atan2(particle.y - centerY, particle.x - centerX);
        }
        
        // Move particle along its angle
        particle.x += Math.cos(particle.angle) * particle.currentSpeed;
        particle.y += Math.sin(particle.angle) * particle.currentSpeed;
        
        // Calculate distance traveled in this frame
        const dx = particle.x - prevX;
        const dy = particle.y - prevY;
        const frameDist = Math.sqrt(dx * dx + dy * dy);
        
        // Update total distance traveled
        particle.distanceTraveled += frameDist;
        
        // Check for lap completion based on accelerator shape
        if (game.acceleratorShape === 'circle' || game.acceleratorShape === 'oval') {
            const newAngle = Math.atan2(particle.y - centerY, particle.x - centerX);
            // Detect when we cross from -PI to PI (or vice versa) based on direction
            if ((particle.direction > 0 && prevAngle > 0 && newAngle < 0) ||
                (particle.direction < 0 && prevAngle < 0 && newAngle > 0)) {
                particle.laps++;
            }
        } else if (game.acceleratorShape === 'line') {
            // For a line, check if we hit the ends and bounce
            const lineLength = baseRadius;
            const distFromCenter = Math.sqrt(Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2));
            
            if (distFromCenter > lineLength) {
                // Bounce off the end of the line
                particle.angle = (particle.angle + Math.PI) % (2 * Math.PI);
                particle.laps++;
            }
        }
        // Figure 8 lap detection is more complex and would need a specific implementation
        
        // Update particle lifespan
        particle.lifespan = now - particle.creationTime;
        
        // Check for particle decay based on stability
        // Higher stability = longer lifespan
        const baseDecayChance = 0.00001; // Very small base chance
        const stabilityFactor = 1 / particle.stability; // Higher stability = lower decay chance
        const lifespanFactor = particle.lifespan / 60000; // Increases over time (minutes)
        
        // Calculate decay probability for this frame
        const decayProbability = baseDecayChance * stabilityFactor * lifespanFactor;
        
        // Roll for decay
        if (Math.random() < decayProbability) {
            // Particle decays
            
            // Calculate energy recovery from recycling if available
            if (game.energyRecycling > 0) {
                const recyclingRate = 0.1 * game.energyRecycling; // 10% per level
                const recoveredEnergy = 5 * recyclingRate * (1 + (particle.laps * 0.2));
                game.energy += recoveredEnergy;
                
                // Create recycling visual effect
                createRecyclingEffect(particle.x, particle.y, recoveredEnergy);
            }
            
            // Remove the particle
            game.particles.splice(i, 1);
            continue;
        }
        
        // Check if particle is near a magnet and apply speed boost if it is
        const magnetCheck = isNearMagnet(particle, magnets);
        if (magnetCheck.nearMagnet) {
            const timeSinceLastBoost = now - particle.lastMagnetBoost;
            
            // Only boost once every 500ms when passing by a magnet
            if (timeSinceLastBoost > 500) {
                // Boost the particle based on magnet power - IMPROVED to double speed at minimum
                const boostMultiplier = 2 + (game.magnetPower * 0.5); // At least double speed, with 50% more per level
                
                // Speed boost from passing by a magnet
                if (!particle.nearMagnet) {
                    // Just entered magnet field
                    particle.baseSpeed *= boostMultiplier;
                    particle.currentSpeed = particle.baseSpeed;
                    particle.lastMagnetBoost = now;
                    
                    // Create visual effect for magnet boost
                    createMagnetBoostEffect(particle.x, particle.y, magnetCheck.magnetX, magnetCheck.magnetY);
                }
                
                particle.nearMagnet = true;
            }
        } else {
            // Not near any magnet
            particle.nearMagnet = false;
        }
        
        // Increase speed based on distance traveled and accelerator size
        // Use a combination of laps and distance for more noticeable acceleration
        const baseAccelerationFactor = 0.0001 * game.acceleratorSize;
        const lapBonus = particle.laps * 0.1; // Each lap adds 10% speed
        const distanceFactor = particle.distanceTraveled / circumference * 0.05;
        
        // Combined acceleration effect
        particle.speedGain = baseAccelerationFactor * particle.distanceTraveled + lapBonus + distanceFactor;
        
        // Update base speed with acceleration
        const sizeSpeedBonus = (game.acceleratorSize - 1) * 0.1; // 10% speed bonus per size level
        particle.baseSpeed = (0.5 + (game.particleSpeed * 0.5)) * (1 + sizeSpeedBonus) + particle.speedGain;
        
        if (!particle.boosted) {
            particle.currentSpeed = particle.baseSpeed;
        }
        
        // Keep particle on the track based on accelerator shape
        switch (game.acceleratorShape) {
            case 'circle':
                // Circular track
                const dx2 = particle.x - centerX;
                const dy2 = particle.y - centerY;
                const distance = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                
                if (Math.abs(distance - baseRadius) > 1) {
                    const angle = Math.atan2(dy2, dx2);
                    particle.x = centerX + Math.cos(angle) * baseRadius;
                    particle.y = centerY + Math.sin(angle) * baseRadius;
                    
                    // Adjust angle to be tangent to the circle, preserving direction
                    particle.angle = angle + (Math.PI / 2 * particle.direction);
                }
                break;
                
            case 'oval':
                // Elliptical track
                const dx3 = particle.x - centerX;
                const dy3 = particle.y - centerY;
                
                // Calculate angle from center
                const ovalAngle = Math.atan2(dy3, dx3);
                
                // Calculate proper point on ellipse
                const correctX = centerX + Math.cos(ovalAngle) * xRadius;
                const correctY = centerY + Math.sin(ovalAngle) * yRadius;
                
                // Distance from current point to proper ellipse point
                const distFromEllipse = Math.sqrt(Math.pow(particle.x - correctX, 2) + Math.pow(particle.y - correctY, 2));
                
                if (distFromEllipse > 2) {
                    particle.x = correctX;
                    particle.y = correctY;
                    
                    // Calculate tangent to ellipse at this point
                    const tangentAngle = Math.atan2(-xRadius * Math.sin(ovalAngle), yRadius * Math.cos(ovalAngle)) + (Math.PI / 2);
                    particle.angle = particle.direction > 0 ? tangentAngle : tangentAngle + Math.PI;
                }
                break;
                
            case 'figure8':
                // Figure 8 track - more complex path following
                const t = (particle.laps * 2 * Math.PI + 
                          Math.atan2(particle.y - centerY, particle.x - centerX)) % (2 * Math.PI);
                const figure8Radius = (canvas.width / 2) * (0.24 + (game.acceleratorSize * 0.08));
                
                // Calculate proper point on figure 8
                const correctX2 = centerX + Math.sin(t * 2) * figure8Radius;
                const correctY2 = centerY + Math.sin(t) * (figure8Radius * 1.5);
                
                // Distance from current point to proper figure 8 point
                const distFromPath = Math.sqrt(Math.pow(particle.x - correctX2, 2) + Math.pow(particle.y - correctY2, 2));
                
                if (distFromPath > 5) {
                    particle.x = correctX2;
                    particle.y = correctY2;
                    
                    // Calculate tangent direction
                    const dx4 = 2 * Math.cos(t * 2) * figure8Radius;
                    const dy4 = Math.cos(t) * (figure8Radius * 1.5);
                    
                    const tangentAngle2 = Math.atan2(dy4, dx4);
                    particle.angle = particle.direction > 0 ? tangentAngle2 : tangentAngle2 + Math.PI;
                }
                break;
                
            case 'line':
                // Line track - constrain to horizontal line
                if (Math.abs(particle.y - centerY) > 2) {
                    particle.y = centerY;
                }
                
                // Check bounds
                if (particle.x < centerX - baseRadius) {
                    particle.x = centerX - baseRadius;
                    particle.angle = 0; // Go right
                } else if (particle.x > centerX + baseRadius) {
                    particle.x = centerX + baseRadius;
                    particle.angle = Math.PI; // Go left
                }
                break;
        }
        
        // Check for collisions with other particles
        for (let j = i - 1; j >= 0; j--) {
            const otherParticle = game.particles[j];
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Potential collision detected - particles are close enough
            if (distance < particle.size + otherParticle.size) {
                // Prevent multiple collisions in a short time
                if (now - particle.lastCollision > 500 && now - otherParticle.lastCollision > 500) {
                    
                    // Calculate collision probability based on:
                    // 1. Particle size (larger particles = higher chance)
                    // 2. Relative speed (faster particles = higher chance)
                    // 3. Base probability (adjustable parameter - using game.collisionChance now)
                    // 4. User's collision chance multiplier from settings
                    
                    const baseProbability = 0.01; // 1% base chance
                    const sizeModifier = ((particle.size + otherParticle.size) / 4) * 0.2; // Size factor (0-20%)
                    
                    // Calculate relative speed (how fast they're moving toward each other)
                    const relativeSpeed = Math.abs(particle.currentSpeed - otherParticle.currentSpeed) + 
                                         (particle.direction !== otherParticle.direction ? 
                                          particle.currentSpeed + otherParticle.currentSpeed : 0);
                    
                    const speedModifier = Math.min(relativeSpeed / 5, 0.4); // Speed factor (0-40%)
                    
                    // Combined collision probability
                    const collisionProbability = (baseProbability + sizeModifier + speedModifier + game.collisionChance) * 
                                              game.settings.collisionChanceMultiplier;
                    
                    // Roll the dice for collision
                    if (Math.random() < collisionProbability) {
                        // Collision happens!
                        particle.lastCollision = now;
                        otherParticle.lastCollision = now;
                        
                        // Calculate combined speed for collision energy
                        const combinedSpeed = particle.currentSpeed + otherParticle.currentSpeed;
                        
                        // Calculate collision energy based on speed and size
                        // Energy = speed * size * efficiency * detector bonus
                        const speedFactor = combinedSpeed / (0.5 + (game.particleSpeed * 0.5));
                        const sizeFactor = particle.size * otherParticle.size;
                        const detectorBonus = 1 + (game.particleDetectors * 0.2); // 20% bonus per detector level
                        
                        const collisionEnergy = game.ENERGY_PER_COLLISION * 
                                             game.acceleratorEfficiency * 
                                             speedFactor *
                                             sizeFactor *
                                             detectorBonus;
                        
                        // Add energy
                        game.energy += collisionEnergy;
                        game.collisions++;
                        
                        // Create collision effect with size based on energy
                        createCollisionEffect(
                            (particle.x + otherParticle.x) / 2,
                            (particle.y + otherParticle.y) / 2,
                            collisionEnergy
                        );
                        
                        // Check achievements
                        checkAchievements();
                        
                        // Remove both particles after collision
                        game.particles.splice(i, 1);
                        game.particles.splice(j, 1);
                        
                        // Adjust i since we removed particles
                        i--;
                        break;
                    } else {
                        // Particles pass through each other
                        // Create a small "near miss" visual effect
                        createNearMissEffect((particle.x + otherParticle.x) / 2, (particle.y + otherParticle.y) / 2);
                        
                        // Prevent checking for collisions between these particles for a short time
                        particle.lastCollision = now;
                        otherParticle.lastCollision = now;
                    }
                }
            }
        }
    }
}

// Create a subtle visual effect for near misses
function createNearMissEffect(x, y) {
    collisionEffects.push({
        x: x,
        y: y,
        radius: 2,
        maxRadius: 5,
        opacity: 0.3,
        color: '#4fc3f7' // Blue color for near misses
    });
}

// Create visual effect for collisions
function createCollisionEffect(x, y, energy = 1) {
    // Scale effect size with energy
    const effectSize = Math.min(energy, 10) / 2;
    
    collisionEffects.push({
        x: x,
        y: y,
        radius: 1 + effectSize,
        maxRadius: 10 + (effectSize * 5),
        opacity: 1,
        color: energy > 10 ? '#ff5722' : (energy > 5 ? '#ffb74d' : '#fff'), // Brighter colors for higher energy
        type: 'collision'
    });
}

// Create visual effect for magnet boosts
function createMagnetBoostEffect(particleX, particleY, magnetX, magnetY) {
    // Create a lightning-like effect between the magnet and particle
    collisionEffects.push({
        x: particleX,
        y: particleY,
        targetX: magnetX,
        targetY: magnetY,
        radius: 1,
        maxRadius: 5,
        opacity: 0.8,
        color: '#7b1fa2', // Purple color for magnet effects
        type: 'magnet'
    });
}

// Create visual effect for energy recycling
function createRecyclingEffect(x, y, energy) {
    // Create a text element showing the energy recovered
    const effectText = {
        x: x,
        y: y,
        text: `+${energy.toFixed(1)}`,
        opacity: 1,
        ySpeed: -1,
        color: '#aed581' // Green color for recycling
    };
    
    // Add to click effects array
    clickEffects.push(effectText);
}

// Update collision effects
function updateCollisionEffects() {
    for (let i = collisionEffects.length - 1; i >= 0; i--) {
        const effect = collisionEffects[i];
        
        // Different behavior based on effect type
        if (effect.type === 'magnet') {
            // Magnet effect fades more quickly
            effect.opacity -= 0.04;
        } else {
            // Standard collision effect
            effect.radius += 0.5;
            effect.opacity -= 0.02;
        }
        
        // Remove effect when it's fully expanded or faded
        if (effect.opacity <= 0 || (effect.type !== 'magnet' && effect.radius >= effect.maxRadius)) {
            collisionEffects.splice(i, 1);
        }
    }
}

// Boost a random particle when clicking
function boostRandomParticle() {
    if (game.particles.length > 0) {
        // Select a random particle
        const randomIndex = Math.floor(Math.random() * game.particles.length);
        const particle = game.particles[randomIndex];
        
        // Set boost status
        particle.boosted = true;
        particle.boostTime = Date.now();
        
        // Apply clickBoostPower
        const boostMultiplier = game.clickBoostPower || 1;
        particle.currentSpeed = particle.baseSpeed * (2.5 * boostMultiplier);
    }
}

// Update click text effects
function updateClickEffects() {
    for (let i = clickEffects.length - 1; i >= 0; i--) {
        const effect = clickEffects[i];
        effect.y += effect.ySpeed;
        effect.opacity -= 0.02;
        
        if (effect.opacity <= 0) {
            clickEffects.splice(i, 1);
        }
    }
}

// Create visual effect for clicks
function createClickEffect(x, y, energy) {
    // Create a text element showing the energy gained
    const effectText = {
        x: x,
        y: y,
        text: `+${energy}`,
        opacity: 1,
        ySpeed: -1.5,
        color: '#ffb74d' // Orange for click energy
    };
    
    // Add to an array of active effects
    clickEffects.push(effectText);
    
    // Also create a ripple effect
    collisionEffects.push({
        x: x,
        y: y,
        radius: 5,
        maxRadius: 25,
        opacity: 0.8,
        color: '#ffb74d',
        type: 'click'
    });
};