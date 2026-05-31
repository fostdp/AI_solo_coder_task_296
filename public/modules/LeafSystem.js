class Leaf {
    constructor(x, y, size = 8) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = Math.random() * 2 + 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.size = size * (0.5 + Math.random() * 0.5);
        this.color = this.getRandomGreen();
        this.age = 0;
        this.maxAge = Math.random() * 300 + 200;
        this.swayOffset = Math.random() * Math.PI * 2;
    }

    getRandomGreen() {
        const greens = ['#228B22', '#32CD32', '#90EE90', '#006400', '#2E8B57', '#3CB371'];
        return greens[Math.floor(Math.random() * greens.length)];
    }

    update(windForce, canvasWidth, canvasHeight) {
        this.age++;
        
        this.vx += windForce * 0.01;
        this.vy += 0.02;
        
        this.vx *= 0.98;
        this.vy *= 0.98;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.rotation += this.rotationSpeed;
        
        if (this.y > canvasHeight - 50) {
            this.y = canvasHeight - 50;
            this.vy *= -0.3;
            this.vx *= 0.5;
        }
        
        const outOfBounds = this.x < -50 || this.x > canvasWidth + 50 || this.y > canvasHeight + 50;
        
        return this.age < this.maxAge && !outOfBounds;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.restore();
    }
}

class LeafSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.leaves = [];
        this.treeLeafPositions = [];
        
        this.params = {
            leafCount: 100,
            leafSize: 8
        };
        
        this.windForce = 0;
        this.spawnRate = 0;
        
        if (typeof eventBus !== 'undefined') {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        eventBus.on('wind:updated', (windData) => {
            this.windForce = windData.totalWind;
            this.spawnRate = windData.strength / 100;
        });

        eventBus.on('tree:leavesDrawn', (leafPositions) => {
            this.treeLeafPositions = leafPositions;
        });

        eventBus.on('params:updated', (params) => {
            this.updateParams(params);
        });

        eventBus.on('leaves:clear', () => {
            this.clear();
        });

        eventBus.on('leaves:burst', (count = 50) => {
            this.burst(count);
        });
    }

    updateParams(newParams) {
        if (newParams.leafCount !== undefined) {
            this.params.leafCount = newParams.leafCount;
        }
        if (newParams.leafSize !== undefined) {
            this.params.leafSize = newParams.leafSize;
        }
    }

    update() {
        if (Math.random() < this.spawnRate && this.leaves.length < this.params.leafCount) {
            this.spawnLeaf();
        }
        
        this.leaves = this.leaves.filter(leaf => 
            leaf.update(this.windForce, this.canvas.width, this.canvas.height)
        );

        if (typeof eventBus !== 'undefined') {
            eventBus.emit('leaves:updated', {
                count: this.leaves.length,
                max: this.params.leafCount
            });
        }
    }

    draw() {
        this.leaves.forEach(leaf => leaf.draw(this.ctx));
    }

    spawnLeaf() {
        if (this.treeLeafPositions.length > 0) {
            const randomPos = this.treeLeafPositions[Math.floor(Math.random() * this.treeLeafPositions.length)];
            if (randomPos) {
                this.leaves.push(new Leaf(randomPos.x, randomPos.y, this.params.leafSize));
            }
        }
    }

    spawnAtPosition(x, y, count = 1) {
        for (let i = 0; i < count; i++) {
            this.leaves.push(new Leaf(x, y, this.params.leafSize));
        }
    }

    burst(count = 50) {
        for (let i = 0; i < count; i++) {
            const x = this.canvas.width / 2 + (Math.random() - 0.5) * 200;
            const y = this.canvas.height - 200 + (Math.random() - 0.5) * 100;
            this.leaves.push(new Leaf(x, y, this.params.leafSize));
        }

        if (typeof eventBus !== 'undefined') {
            eventBus.emit('leaves:burstComplete', { count });
        }
    }

    clear() {
        this.leaves = [];
        
        if (typeof eventBus !== 'undefined') {
            eventBus.emit('leaves:cleared');
        }
    }

    getLeafCount() {
        return this.leaves.length;
    }

    setTreeLeafPositions(positions) {
        this.treeLeafPositions = positions;
    }

    destroy() {
        if (typeof eventBus !== 'undefined') {
            eventBus.off('wind:updated');
            eventBus.off('tree:leavesDrawn');
            eventBus.off('params:updated');
            eventBus.off('leaves:clear');
            eventBus.off('leaves:burst');
        }
        this.leaves = [];
        this.treeLeafPositions = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Leaf, LeafSystem };
}

export { Leaf, LeafSystem };
export default LeafSystem;
