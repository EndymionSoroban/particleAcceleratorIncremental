// Core game state and functions
const game = {
    energy: 0,
    collisions: 0,
    collisionsPerSecond: 0,
    lastCollisionCount: 0,
    lastUpdateTime: Date.now(),
    
    // Click mechanics
    clickPower: 1,
    clickMultiplier: 1,
	clickBoostPower: 1,
    
    // Basic upgrades
    acceleratorSize: 1,
    acceleratorEfficiency: 1,
    particleCount: 1,
    particleSize: 1,
    particleSpeed: 1,
    autoCollider: 0,
    collisionChance: 0.05, // Base probability of collision (5%)
    
    // Magnet upgrades
    magnetCount: 4,        // Base number of magnets
    magnetPower: 1,        // Magnet boost power multiplier
    
    // Particle types (unlockable)
    particleTypes: {
        electron: {
            unlocked: true,
            spawnRate: 1.0, // Weight relative to other types
            maxCount: 10,   // Max particles of this type
            cost: 0,        // Energy cost to create
            special: false, // No special properties
            color: '#4fc3f7',
            direction: 1    // Clockwise
        },
        positron: {
            unlocked: false,
            spawnRate: 0.5,
            maxCount: 5,
            cost: 10,
            special: true,  // Travels counter-clockwise
            color: '#f06292',
            direction: -1   // Counter-clockwise
        },
        muon: {
            unlocked: false,
            spawnRate: 0.3,
            maxCount: 3,
            cost: 50,
            special: true,  // Higher mass, more stable
            color: '#ba68c8',
            stability: 1.5, // 50% more stable
            direction: 1    // Clockwise
        },
        tauon: {
            unlocked: false,
            spawnRate: 0.2,
            maxCount: 2,
            cost: 100,
            special: true,  // Even higher mass
            color: '#ffd54f',
            stability: 2.0, // 100% more stable
            direction: 1    // Clockwise
        }
    },
    
    // Advanced upgrades
    particleStability: 1,     // Base stability multiplier
    particleDetectors: 0,     // Energy bonus from collisions
    energyRecycling: 0,       // Energy recovery from decay
    researchAssistants: 0,    // Passive energy generation
    
    // Accelerator shape (settings)
    acceleratorShape: 'circle', // circle, oval, figure8, line
    
    // Upgrade level tracking
    upgradeLevel: {
        particleSpawnRate: 1, // Start at level 1
        collisionChance: 1,   // Start at level 1
        acceleratorSize: 1,
        magnetCount: 1,
        magnetPower: 1,
        particleStability: 1,
        particleDetectors: 0,
        energyRecycling: 0,
        researchAssistants: 0
    },
    
    // Particle spawn rate
    particleSpawnRate: 3, // seconds between spawns
    lastSpawnTime: 0,
    maxParticles: 10, // Maximum particles allowed at once
    
    // Achievements
    achievements: {
        firstCollision: false,
        hundredCollisions: false,
        thousandCollisions: false,
        maxSize: false,
        tenParticles: false
    },
    
    // Settings
    settings: {
        spawnWeights: {
            electron: 1.0,
            positron: 0.5,
            muon: 0.3,
            tauon: 0.2
        },
        maxParticlesByType: {
            electron: 10,
            positron: 5,
            muon: 3,
            tauon: 2
        },
        collisionChanceMultiplier: 1.0 // User adjustable multiplier
    },
    
    // Constants
    MAX_ACCELERATOR_SIZE: 5,
    MAX_PARTICLE_COUNT: 30,
    MAX_PARTICLE_SIZE: 5,
    MAX_PARTICLE_SPEED: 5,
    MAX_MAGNET_COUNT: 16,
    MAX_MAGNET_POWER: 5,
    MAX_STABILITY: 5,
    MAX_DETECTORS: 5,
    MAX_RECYCLING: 5,
    MAX_ASSISTANTS: 5,
    ENERGY_PER_COLLISION: 1,
    
    // Particles
    particles: []
};

// Store initial state for proper resets
const INITIAL_STATE = {
    energy: 0,
    collisions: 0,
    collisionsPerSecond: 0,
    lastCollisionCount: 0,
    clickPower: 1,
    clickMultiplier: 1,
	clickBoostPower: 1,
    acceleratorSize: 1,
    acceleratorEfficiency: 1,
    particleCount: 1,
    particleSize: 1,
    particleSpeed: 1,
    autoCollider: 0,
    collisionChance: 0.05,
    magnetCount: 1,
    magnetPower: 1,
    particleStability: 1,
    particleDetectors: 0,
    energyRecycling: 0,
    researchAssistants: 0,
    particleSpawnRate: 3,
    maxParticles: 10,
    acceleratorShape: 'circle'
};

// Canvas setup
const canvas = document.getElementById('acceleratorCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    const gameArea = document.querySelector('.game-area');
    const size = Math.min(gameArea.offsetWidth, gameArea.offsetHeight) * 0.9;
    canvas.width = size;
    canvas.height = size;
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function setupClickHandler() {
    canvas.addEventListener('click', function(event) {
        // Get click position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Calculate center of canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // For simplicity, we'll only keep the circular accelerator logic
        let isValidClick = false;
        
        // Calculate click distance from center
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate ring radius
        const ringRadius = (canvas.width / 2) * (0.3 + (game.acceleratorSize * 0.1));
        const ringWidth = 5 + (game.acceleratorSize * 2);
        
        // Check if click is within the accelerator ring
        isValidClick = Math.abs(distance - ringRadius) <= ringWidth;
        
        if (isValidClick) {
            // Calculate energy gain from click
            const clickEnergy = game.clickPower * game.clickMultiplier;
            game.energy += clickEnergy;
            
            // Create visual click effect
            createClickEffect(x, y, clickEnergy);
            
            // Add small random particle boost
            boostRandomParticle();
        }
    });
}

setupClickHandler();

// Calculate magnet positions based on accelerator shape
function calculateMagnetPositions() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = (canvas.width / 2) * (0.3 + (game.acceleratorSize * 0.1));
    const magnets = [];
	
	for (let i = 0; i < game.magnetCount; i++) {
                const angle = (i / game.magnetCount) * Math.PI * 2;
                magnets.push({
                    x: centerX + Math.cos(angle) * baseRadius,
                    y: centerY + Math.sin(angle) * baseRadius,
                    angle: angle
                });
            }
    
    return magnets;
}

// Update displayed values
function updateStats() {
    document.getElementById('energyValue').textContent = Math.floor(game.energy);
    document.getElementById('collisionsValue').textContent = Math.floor(game.collisions);
    document.getElementById('cpsValue').textContent = game.collisionsPerSecond.toFixed(1);
    document.getElementById('particleCount').textContent = game.particles.length;
    document.getElementById('particleSize').textContent = game.particleSize;
    document.getElementById('particleSpeed').textContent = game.particleSpeed;
    
    // Update energy progress bar
    const nextUpgradeCost = getNextUpgradeCost();
    if (nextUpgradeCost > 0) {
        const progressPercentage = Math.min((game.energy / nextUpgradeCost) * 100, 100);
        document.getElementById('energyProgress').style.width = `${progressPercentage}%`;
    }
    
    // Update click power in stats if we have any click upgrades
    if (game.clickPower > 1 || game.clickMultiplier > 1) {
        // Check if click stats already exist
        let clickStatsElement = document.getElementById('clickStats');
        if (!clickStatsElement) {
            // Create click stats element if it doesn't exist
            clickStatsElement = document.createElement('div');
            clickStatsElement.id = 'clickStats';
            clickStatsElement.className = 'click-stats';
            document.querySelector('.stats').appendChild(clickStatsElement);
        }
        
        // Update click stats text
        const totalClickPower = game.clickPower * game.clickMultiplier;
        clickStatsElement.textContent = `Click Power: ${totalClickPower} energy per click`;
    }
    
    // Update particle spawn rate and max particles stats
    let particleStatsElement = document.getElementById('particleStats');
    if (!particleStatsElement) {
        // Create particle stats element if it doesn't exist
        particleStatsElement = document.createElement('div');
        particleStatsElement.id = 'particleStats';
        particleStatsElement.className = 'particle-stats';
        document.querySelector('.stats').appendChild(particleStatsElement);
    }
    
    // Update particle stats text with collision chance info
    const spawnRatePerSecond = (1 / game.particleSpawnRate).toFixed(1);
    const collisionChancePercent = Math.round(game.collisionChance * 100);
    particleStatsElement.textContent = `Spawn: ${spawnRatePerSecond}/s | Max: ${game.maxParticles} | Collision: ${collisionChancePercent}%`;
    
    // Add magnet stats if we have upgrades
    if (game.magnetCount > 4 || game.magnetPower > 1) {
        let magnetStatsElement = document.getElementById('magnetStats');
        if (!magnetStatsElement) {
            // Create magnet stats element if it doesn't exist
            magnetStatsElement = document.createElement('div');
            magnetStatsElement.id = 'magnetStats';
            magnetStatsElement.className = 'magnet-stats';
            document.querySelector('.stats').appendChild(magnetStatsElement);
        }
        
        // Update magnet stats text
        magnetStatsElement.textContent = `Magnets: ${game.magnetCount} | Power: ${game.magnetPower}x`;
    }
    
    // Add advanced stats if we have those upgrades
    const hasAdvancedUpgrades = game.particleStability > 1 || game.particleDetectors > 0 || 
                              game.energyRecycling > 0 || game.researchAssistants > 0;
    
    if (hasAdvancedUpgrades) {
        let advancedStatsElement = document.getElementById('advancedStats');
        if (!advancedStatsElement) {
            // Create advanced stats element if it doesn't exist
            advancedStatsElement = document.createElement('div');
            advancedStatsElement.id = 'advancedStats';
            advancedStatsElement.className = 'advanced-stats';
            document.querySelector('.stats').appendChild(advancedStatsElement);
        }
        
        // Build stats text
        let statsText = '';
        if (game.particleStability > 1) {
            statsText += `Stability: ${game.particleStability.toFixed(1)}x | `;
        }
        
        if (game.particleDetectors > 0) {
            statsText += `Detectors: ${game.particleDetectors} | `;
        }
        
        if (game.energyRecycling > 0) {
            statsText += `Recycling: ${(game.energyRecycling * 10).toFixed(0)}% | `;
        }
        
        if (game.researchAssistants > 0) {
            statsText += `Assistants: ${game.researchAssistants} | `;
        }
        
        // Remove trailing separator if needed
        if (statsText.endsWith(' | ')) {
            statsText = statsText.slice(0, -3);
        }
        
        // Update advanced stats text
        advancedStatsElement.textContent = statsText;
    }
    
    // Update unlocked particles count
    let unlockedCount = 0;
    for (const type in game.particleTypes) {
        if (game.particleTypes[type].unlocked) {
            unlockedCount++;
        }
    }
    
    if (unlockedCount > 1) {
        let particleTypesElement = document.getElementById('particleTypes');
        if (!particleTypesElement) {
            // Create particle types element if it doesn't exist
            particleTypesElement = document.createElement('div');
            particleTypesElement.id = 'particleTypes';
            particleTypesElement.className = 'particle-types';
            document.querySelector('.stats').appendChild(particleTypesElement);
        }
        
        // Update particle types text
        particleTypesElement.textContent = `Particle Types: ${unlockedCount}/4`;
    }
}

// Save game state
function saveGame() {
    localStorage.setItem('particleGame', JSON.stringify(game));
}

// Load game state
function loadGame() {
    const savedGame = localStorage.getItem('particleGame');
    if (savedGame) {
        const loadedGame = JSON.parse(savedGame);
        
        // Merge particle types to preserve new types that might be added in updates
        if (loadedGame.particleTypes) {
            for (const type in loadedGame.particleTypes) {
                if (game.particleTypes[type]) {
                    game.particleTypes[type] = {
                        ...game.particleTypes[type],
                        ...loadedGame.particleTypes[type]
                    };
                }
            }
            
            // Remove particleTypes from loaded game to prevent overwriting with assign
            delete loadedGame.particleTypes;
        }
        
        // Now assign all other properties
        Object.assign(game, loadedGame);
        
        // Add particle types back to the game state
        if (loadedGame.particleTypes) {
            Object.assign(game.particleTypes, loadedGame.particleTypes);
        }
        
        // Ensure backward compatibility
        // Settings and new properties
        if (!game.settings) {
            game.settings = {
                spawnWeights: {
                    electron: 1.0,
                    positron: 0.5,
                    muon: 0.3,
                    tauon: 0.2
                },
                maxParticlesByType: {
                    electron: 10,
                    positron: 5,
                    muon: 3,
                    tauon: 2
                },
                collisionChanceMultiplier: 1.0
            };
        }
        
        if (game.collisionChance === undefined) {
            game.collisionChance = 0.05;
        }
        
        if (game.magnetCount === undefined) {
            game.magnetCount = 4;
        }
        
        if (game.magnetPower === undefined) {
            game.magnetPower = 1;
        }
        
        if (game.particleStability === undefined) {
            game.particleStability = 1;
        }
        
        if (game.particleDetectors === undefined) {
            game.particleDetectors = 0;
        }
        
        if (game.energyRecycling === undefined) {
            game.energyRecycling = 0;
        }
        
        if (game.researchAssistants === undefined) {
            game.researchAssistants = 0;
        }
        
        if (game.acceleratorShape === undefined) {
            game.acceleratorShape = 'circle';
        }
        
        // Ensure upgradeLevel exists
        if (!game.upgradeLevel) {
            game.upgradeLevel = {
                particleSpawnRate: 1,
                collisionChance: 1,
                acceleratorSize: 1,
                magnetCount: 1,
                magnetPower: 1,
                particleStability: 1,
                particleDetectors: 0,
                energyRecycling: 0,
                researchAssistants: 0
            };
        }
        
        // Reinitialize particles with loaded stats
        initParticles();
    } else {
        initParticles();
    }
    
    generateUpgradeButtons();
    updateStats();
    updateAchievements();
}

// Reset game
document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset your progress?')) {
        // Keep achievements
        const achievements = {...game.achievements};
        
        // Reset all particle types to default unlocked status except electron
        for (const type in game.particleTypes) {
            if (type !== 'electron') {
                game.particleTypes[type].unlocked = false;
            }
        }
        
        // Reset game state using the initial values
        for (const key in INITIAL_STATE) {
            game[key] = INITIAL_STATE[key];
        }
        
        // Reset upgrade levels explicitly
        game.upgradeLevel = {
            particleSpawnRate: 1,
            collisionChance: 1,
            acceleratorSize: 1,
            magnetCount: 1,
            magnetPower: 1,
            particleStability: 1,
            particleDetectors: 0,
            energyRecycling: 0,
            researchAssistants: 0
        };
        
        // Reset settings
        game.settings = {
            spawnWeights: {
                electron: 1.0,
                positron: 0.5,
                muon: 0.3,
                tauon: 0.2
            },
            maxParticlesByType: {
                electron: 10,
                positron: 5,
                muon: 3,
                tauon: 2
            },
            collisionChanceMultiplier: 1.0
        };
        
        // Update timestamp and achievements
        game.lastUpdateTime = Date.now();
        game.lastSpawnTime = 0;
        game.achievements = achievements;
        game.particles = [];
        
        console.log("Game reset complete.");
        
        // Save game immediately after reset to persist these changes
        saveGame();
        
        // Reinitialize
        initParticles();
        generateUpgradeButtons();
        updateStats();
        
        // Remove stats elements
        const statsElements = [
            'clickStats', 'particleStats', 'magnetStats', 
            'advancedStats', 'particleTypes'
        ];
        
        for (const id of statsElements) {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        }
    }
});