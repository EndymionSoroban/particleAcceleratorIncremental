// Main game loop and initialization

// Wait for all scripts to be loaded before initializing the game
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing Particle Accelerator Incremental Game...");
    
    // Initialize the game
    loadGame();
    
    // Start the game loop
    gameLoop();
    
    console.log("Game initialized successfully!");
});

// Main game loop
function gameLoop() {
    // Calculate collisions per second
    const now = Date.now();
    const timeDiff = (now - game.lastUpdateTime) / 1000;
    
    if (timeDiff >= 1) {
        game.collisionsPerSecond = (game.collisions - game.lastCollisionCount) / timeDiff;
        game.lastCollisionCount = game.collisions;
        game.lastUpdateTime = now;
    }
    
    // Apply auto collider
    if (game.autoCollider > 0) {
        game.energy += game.autoCollider * game.ENERGY_PER_COLLISION * timeDiff;
        game.collisions += game.autoCollider * timeDiff;
    }
    
    // Update game elements
    updateParticles();
    updateCollisionEffects();
    updateClickEffects();
    updateStats();
    updateUpgradeButtons();
    draw();
    
    requestAnimationFrame(gameLoop);
}