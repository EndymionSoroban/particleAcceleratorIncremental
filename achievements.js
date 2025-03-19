// Achievement related functions

// Check and update achievements
function checkAchievements() {
    if (game.collisions >= 1 && !game.achievements.firstCollision) {
        game.achievements.firstCollision = true;
    }
    
    if (game.collisions >= 100 && !game.achievements.hundredCollisions) {
        game.achievements.hundredCollisions = true;
    }
    
    if (game.collisions >= 1000 && !game.achievements.thousandCollisions) {
        game.achievements.thousandCollisions = true;
    }
    
    // Check if we have enough particles for achievement
    if (game.particles.length >= 10 && !game.achievements.tenParticles) {
        game.achievements.tenParticles = true;
    }
    
    updateAchievements();
}

// Update achievements display
function updateAchievements() {
    if (game.achievements.firstCollision) {
        document.getElementById('achievement1').classList.add('unlocked');
    }
    
    if (game.achievements.hundredCollisions) {
        document.getElementById('achievement2').classList.add('unlocked');
    }
    
    if (game.achievements.thousandCollisions) {
        document.getElementById('achievement3').classList.add('unlocked');
    }
    
    if (game.achievements.maxSize) {
        document.getElementById('achievement4').classList.add('unlocked');
    }
    
    if (game.achievements.tenParticles) {
        document.getElementById('achievement5').classList.add('unlocked');
    }
}