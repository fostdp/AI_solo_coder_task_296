const http = require('http');
const fs = require('fs');
const path = require('path');

const TEST_SERVER_URL = 'http://localhost:3000';
const DATA_DIR = path.join(__dirname, 'data');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

let testResults = [];
let passed = 0;
let failed = 0;

function log(message, type = 'info') {
    const colors = {
        info: '\x1b[36m',
        pass: '\x1b[32m',
        fail: '\x1b[31m',
        header: '\x1b[35m',
        reset: '\x1b[0m'
    };
    console.log(`${colors[type]}${message}${colors.reset}`);
}

function test(name, fn) {
    log(`\n🧪 测试: ${name}`, 'header');
    try {
        const result = fn();
        if (result) {
            log(`✅  PASS: ${name}`, 'pass');
            passed++;
            testResults.push({ name, status: 'pass' });
        } else {
            log(`❌  FAIL: ${name}`, 'fail');
            failed++;
            testResults.push({ name, status: 'fail' });
        }
    } catch (error) {
        log(`❌  FAIL: ${name} - ${error.message}`, 'fail');
        failed++;
        testResults.push({ name, status: 'fail', error: error.message });
    }
}

async function asyncTest(name, fn) {
    log(`\n🧪 测试: ${name}`, 'header');
    try {
        const result = await fn();
        if (result) {
            log(`✅  PASS: ${name}`, 'pass');
            passed++;
            testResults.push({ name, status: 'pass' });
        } else {
            log(`❌  FAIL: ${name}`, 'fail');
            failed++;
            testResults.push({ name, status: 'fail' });
        }
    } catch (error) {
        log(`❌  FAIL: ${name} - ${error.message}`, 'fail');
        failed++;
        testResults.push({ name, status: 'fail', error: error.message });
    }
}

function httpRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data ? JSON.parse(data) : null
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        rawBody: data
                    });
                }
            });
        });
        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

log('╔═══════════════════════════════════════════════════════════╗', 'header');
log('║        分形树后端服务器单元测试                            ║', 'header');
log('╚═══════════════════════════════════════════════════════════╝', 'header');



async function runAllTests() {
    log('\n⏳ 开始运行所有测试...\n', 'info');
    
    testResults = [];
    passed = 0;
    failed = 0;
    
    test('数据目录存在或可创建', () => {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        return fs.existsSync(DATA_DIR);
    });
    
    test('截图目录存在或可创建', () => {
        if (!fs.existsSync(SCREENSHOTS_DIR)) {
            fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        }
        return fs.existsSync(SCREENSHOTS_DIR);
    });
    
    test('配置文件可读写', () => {
        const testFile = path.join(DATA_DIR, 'test_config.json');
        const testData = { test: true, value: 42 };
        
        fs.writeFileSync(testFile, JSON.stringify(testData));
        const readData = JSON.parse(fs.readFileSync(testFile, 'utf8'));
        
        fs.unlinkSync(testFile);
        
        return readData.test === true && readData.value === 42;
    });
    
    await asyncTest('服务器健康检查 - GET /api/configs', async () => {
        try {
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/configs',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.statusCode === 200 && response.body && response.body.success === true;
        } catch (e) {
            log(`连接失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    await asyncTest('保存配置接口 - POST /api/configs', async () => {
        try {
            const config = {
                angle: 30,
                lengthRatio: 0.75,
                depth: 10,
                branchWidth: 6,
                windStrength: 15
            };
            
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/configs',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, config);
            
            return response.statusCode === 200 && 
                   response.body && 
                   response.body.success === true &&
                   response.body.config &&
                   response.body.config.id;
        } catch (e) {
            log(`请求失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    await asyncTest('获取配置列表 - GET /api/configs', async () => {
        try {
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/configs',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            return response.statusCode === 200 && 
                   response.body && 
                   Array.isArray(response.body.configs);
        } catch (e) {
            log(`请求失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    await asyncTest('截图保存接口 - POST /api/screenshot', async () => {
        try {
            const smallImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
            
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/screenshot',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, { image: smallImage });
            
            return response.statusCode === 200 && 
                   response.body && 
                   response.body.success === true;
        } catch (e) {
            log(`请求失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    await asyncTest('截图列表接口 - GET /api/screenshots', async () => {
        try {
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/screenshots',
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            return response.statusCode === 200 && 
                   response.body && 
                   response.body.success === true &&
                   Array.isArray(response.body.screenshots);
        } catch (e) {
            log(`请求失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    await asyncTest('静态文件服务 - index.html', async () => {
        try {
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/index.html',
                method: 'GET'
            });
            
            return response.statusCode === 200 && 
                   response.rawBody && 
                   response.rawBody.includes('分形树');
        } catch (e) {
            log(`请求失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    await asyncTest('CORS跨域支持', async () => {
        try {
            const response = await httpRequest({
                hostname: 'localhost',
                port: 3000,
                path: '/api/configs',
                method: 'OPTIONS',
                headers: { 
                    'Content-Type': 'application/json',
                    'Origin': 'http://example.com'
                }
            });
            
            return response.headers['access-control-allow-origin'] === '*' ||
                   response.statusCode === 200;
        } catch (e) {
            log(`请求失败: ${e.message}`, 'fail');
            return false;
        }
    });
    
    test('配置数据结构完整性', () => {
        const configPath = path.join(DATA_DIR, 'configs.json');
        if (fs.existsSync(configPath)) {
            const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (Array.isArray(data) && data.length > 0) {
                const config = data[0];
                return config.id && config.createdAt;
            }
        }
        return true;
    });
    
    test('截图文件正确保存', () => {
        const files = fs.readdirSync(SCREENSHOTS_DIR);
        const pngFiles = files.filter(f => f.endsWith('.png'));
        return pngFiles.length > 0;
    });
    
    log('\n═══════════════════════════════════════════════════════════', 'header');
    log(`📊 测试结果汇总: ${passed} 通过, ${failed} 失败`, passed === testResults.length ? 'pass' : 'fail');
    log('═══════════════════════════════════════════════════════════', 'header');
    
    testResults.forEach((result, i) => {
        const status = result.status === 'pass' ? '✅' : '❌';
        log(`  ${i + 1}. ${status} ${result.name}`, result.status === 'pass' ? 'pass' : 'fail');
    });
    
    log('\n═══════════════════════════════════════════════════════════', 'header');
    
    const successRate = (passed / testResults.length * 100).toFixed(1);
    log(`\n🎯 成功率: ${successRate}%`, successRate === '100.0' ? 'pass' : 'info');
    
    if (failed > 0) {
        log('\n💡 提示: 确保服务器已启动 (node server.js)', 'info');
        log('💡 提示: 确保端口3000未被占用', 'info');
    }
    
    return passed === testResults.length;
}

runAllTests().then(allPassed => {
    process.exit(allPassed ? 0 : 1);
}).catch(err => {
    log(`\n❌ 测试执行错误: ${err.message}`, 'fail');
    process.exit(1);
});
