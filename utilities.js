// Utility functions

// Convert hex color to rgb string
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '255, 255, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

// Generate random particle colors
function getRandomParticleColor() {
    const colors = ['#4fc3f7', '#f06292', '#ffb74d', '#aed581', '#ba68c8'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Arrays for visual effects
const collisionEffects = [];
const clickEffects = [];