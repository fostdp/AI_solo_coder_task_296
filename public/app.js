import { PerformanceMonitor, measureAsync } from './utils/performance.js';

const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let params = {
    angle: 25,
    lengthRatio: 0.7,
    depth: 8,
    initialLength: 100,
    branchWidth: 8,
    windStrength: 0,
    windSpeed: 1,
    windDirection: 0,
    leafCount: 100,
    leafSize: 8
};

let fractalTree;
let windField;
let leafSystem;
let eventBus;

let animationId;
let lastTime = 0;
let fps = 0;
let frameCount = 0;
let fpsUpdateTime = 0;

const perfMonitor = new PerformanceMonitor();

async function loadModules() {
    return measureAsync('Module Loading', async () => {
        const modules = await Promise.all([
            import('./modules/EventBus.js'),
            import('./modules/FractalTree.js'),
            import('./modules/WindField.js'),
            import('./modules/LeafSystem.js'),
        ]);

        eventBus = new modules[0].EventBus();
        window.eventBus = eventBus;

        return {
            EventBus: modules[0].EventBus,
            FractalTree: modules[1].FractalTree,
            WindField: modules[2].WindField,
            LeafSystem: modules[3].LeafSystem,
        };
    });
}

async function initModules() {
    const modules = await loadModules();
    
    fractalTree = new modules.FractalTree(canvas, ctx);
    windField = new modules.WindField();
    leafSystem = new modules.LeafSystem(canvas, ctx);

    fractalTree.updateParams(params);
    windField.updateParams(params);
    leafSystem.updateParams(params);

    eventBus.emit('app:initialized', { params });
    
    console.log('✅ 所有模块懒加载完成');
}

function drawBackground() {
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(0.6, '#E0F7FA');
    skyGradient.addColorStop(1, '#8BC34A');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGround() {
    const gradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
    gradient.addColorStop(0, '#228B22');
    gradient.addColorStop(1, '#006400');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < canvas.width; i += 3) {
        const height = 5 + Math.random() * 10;
        ctx.fillRect(i, canvas.height - 100 - height, 2, height);
    }
}

function animate(currentTime) {
    const frameStart = performance.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    frameCount++;
    if (currentTime - fpsUpdateTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        fpsUpdateTime = currentTime;
        perfMonitor.recordFPS(fps);
        if (eventBus) {
            eventBus.emit('app:fps', { fps });
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawGround();

    if (windField) windField.update(deltaTime);

    if (fractalTree) fractalTree.draw();
    
    if (leafSystem) {
        leafSystem.update();
        leafSystem.draw();
    }

    const renderTime = performance.now() - frameStart;
    perfMonitor.recordRenderTime(renderTime);

    if (frameCount % 60 === 0) {
        perfMonitor.recordMemory();
    }

    animationId = requestAnimationFrame(animate);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function setupSlider(id, paramName, valueId, transform = v => parseFloat(v)) {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(valueId);
    
    const updateParams = debounce(() => {
        params[paramName] = transform(slider.value);
        valueDisplay.textContent = slider.value;
        eventBus.emit('params:updated', params);
    }, 30);
    
    slider.addEventListener('input', updateParams);
    
    slider.addEventListener('change', () => {
        params[paramName] = transform(slider.value);
        valueDisplay.textContent = slider.value;
        eventBus.emit('params:updated', params);
    });
}

function setupUI() {
    setupSlider('angle', 'angle', 'angleValue');
    setupSlider('lengthRatio', 'lengthRatio', 'lengthRatioValue');
    setupSlider('depth', 'depth', 'depthValue');
    setupSlider('initialLength', 'initialLength', 'initialLengthValue');
    setupSlider('branchWidth', 'branchWidth', 'branchWidthValue');
    setupSlider('windStrength', 'windStrength', 'windStrengthValue');
    setupSlider('windSpeed', 'windSpeed', 'windSpeedValue');
    setupSlider('windDirection', 'windDirection', 'windDirectionValue');
    setupSlider('leafCount', 'leafCount', 'leafCountValue');
    setupSlider('leafSize', 'leafSize', 'leafSizeValue');

    document.getElementById('saveConfig').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const result = await response.json();
            if (result.success) {
                alert('配置保存成功！');
                loadConfigs();
            }
        } catch (error) {
            alert('保存失败: ' + error.message);
        }
    });

    document.getElementById('takeScreenshot').addEventListener('click', async () => {
        try {
            const image = canvas.toDataURL('image/png');
            const response = await fetch('/api/screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, params })
            });
            const result = await response.json();
            if (result.success) {
                alert('截图保存成功！文件名: ' + result.filename);
            }
        } catch (error) {
            alert('截图失败: ' + error.message);
        }
    });

    document.getElementById('reset').addEventListener('click', () => {
        const defaults = {
            angle: 25,
            lengthRatio: 0.7,
            depth: 8,
            initialLength: 100,
            branchWidth: 8,
            windStrength: 0,
            windSpeed: 1,
            windDirection: 0,
            leafCount: 100,
            leafSize: 8
        };
        
        Object.keys(defaults).forEach(key => {
            params[key] = defaults[key];
            const slider = document.getElementById(key);
            if (slider) {
                slider.value = defaults[key];
            }
            const valueDisplay = document.getElementById(key + 'Value');
            if (valueDisplay) {
                valueDisplay.textContent = defaults[key];
            }
        });
        
        eventBus.emit('params:updated', params);
        eventBus.emit('leaves:clear');
    });
}

async function loadConfigs() {
    try {
        const response = await fetch('/api/configs');
        const result = await response.json();
        if (result.success) {
            const container = document.getElementById('configsContainer');
            container.innerHTML = '';
            
            result.configs.forEach(config => {
                const div = document.createElement('div');
                div.className = 'config-item';
                div.innerHTML = `
                    <span>${new Date(config.createdAt).toLocaleString()}</span>
                    <div>
                        <button onclick="applyConfig('${config.id}')">应用</button>
                        <button class="delete" onclick="deleteConfig('${config.id}')">删除</button>
                    </div>
                `;
                container.appendChild(div);
            });
            
            window.savedConfigs = result.configs;
        }
    } catch (error) {
        console.error('加载配置失败:', error);
    }
}

window.applyConfig = function(id) {
    const config = window.savedConfigs.find(c => c.id === id);
    if (config) {
        Object.keys(config).forEach(key => {
            if (key !== 'id' && key !== 'createdAt' && params.hasOwnProperty(key)) {
                params[key] = config[key];
                const slider = document.getElementById(key);
                if (slider) {
                    slider.value = config[key];
                }
                const valueDisplay = document.getElementById(key + 'Value');
                if (valueDisplay) {
                    valueDisplay.textContent = config[key];
                }
            }
        });
        eventBus.emit('params:updated', params);
        eventBus.emit('leaves:clear');
    }
};

window.deleteConfig = async function(id) {
    if (confirm('确定要删除这个配置吗？')) {
        try {
            const response = await fetch(`/api/configs/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (result.success) {
                loadConfigs();
            }
        } catch (error) {
            alert('删除失败: ' + error.message);
        }
    }
};

function start() {
    initModules();
    setupUI();
    loadConfigs();
    animate(0);
}

window.addEventListener('load', start);

window.addEventListener('beforeunload', () => {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    if (fractalTree) fractalTree.destroy();
    if (windField) windField.destroy();
    if (leafSystem) leafSystem.destroy();
});

window.getPerformanceReport = () => {
    const report = perfMonitor.getReport();
    console.log('📊 Performance Report:');
    console.table(report);
    return report;
};
