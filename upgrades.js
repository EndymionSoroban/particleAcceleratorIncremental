// Define upgrade categories
const upgradeCategories = [
    {
        id: 'click',
        name: 'Click Upgrades',
        description: 'Upgrades that improve manual clicking'
    },
    {
        id: 'structure',
        name: 'Accelerator Structure',
        description: 'Upgrades that improve the accelerator itself'
    },
    {
        id: 'particle',
        name: 'Particle Upgrades',
        description: 'Upgrades that improve particles and unlocks new types'
    },
    {
        id: 'production',
        name: 'Production Upgrades',
        description: 'Upgrades that improve energy production'
    }
];

// Define upgrades
const upgrades = [
    // Click Upgrades
    {
        id: 'clickPower',
        name: 'Boost Click Power',
        description: 'Increases energy gained from each click',
        baseCost: 5,
        costMultiplier: 1.4,
        maxLevel: 10,
        category: 'click',
        action: function() {
            game.clickPower++;
        }
    },
    {
        id: 'clickMultiplier',
        name: 'Click Multiplier',
        description: 'Multiplies energy gained from clicks',
        baseCost: 10,
        costMultiplier: 2,
        maxLevel: 5,
        category: 'click',
        action: function() {
            game.clickMultiplier *= 2;
        }
    },
    {
		id: 'clickParticleBoost',
		name: 'Click Particle Boost',
		description: 'Clicking the accelerator gives particles an even bigger speed boost',
		baseCost: 15,
		costMultiplier: 1.8,
		maxLevel: 5,
		category: 'click',
		action: function() {
			game.clickBoostPower += 0.5; // Increase boost power by 50% each level
		},
		getLevel: function() {
			// Calculate level based on boost power
			return game.clickBoostPower === undefined ? 1 : Math.round((game.clickBoostPower - 1) / 0.5) + 1;
		}
	},
    
    // Structure Upgrades
    {
        id: 'acceleratorSize',
        name: 'Increase Accelerator Size',
        description: 'Makes the accelerator larger, allowing particles to travel farther and reach higher speeds',
        baseCost: 10,
        costMultiplier: 1.5,
        maxLevel: game.MAX_ACCELERATOR_SIZE,
        category: 'structure',
        action: function() {
            game.acceleratorSize++;
            
            // Update existing particles to benefit from increased size
            for (const particle of game.particles) {
                // Speed boost from larger accelerator (10% per level)
                const sizeSpeedBonus = 0.1; // 10% per level
                particle.baseSpeed *= (1 + sizeSpeedBonus);
                if (!particle.boosted) {
                    particle.currentSpeed = particle.baseSpeed;
                }
            }
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.acceleratorSize = game.acceleratorSize;
        }
    },
    {
        id: 'magnetCount',
        name: 'Additional Magnets',
        description: 'Adds more magnets around the accelerator, increasing the chance of speed boosts',
        baseCost: 15,
        costMultiplier: 1.6,
        maxLevel: 12, // Up to 16 magnets (4 base + 12 upgrades)
        category: 'structure',
        action: function() {
            game.magnetCount++;
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.magnetCount = game.magnetCount - 3; // Adjust for base 4 magnets
        }
    },
    {
        id: 'magnetPower',
        name: 'Magnet Strength',
        description: 'Increases the speed boost provided by magnets',
        baseCost: 20,
        costMultiplier: 1.7,
        maxLevel: game.MAX_MAGNET_POWER,
        category: 'structure',
        action: function() {
            game.magnetPower++;
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.magnetPower = game.magnetPower;
        }
    },
    {
        id: 'acceleratorEfficiency',
        name: 'Enhance Efficiency',
        description: 'Improves energy production from collisions',
        baseCost: 5,
        costMultiplier: 2,
        maxLevel: 10,
        category: 'structure',
        action: function() {
            game.acceleratorEfficiency++;
        }
    },
    
    // Particle Upgrades
    {
        id: 'particleSize',
        name: 'Increase Particle Size',
        description: 'Makes particles larger, increasing collision chance and energy generated',
        baseCost: 10,
        costMultiplier: 1.6,
        maxLevel: game.MAX_PARTICLE_SIZE,
        category: 'particle',
        action: function() {
            game.particleSize++;
            
            // Update existing particles
            for (const particle of game.particles) {
                particle.size = 2 + (game.particleSize * 0.5);
            }
        }
    },
    {
        id: 'particleSpeed',
        name: 'Increase Particle Speed',
        description: 'Makes particles move faster, increasing collision frequency and energy generated',
        baseCost: 10,
        costMultiplier: 1.7,
        maxLevel: game.MAX_PARTICLE_SPEED,
        category: 'particle',
        action: function() {
            game.particleSpeed++;
            
            // Update existing particles
            for (const particle of game.particles) {
                const sizeSpeedBonus = (game.acceleratorSize - 1) * 0.1; // 10% speed bonus per size level
                particle.baseSpeed = 0.5 + (game.particleSpeed * 0.5) * (1 + sizeSpeedBonus) + particle.speedGain;
                if (!particle.boosted) {
                    particle.currentSpeed = particle.baseSpeed;
                }
            }
        }
    },
    {
        id: 'particleSpawnRate',
        name: 'Increase Spawn Rate',
        description: 'Spawns particles more frequently',
        baseCost: 10,
        costMultiplier: 1.6,
        maxLevel: 10,
        category: 'particle',
        action: function() {
            // Update the spawn rate value
            game.particleSpawnRate = Math.max(0.5, game.particleSpawnRate * 0.8);
            
            // Track the level explicitly
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            if (!game.upgradeLevel.particleSpawnRate) {
                game.upgradeLevel.particleSpawnRate = 1;
            }
            game.upgradeLevel.particleSpawnRate++;
        },
        getLevel: function() {
            // If we have an explicit level tracker, use that
            if (game.upgradeLevel && game.upgradeLevel.particleSpawnRate) {
                return game.upgradeLevel.particleSpawnRate;
            }
            
            // For particle spawn rate (special case)
            // Default to level 1 if the rate is approximately 3
            if (Math.abs(game.particleSpawnRate - 3) < 0.01) {
                return 1;
            }
            
            // Calculate what level would produce this rate
            let level = 1;
            let testRate = 3; // Base rate
            
            while (testRate > game.particleSpawnRate + 0.01) {
                testRate = Math.max(0.5, testRate * 0.8);
                level++;
                if (level > 20) break; // Safety check
            }
            
            return level;
        }
    },
    {
        id: 'maxParticles',
        name: 'Increase Max Particles',
        description: 'Allows more particles in the accelerator at once',
        baseCost: 20,
        costMultiplier: 1.8,
        maxLevel: 5,
        category: 'particle',
        action: function() {
            game.maxParticles += 5;
        }
    },
    {
        id: 'unlockPositron',
        name: 'Unlock Positrons',
        description: 'Unlock positrons that travel in the opposite direction, increasing collision chance',
        baseCost: 100,
        costMultiplier: 1,
        maxLevel: 1,
        category: 'particle',
        isVisible: function() {
            return !game.particleTypes.positron.unlocked;
        },
        action: function() {
            game.particleTypes.positron.unlocked = true;
            saveGame(); // Save immediately after unlocking
        },
        getLevel: function() {
            // If it's already unlocked, return maxLevel to indicate completion
            if (game.particleTypes.positron.unlocked) {
                return this.maxLevel;
            }
            // If it's not unlocked, return level 0 (not purchased yet)
            return 0;
        }
    },
    {
        id: 'unlockMuon',
        name: 'Unlock Muons',
        description: 'Unlock muons that are more stable and generate more energy in collisions',
        baseCost: 500,
        costMultiplier: 1,
        maxLevel: 1,
        category: 'particle',
        isVisible: function() {
            return game.particleTypes.positron.unlocked && !game.particleTypes.muon.unlocked;
        },
        action: function() {
            game.particleTypes.muon.unlocked = true;
            saveGame(); // Save immediately after unlocking
        },
        getLevel: function() {
            if (game.particleTypes.muon.unlocked) {
                return this.maxLevel;
            }
            return 0;
        }
    },
    {
        id: 'unlockTauon',
        name: 'Unlock Tauons',
        description: 'Unlock tauons, the heaviest leptons with extreme stability and energy potential',
        baseCost: 2000,
        costMultiplier: 1,
        maxLevel: 1,
        category: 'particle',
        isVisible: function() {
            return game.particleTypes.muon.unlocked && !game.particleTypes.tauon.unlocked;
        },
        action: function() {
            game.particleTypes.tauon.unlocked = true;
            saveGame(); // Save immediately after unlocking
        },
        getLevel: function() {
            if (game.particleTypes.tauon.unlocked) {
                return this.maxLevel;
            }
            return 0;
        }
    },
    {
        id: 'particleStability',
        name: 'Particle Stability',
        description: 'Increases particle lifespan, allowing them to travel longer and reach higher speeds',
        baseCost: 50,
        costMultiplier: 2,
        maxLevel: game.MAX_STABILITY,
        category: 'particle',
        isVisible: function() {
            // Only show after unlocking positrons
            return game.particleTypes.positron.unlocked;
        },
        action: function() {
            // Changed from 0.5 to 1.0 for full level increments
            game.particleStability += 1.0;
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.particleStability++;
        }
    },
    
    // Production Upgrades
    {
        id: 'collisionChance',
        name: 'Improve Collision Chance',
        description: 'Increases the probability of particles colliding when they meet',
        baseCost: 10,
        costMultiplier: 1.5,
        maxLevel: 5,
        category: 'production',
        action: function() {
            // Increase collision chance by 2% (0.02) instead of 5% (0.05)
            game.collisionChance += 0.02;
            
            // Track the level explicitly
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            if (!game.upgradeLevel.collisionChance) {
                game.upgradeLevel.collisionChance = 1;
            }
            game.upgradeLevel.collisionChance++;
        },
        getLevel: function() {
            // If we have an explicit level tracker, use that
            if (game.upgradeLevel && game.upgradeLevel.collisionChance) {
                return game.upgradeLevel.collisionChance;
            }
            
            // Otherwise calculate level based on the current collision chance
            // Default to level 1 if the chance is approximately 0.05 (5%)
            if (Math.abs(game.collisionChance - 0.05) < 0.001) {
                return 1;
            }
            
            // Calculate what level would produce this chance
            let level = 1;
            let testChance = 0.05; // Base chance (5%)
            
            while (testChance < game.collisionChance - 0.001) {
                testChance += 0.02; // Using increment of 2%
                level++;
                if (level > 20) break; // Safety check
            }
            
            return level;
        }
    },
    {
        id: 'autoCollider',
        name: 'Auto Collider',
        description: 'Generates collisions automatically',
        baseCost: 50,
        costMultiplier: 2.5,
        maxLevel: 10,
        category: 'production',
        action: function() {
            game.autoCollider++;
        }
    },
    {
        id: 'particleDetectors',
        name: 'Particle Detectors',
        description: 'Advanced sensors that increase the energy produced from collisions',
        baseCost: 100,
        costMultiplier: 2.2,
        maxLevel: game.MAX_DETECTORS,
        category: 'production',
        isVisible: function() {
            // Only show after unlocking positrons
            return game.particleTypes.positron.unlocked;
        },
        action: function() {
            game.particleDetectors++;
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.particleDetectors = game.particleDetectors;
        }
    },
    {
        id: 'energyRecycling',
        name: 'Energy Recycling',
        description: 'Recover energy when particles decay, scales with particle detectors',
        baseCost: 200,
        costMultiplier: 2.3,
        maxLevel: game.MAX_RECYCLING,
        category: 'production',
        isVisible: function() {
            // Only show after getting at least one particle detector
            return game.particleDetectors >= 1;
        },
        action: function() {
            game.energyRecycling++;
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.energyRecycling = game.energyRecycling;
        }
    },
    {
        id: 'researchAssistants',
        name: 'Research Assistants',
        description: 'Hire assistants to generate passive energy, scales with detectors and recycling',
        baseCost: 300,
        costMultiplier: 2.4,
        maxLevel: game.MAX_ASSISTANTS,
        category: 'production',
        isVisible: function() {
            // Only show after getting energy recycling
            return game.energyRecycling >= 1;
        },
        action: function() {
            game.researchAssistants++;
            
            // Update level tracker
            if (!game.upgradeLevel) {
                game.upgradeLevel = {};
            }
            game.upgradeLevel.researchAssistants = game.researchAssistants;
        }
    }
];

// Generate upgrade buttons with categories
function generateUpgradeButtons() {
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';
    
    // Create category containers
    for (const category of upgradeCategories) {
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'upgrade-category';
        categoryContainer.id = `category-${category.id}`;
        
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <h2>${category.name}</h2>
            <div class="category-description">${category.description}</div>
        `;
        
        categoryContainer.appendChild(categoryHeader);
        
        // Container for the upgrades in this category
        const upgradesContainer = document.createElement('div');
        upgradesContainer.className = 'category-upgrades';
        upgradesContainer.id = `upgrades-${category.id}`;
        
        categoryContainer.appendChild(upgradesContainer);
        upgradesList.appendChild(categoryContainer);
    }
    
    // Add upgrades to their respective categories
    for (const upgrade of upgrades) {
        // Get the level
        let level;
        if (upgrade.getLevel) {
            level = upgrade.getLevel();
        } else if (upgrade.id === 'clickBoostPower') {
            level = game.clickBoostPower || 1;
        } else {
            level = game[upgrade.id];
        }
        
        const maxLevel = upgrade.maxLevel || Infinity;
        
        // Skip if at max level - commenting out to always show upgrades
        // if (level >= maxLevel) {
        //     continue;
        // }
        
        // Calculate cost
        let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
        let costDisplay = `Cost: ${cost} energy`;
        
        // For max level upgrades, show as maxed out
        if (level >= maxLevel) {
            costDisplay = 'MAXED OUT';
        }
        
        // Create the upgrade element
        const upgradeElement = document.createElement('div');
        upgradeElement.className = 'upgrade-item';
        upgradeElement.id = `upgrade-${upgrade.id}`;
        upgradeElement.dataset.id = upgrade.id;
        upgradeElement.dataset.cost = cost;
        
        // Add disabled class if at max level
        if (level >= maxLevel) {
            upgradeElement.classList.add('maxed');
        }
        
        // Level display
        let levelDisplay = '';
        if (upgrade.maxLevel === 1) {
            if (level >= maxLevel) {
                levelDisplay = '(Unlocked)';
            } else {
                levelDisplay = '';
            }
        } else {
            levelDisplay = `(Level ${level}${maxLevel < Infinity ? '/' + maxLevel : ''})`;
        }
        
        upgradeElement.innerHTML = `
            <h3>${upgrade.name} ${levelDisplay}</h3>
            <div class="cost">${costDisplay}</div>
            <div class="description">${upgrade.description}</div>
        `;
        
        // Add click handler only if not maxed
        if (level < maxLevel) {
            upgradeElement.addEventListener('click', function() {
                const upgradeId = this.dataset.id;
                const cost = parseInt(this.dataset.cost);
                purchaseUpgrade(upgradeId, cost);
            });
        }
        
        // Add to category container
        const categoryContainer = document.getElementById(`upgrades-${upgrade.category}`);
        categoryContainer.appendChild(upgradeElement);
    }
}

// Update upgrade buttons (enable/disable based on energy)
function updateUpgradeButtons() {
    for (const upgrade of upgrades) {
        const upgradeElement = document.getElementById(`upgrade-${upgrade.id}`);
        if (!upgradeElement) continue;
        
        const cost = parseInt(upgradeElement.dataset.cost);
        
        // Get level
        let level;
        if (upgrade.getLevel) {
            level = upgrade.getLevel();
        } else if (upgrade.id === 'clickBoostPower') {
            level = game.clickBoostPower || 1;
        } else {
            level = game[upgrade.id];
        }
        
        const maxLevel = upgrade.maxLevel || Infinity;
        
        // Skip if maxed out
        if (level >= maxLevel) {
            upgradeElement.classList.add('maxed');
            continue;
        }
        
        // Make sure cost is a valid number and check if affordable
        if (!isNaN(cost) && game.energy >= cost) {
            upgradeElement.classList.remove('disabled');
        } else {
            upgradeElement.classList.add('disabled');
        }
    }
}

// Get cost of cheapest available upgrade
function getNextUpgradeCost() {
    let minCost = Infinity;
    
    for (const upgrade of upgrades) {
        let level;
        if (upgrade.getLevel) {
            level = upgrade.getLevel();
        } else if (upgrade.id === 'clickBoostPower') {
            level = game.clickBoostPower || 1;
        } else {
            level = game[upgrade.id];
        }
        
        const maxLevel = upgrade.maxLevel || Infinity;
        
        if (level >= maxLevel) continue;
        
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
        if (cost < minCost) {
            minCost = cost;
        }
    }
    
    return minCost !== Infinity ? minCost : 0;
}

// Purchase upgrade
function purchaseUpgrade(upgradeId, cost) {
    // Check if can afford
    if (isNaN(cost) || game.energy < cost) return;
    
    // Find the upgrade
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;
    
    // Pay the cost
    game.energy -= cost;
    
    // Ensure energy doesn't become NaN
    if (isNaN(game.energy)) {
        console.error("Energy became NaN after purchase");
        game.energy = 0; // Reset to prevent cascading errors
    }
    
    // Apply the upgrade
    upgrade.action();
    
    // Flash effect on purchase
    const element = document.getElementById(`upgrade-${upgradeId}`);
    element.classList.add('flash');
    setTimeout(() => {
        element.classList.remove('flash');
        // Regenerate buttons after purchase
        generateUpgradeButtons();
    }, 500);
    
    // Check for achievements
    if (upgradeId === 'acceleratorSize' && game.acceleratorSize >= game.MAX_ACCELERATOR_SIZE) {
        game.achievements.maxSize = true;
        updateAchievements();
    }
    
    // Save game after purchase
    saveGame();
}

// Add CSS for category layout
function addUpgradeStyles() {
    // Check if styles already exist
    if (document.getElementById('upgrade-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'upgrade-styles';
    styleSheet.textContent = `
        .upgrade-category {
            margin-bottom: 20px;
            background-color: #2d2d2d;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .category-header {
            padding: 10px 15px;
            background-color: #333;
            cursor: pointer;
        }
        
        .category-header h2 {
            margin: 0;
            font-size: 1.2em;
            color: #4fc3f7;
        }
        
        .category-description {
            font-size: 0.9em;
            color: #bdbdbd;
            margin-top: 5px;
        }
        
        .category-upgrades {
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 10px;
        }
        
        .upgrade-item.maxed {
            opacity: 0.7;
            background-color: #3a3a3a;
            cursor: default;
        }
        
        .upgrade-item.maxed .cost {
            color: #8BC34A;
        }
        
        /* Special styling for category headers */
        #category-click .category-header h2 {
            color: #ffb74d;
        }
        
        #category-structure .category-header h2 {
            color: #ba68c8;
        }
        
        #category-particle .category-header h2 {
            color: #4fc3f7;
        }
        
        #category-production .category-header h2 {
            color: #aed581;
        }
    `;
    
    document.head.appendChild(styleSheet);
}

// Also need to modify game-core.js to implement the new click boost functionality
function updateGameCore() {
    // This function will be called by the boostRandomParticle function in particles.js
    // Initialize clickBoostPower in the game object if it doesn't exist
    if (game.clickBoostPower === undefined) {
        game.clickBoostPower = 1; // Base value
    }
}

// Add the styles when the game loads
document.addEventListener('DOMContentLoaded', function() {
    addUpgradeStyles();
    updateGameCore();
    
    // Remove progress bar element - this should be called after DOM is loaded
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
});

// Modify boostRandomParticle function (should be called from game-core.js after DOM is loaded)
function modifyBoostRandomParticle() {
    // The original function is in particles.js
    const originalBoostRandomParticle = window.boostRandomParticle;
    
    // Replace it with our enhanced version
    window.boostRandomParticle = function() {
        if (game.particles.length > 0) {
            // Select a random particle
            const randomIndex = Math.floor(Math.random() * game.particles.length);
            const particle = game.particles[randomIndex];
            
            // Set boost status
            particle.boosted = true;
            particle.boostTime = Date.now();
            
            // Apply clickBoostPower if defined, otherwise use default boost
            const boostMultiplier = game.clickBoostPower || 1;
            particle.currentSpeed = particle.baseSpeed * (2.5 * boostMultiplier);
        }
    };
}

// Try to modify the function when the page loads
document.addEventListener('DOMContentLoaded', modifyBoostRandomParticle);