import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const CONFIG_FILE = path.join(DATA_DIR, 'configs.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR);
}

function loadConfigs() {
  if (fs.existsSync(CONFIG_FILE)) {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

function saveConfigs(configs) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), 'utf8');
}

app.get('/api/configs', (req, res) => {
  try {
    const configs = loadConfigs();
    res.json({ success: true, configs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/configs', (req, res) => {
  try {
    const config = req.body;
    config.id = Date.now().toString();
    config.createdAt = new Date().toISOString();
    
    const configs = loadConfigs();
    configs.push(config);
    saveConfigs(configs);
    
    res.json({ success: true, config });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.delete('/api/configs/:id', (req, res) => {
  try {
    const { id } = req.params;
    let configs = loadConfigs();
    configs = configs.filter(c => c.id !== id);
    saveConfigs(configs);
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.post('/api/screenshot', (req, res) => {
  try {
    const { image, params: treeParams } = req.body;
    const base64Data = image.replace(/^data:image\/png;base64,/, '');
    const timestamp = Date.now();
    const filename = `screenshot_${timestamp}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);
    
    fs.writeFileSync(filepath, base64Data, 'base64');
    
    if (treeParams) {
      const metadataFilename = `screenshot_${timestamp}.json`;
      const metadataFilepath = path.join(SCREENSHOTS_DIR, metadataFilename);
      fs.writeFileSync(metadataFilepath, JSON.stringify(treeParams, null, 2), 'utf8');
    }
    
    res.json({ success: true, filename });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.get('/api/screenshots', (req, res) => {
  try {
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    const screenshots = files.filter(f => f.endsWith('.png')).map(f => {
      const baseName = f.replace('.png', '');
      const metadataFile = path.join(SCREENSHOTS_DIR, `${baseName}.json`);
      let params = null;
      if (fs.existsSync(metadataFile)) {
        try {
          params = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
        } catch (e) {
          params = null;
        }
      }
      return {
        filename: f,
        url: `/screenshots/${f}`,
        params
      };
    });
    res.json({ success: true, screenshots });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

app.use('/screenshots', express.static(SCREENSHOTS_DIR));

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
