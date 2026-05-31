class WindField {
    constructor() {
        this.params = {
            strength: 0,
            speed: 1,
            direction: 0
        };
        
        this.time = 0;
        this.currentForce = 0;
        this.totalWind = 0;
        this.harmonics = [];
        
        this.addHarmonic(1, 1, 0);
        this.addHarmonic(2.3, 0.3, 0.5);
        
        if (typeof eventBus !== 'undefined') {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        eventBus.on('params:updated', (params) => {
            this.updateParams(params);
        });

        eventBus.on('wind:pulse', (intensity = 1) => {
            this.pulse(intensity);
        });

        eventBus.on('wind:gust', (duration = 1000, intensity = 2) => {
            this.gust(duration, intensity);
        });
    }

    addHarmonic(frequency, amplitude, phase) {
        this.harmonics.push({ frequency, amplitude, phase });
    }

    updateParams(newParams) {
        if (newParams.windStrength !== undefined) {
            this.params.strength = newParams.windStrength;
        }
        if (newParams.windSpeed !== undefined) {
            this.params.speed = newParams.windSpeed;
        }
        if (newParams.windDirection !== undefined) {
            this.params.direction = newParams.windDirection;
        }
    }

    update(deltaTime = 16) {
        this.time += deltaTime * 0.001 * this.params.speed;
        
        let force = 0;
        this.harmonics.forEach(h => {
            force += Math.sin(this.time * h.frequency + h.phase) * h.amplitude;
        });
        
        this.currentForce = force * this.params.strength;
        
        const windRad = (this.params.direction * Math.PI) / 180;
        this.totalWind = this.currentForce * Math.cos(windRad);
        
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('wind:updated', {
                force: this.currentForce,
                totalWind: this.totalWind,
                direction: this.params.direction,
                strength: this.params.strength,
                time: this.time
            });
        }
        
        return { force: this.currentForce, totalWind: this.totalWind };
    }

    pulse(intensity = 1) {
        this.time += Math.PI * intensity;
        
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('wind:pulsed', { intensity });
        }
    }

    gust(duration = 1000, intensity = 2) {
        const originalStrength = this.params.strength;
        this.params.strength *= intensity;
        
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('wind:gustStarted', { duration, intensity });
        }
        
        setTimeout(() => {
            this.params.strength = originalStrength;
            if (typeof eventBus !== 'undefined') {
                eventBus.emit('wind:gustEnded');
            }
        }, duration);
    }

    getForceAtPosition(x, y) {
        const positionFactor = Math.sin(x * 0.01 + this.time) * 0.2 + 1;
        const heightFactor = Math.max(0, 1 - y / 800);
        
        return this.totalWind * positionFactor * (0.5 + heightFactor * 0.5);
    }

    getCurrentForce() {
        return this.currentForce;
    }

    getTotalWind() {
        return this.totalWind;
    }

    setStrength(value) {
        this.params.strength = value;
    }

    setSpeed(value) {
        this.params.speed = value;
    }

    setDirection(degrees) {
        this.params.direction = degrees;
    }

    reset() {
        this.time = 0;
        this.currentForce = 0;
        this.totalWind = 0;
        this.harmonics = [];
        this.addHarmonic(1, 1, 0);
        this.addHarmonic(2.3, 0.3, 0.5);
    }

    destroy() {
        if (typeof eventBus !== 'undefined') {
            eventBus.off('params:updated');
            eventBus.off('wind:pulse');
            eventBus.off('wind:gust');
        }
        this.harmonics = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindField;
}

export default WindField;
export { WindField };
