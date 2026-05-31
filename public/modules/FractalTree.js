class FractalTree {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.branches = [];
        this.leafPositions = [];
        
        this.params = {
            angle: 25,
            lengthRatio: 0.7,
            depth: 8,
            initialLength: 100,
            branchWidth: 8
        };

        this.windOffset = 0;
        
        if (typeof eventBus !== 'undefined') {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        eventBus.on('wind:updated', (windData) => {
            this.windOffset = windData.totalWind * 0.02;
        });

        eventBus.on('params:updated', (params) => {
            this.updateParams(params);
        });

        eventBus.on('tree:regenerate', () => {
            this.generate();
        });
    }

    updateParams(newParams) {
        Object.assign(this.params, newParams);
    }

    generate() {
        this.branches = [];
        this.leafPositions = [];
        
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 100;
        
        this.recursiveDraw(
            startX, 
            startY, 
            this.params.initialLength, 
            0, 
            this.params.depth, 
            this.params.branchWidth
        );

        if (typeof eventBus !== 'undefined') {
            eventBus.emit('tree:generated', {
                branches: this.branches.length,
                leafPositions: this.leafPositions
            });
        }

        return { branches: this.branches, leafPositions: this.leafPositions };
    }

    recursiveDraw(x, y, length, angle, depth, width) {
        if (depth === 0) {
            if (Math.random() < 0.7) {
                this.leafPositions.push({ x, y });
            }
            return;
        }

        const windEffect = this.windOffset * (depth / this.params.depth);
        const adjustedAngle = angle + windEffect;
        
        const endX = x + Math.sin(adjustedAngle) * length;
        const endY = y - Math.cos(adjustedAngle) * length;

        this.branches.push({
            startX: x,
            startY: y,
            endX,
            endY,
            width,
            depth
        });

        const newLength = length * this.params.lengthRatio;
        const newWidth = width * 0.7;
        const branchAngle = (this.params.angle * Math.PI) / 180;

        this.recursiveDraw(endX, endY, newLength, adjustedAngle - branchAngle, depth - 1, newWidth);
        this.recursiveDraw(endX, endY, newLength, adjustedAngle + branchAngle, depth - 1, newWidth);

        if (Math.random() < 0.3 && depth > 3) {
            const midAngle = adjustedAngle + (Math.random() - 0.5) * branchAngle;
            this.recursiveDraw(endX, endY, newLength * 0.8, midAngle, depth - 2, newWidth * 0.8);
        }
    }

    draw() {
        this.leafPositions = [];
        this.branches = [];
        
        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 100;
        
        this.drawBranch(startX, startY, this.params.initialLength, 0, this.params.depth, this.params.branchWidth);
        
        this.drawLeaves();
    }

    drawBranch(x, y, length, angle, depth, width) {
        if (depth === 0) {
            if (Math.random() < 0.7) {
                this.leafPositions.push({ x, y });
            }
            return;
        }

        const windEffect = this.windOffset * (depth / this.params.depth);
        const adjustedAngle = angle + windEffect;
        
        const endX = x + Math.sin(adjustedAngle) * length;
        const endY = y - Math.cos(adjustedAngle) * length;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = `rgb(${101 + (this.params.depth - depth) * 10}, ${67 + (this.params.depth - depth) * 5}, ${33})`;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.stroke();

        const newLength = length * this.params.lengthRatio;
        const newWidth = width * 0.7;
        const branchAngle = (this.params.angle * Math.PI) / 180;

        this.drawBranch(endX, endY, newLength, adjustedAngle - branchAngle, depth - 1, newWidth);
        this.drawBranch(endX, endY, newLength, adjustedAngle + branchAngle, depth - 1, newWidth);

        if (Math.random() < 0.3 && depth > 3) {
            const midAngle = adjustedAngle + (Math.random() - 0.5) * branchAngle;
            this.drawBranch(endX, endY, newLength * 0.8, midAngle, depth - 2, newWidth * 0.8);
        }
    }

    drawLeaves() {
        const leafColors = ['#228B22', '#32CD32', '#90EE90', '#006400', '#2E8B57', '#3CB371'];
        
        this.leafPositions.forEach(pos => {
            const size = 8 * (0.6 + Math.random() * 0.4);
            this.ctx.beginPath();
            this.ctx.ellipse(pos.x, pos.y, size, size * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            this.ctx.fillStyle = leafColors[Math.floor(Math.random() * leafColors.length)];
            this.ctx.fill();
        });

        if (typeof eventBus !== 'undefined') {
            eventBus.emit('tree:leavesDrawn', this.leafPositions);
        }
    }

    getLeafPositions() {
        return this.leafPositions;
    }

    setWindOffset(offset) {
        this.windOffset = offset;
    }

    destroy() {
        if (typeof eventBus !== 'undefined') {
            eventBus.off('wind:updated');
            eventBus.off('params:updated');
            eventBus.off('tree:regenerate');
        }
        this.branches = [];
        this.leafPositions = [];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FractalTree;
}

export default FractalTree;
export { FractalTree };
