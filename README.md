# 🤖 Poppit AI - Intelligent Conversational Assistant

WEB-UI IS [HERE](https://bitcodeashishcloud.github.io/Poppit-Ai/ui/)
<div align="center">

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**A professional full-stack AI chatbot powered by fine-tuned Gemma 2B with QLoRA, featuring a modern ChatGPT-like interface**

 **Download Modal From [here](https://drive.google.com/file/d/10Pr7Kqx2kHyQ6tx61YrTsUlokSQUV7xm/view?usp=sharing)**

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [API](#-api-reference) • [Training](#-training-custom-model)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Training Custom Model](#-training-custom-model)
- [API Reference](#-api-reference)
- [Frontend Features](#-frontend-features-in-detail)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🌟 Overview

Poppit AI is a complete, production-ready AI chatbot system that combines:

- **🧠 Fine-tuned AI Model**: Google Gemma 2B with QLoRA optimization
- **⚡ FastAPI Backend**: High-performance REST API with CORS support
- **🎨 Modern UI**: ChatGPT-inspired interface with glassmorphism design
- **📱 Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **🔐 Secure**: XSS prevention, input sanitization, encrypted storage

---

## ✨ Features

### 🤖 AI & Backend

| Feature | Description |
|---------|-------------|
| **Gemma 2B Model** | Efficient 2B parameter language model from Google |
| **QLoRA Fine-tuning** | 4-bit quantization for memory-efficient training |
| **Custom Training** | Train on your own instruction-response pairs |
| **FastAPI Server** | Async, high-performance REST API |
| **Feedback Loop** | Like/dislike system for continuous improvement |
| **Multiple Modes** | AI model or local JSON knowledge base |

### 💬 Chat Interface

| Feature | Description |
|---------|-------------|
| **ChatGPT-Style Input** | Auto-growing textarea (1-10 lines) with smooth transitions |
| **Enter to Send** | Press Enter to send, Shift+Enter for new line |
| **Arrow Key History** | Navigate previous messages with ↑/↓ (like terminal) |
| **Typing Animation** | Character-by-character with line break preservation |
| **Code Block Support** | Syntax highlighting with one-click copy |
| **Triple Quote Blocks** | Beautiful bordered blocks for ''' content |
| **Multi-Session** | Create, save, and switch between chat sessions |
| **Pin Chats** | Pin important conversations |
| **Search History** | Find past conversations instantly |

### 🎨 UI/UX

| Feature | Description |
|---------|-------------|
| **Dark/Light Mode** | Beautiful theme toggle with smooth transitions |
| **Glassmorphism** | Modern frosted-glass design aesthetic |
| **Voice Input** | Browser-native speech recognition (Chrome/Edge/Safari) |
| **Mobile Optimized** | Touch-friendly, responsive across all devices |
| **Accessibility** | Keyboard navigation, screen reader support |
| **Real-time Preview** | See messages as AI types them out |

### 🔒 Security & Quality

| Feature | Description |
|---------|-------------|
| **XSS Prevention** | HTML escaping, safe code rendering |
| **Encrypted Storage** | XOR encryption for chat history |
| **Input Validation** | Sanitization and validation on all inputs |
| **Line Break Preservation** | Copy messages exactly as displayed |
| **Code Safety** | Never executes HTML/JavaScript in responses |

### 📦 Data Management

| Feature | Description |
|---------|-------------|
| **Auto-Save** | Conversations saved automatically to localStorage |
| **Export Options** | Export as TXT or PDF |
| **Reload Chat** | Refresh from localStorage without page reload |
| **Clear All** | Bulk delete (with pin protection) |
| **Backup/Restore** | Import/export chat sessions |

---

## 🛠 Tech Stack

### Backend
```
Python 3.8+          │ Core language
FastAPI              │ Web framework
PyTorch              │ Deep learning
Transformers         │ Hugging Face models
PEFT & TRL           │ Fine-tuning libraries
BitsAndBytes         │ Quantization
Uvicorn              │ ASGI server
```

### Frontend
```
HTML5 + CSS3         │ Structure & styling
Vanilla JavaScript   │ No frameworks, pure ES6+
CSS Variables        │ Dynamic theming
LocalStorage API     │ Encrypted persistence
Web Speech API       │ Voice recognition
```

### AI Model
```
Google Gemma 2B      │ Base language model
QLoRA                │ 4-bit quantized fine-tuning
LoRA (r=8, α=16)     │ Low-rank adaptation
Custom Dataset       │ Instruction-response pairs
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- 8GB+ RAM (16GB recommended)
- CUDA-capable GPU (optional, but recommended for training)
- Windows/Linux/macOS

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/poppit-ai.git
cd poppit-ai
```

### 2. Install Dependencies

```bash
# Create virtual environment
python -m venv gemma_qlora

# Activate (Windows)
gemma_qlora\Scripts\activate

# Activate (Linux/Mac)
source gemma_qlora/bin/activate

# Install PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
pip install transformers datasets accelerate peft trl bitsandbytes fastapi uvicorn pydantic
```

### 3. Start the Application

**Windows:**
```bash
start_ai.bat
```

**Manual Start:**
```bash
# Terminal 1: Backend Server
gemma_qlora\Scripts\activate
uvicorn server:app --reload --port 8000

# Terminal 2: Frontend Server
cd ui
python -m http.server 8080
```

### 4. Open Browser

Navigate to: **http://localhost:8080**

🎉 You're ready to chat with Poppit AI!

---

## 📁 Project Structure

```
poppit-ai/
│
├── 📄 README.md                    # You are here
├── 🚀 start_ai.bat                 # One-click startup (Windows)
├── ⚙️ server.py                    # FastAPI backend server
├── 🧠 run_model_core.py            # Core AI inference logic
├── 🎓 train.py                     # Model fine-tuning script
│
├── 📊 data.json                    # Training dataset
├── 👍 like.json                    # User feedback collection
├── 🔑 tocken.txt                   # API tokens (keep private!)
│
├── 🐍 gemma_qlora/                 # Python virtual environment
│   └── ...
│
├── 🎯 gemma-qlora-adapter/         # Fine-tuned model weights
│   ├── adapter_config.json
│   ├── adapter_model.safetensors
│   └── tokenizer files
│
├── 📦 gemma-qlora-output/          # Training checkpoints
│   ├── checkpoint-200/
│   ├── checkpoint-225/
│   └── ...
│
└── 🎨 ui/                           # Frontend application
    ├── index.html                  # Main HTML
    ├── README.md                   # UI documentation
    │
    ├── css/
    │   └── styles.css              # 1200+ lines of styles
    │
    └── js/
        └── app.js                  # 2000+ lines of logic
```

---

## ⚙️ Configuration

### Backend Configuration

**server.py** - API Settings
```python
# Change port
uvicorn server:app --host 0.0.0.0 --port 8000

# Enable/disable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**run_model_core.py** - Model Settings
```python
MODEL_ID = "google/gemma-2b"
ADAPTER_PATH = "./gemma-qlora-adapter"

# Quantization config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16
)
```

### Frontend Configuration

**ui/js/app.js** - Application Settings
```javascript
const CONFIG = {
    apiUrl: 'http://localhost:8000/chat',
    useLocalData: false,              // false = AI, true = JSON
    dataUrl: 'data.json',
    minConfidenceThreshold: 0.3,
    typingSpeed: 20,                  // ms per character
    maxSuggestions: 3,
    encryptionKey: 'YourSecureKey'    // Change this!
};
```

**ui/css/styles.css** - Theme Colors
```css
:root {
    /* Customize dark theme */
    --bg-gradient-start: #1a1a1a;
    --text-primary: #ffffff;
    /* ... more variables */
}

body.light-theme {
    /* Customize light theme */
    --bg-gradient-start: #f5f5f5;
    /* ... more variables */
}
```

---

## 🎓 Training Custom Model

### 1. Prepare Your Dataset

Edit `data.json` with instruction-response pairs:

```json
[
  {
    "instruction": "What is your name?",
    "response": "I am Poppit AI, an intelligent assistant."
  },
  {
    "instruction": "Who created you?",
    "response": "I was created by Ashish Gupta using Google's Gemma 2B model."
  },
  {
    "instruction": "What can you help me with?",
    "response": "I can answer questions, provide information, and have engaging conversations on various topics."
  }
]
```

### 2. Configure Training Parameters

Edit `train.py`:

```python
# Model settings
MODEL_ID = "google/gemma-2b"
OUTPUT_DIR = "./gemma-qlora-output"
ADAPTER_DIR = "./gemma-qlora-adapter"

# LoRA configuration
lora_config = LoraConfig(
    r=8,                    # Rank (higher = more parameters)
    lora_alpha=16,          # Scaling factor
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.1,
    bias="none",
    task_type="CAUSAL_LM"
)

# Training arguments
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    num_train_epochs=3,
    logging_steps=10,
    save_steps=50,
)
```

### 3. Run Training

```bash
# Activate environment
gemma_qlora\Scripts\activate

# Start training
python train.py
```

**Training Output:**
- Checkpoints saved to `gemma-qlora-output/checkpoint-*/`
- Final adapter saved to `gemma-qlora-adapter/`
- Training logs displayed in console

### 4. Test Your Model

Restart the server to load new weights:
```bash
uvicorn server:app --reload --port 8000
```

---

## 🌐 API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### POST `/chat`
Send a message to the AI model

**Request:**
```json
{
  "message": "What is artificial intelligence?"
}
```

**Response:**
```json
{
  "response": "Artificial intelligence (AI) is the simulation of human intelligence..."
}
```

**Curl Example:**
```bash
curl -X POST "http://localhost:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

#### POST `/like`
Save a liked response for future training

**Request:**
```json
{
  "instruction": "What is AI?",
  "response": "AI is the simulation of human intelligence..."
}
```

**Response:**
```json
{
  "message": "Response liked and saved!"
}
```

---

## 💻 Frontend Features In Detail

### 1. Auto-Growing Textarea
- Starts at 1 line, grows to 10 lines max
- Smooth CSS transitions
- Scrollable when exceeds limit
- **Mobile**: 4-6 lines max
- **Desktop**: Up to 10 lines

### 2. Input History Navigation
```
↑ Arrow - Previous messages (oldest first)
↓ Arrow - Next messages (newest first)
```
- Works only at first/last line (multiline safe)
- Saves unsent text during navigation
- No duplicate consecutive messages

### 3. Code Block Rendering
```python
# Detects both formats:
'''
code here
'''

```python
code here
```
```
- Syntax highlighting
- One-click copy button
- Language detection
- Safe rendering (no execution)

### 4. Triple Quote Blocks
```
Regular text

'''
This appears in a
blue-bordered block
'''

More text
```
- Detected at start of any line
- Beautiful blue border styling
- Preserves formatting

### 5. Chat Session Management
- **New Chat**: Fresh conversation
- **Switch Chats**: Instant session switching
- **Pin Chats**: Protect from bulk delete
- **Search**: Find by title/content
- **Export**: Save as TXT/PDF

### 6. Voice Input
- Browser-native speech recognition
- Auto-insert into textarea
- Visual feedback (red pulsing)
- **Supported**: Chrome, Edge, Safari
- **Not supported**: Firefox (shows warning)

### 7. Theme System
- Dark mode (default)
- Light mode
- Smooth transitions (0.3s)
- CSS variables for easy customization
- Persists in localStorage

### 8. Message Actions
Every AI response includes:
- 📋 **Copy** - Copy with line breaks preserved
- 👍 **Like** - Save to training data
- 👎 **Dislike** - Mark for review
- 🔗 **Share** - Generate shareable link

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: `ModuleNotFoundError: No module named 'transformers'`**
```bash
# Solution: Install dependencies
pip install transformers accelerate peft trl bitsandbytes
```

**Problem: `CUDA out of memory`**
```bash
# Solution 1: Reduce batch size in train.py
per_device_train_batch_size=1

# Solution 2: Use CPU (slower)
device = "cpu"
```

**Problem: `Port 8000 already in use`**
```bash
# Solution: Kill process or use different port
uvicorn server:app --port 8001
```

### Frontend Issues

**Problem: Can't connect to AI**
```javascript
// Check CONFIG.apiUrl in ui/js/app.js
const CONFIG = {
    apiUrl: 'http://localhost:8000/chat',  // Correct?
};
```

**Problem: Voice input not working**
- Check browser compatibility (Chrome/Edge/Safari only)
- Verify microphone permissions
- Check console for errors

**Problem: Chat history not saving**
- Clear browser cache
- Check localStorage quota
- Verify encryption key

**Problem: Textarea not auto-resizing**
- Check CSS: `max-height` property
- Verify `autoResizeTextarea()` function
- Browser console for JavaScript errors

---

## 🚀 Deployment

### Local Network Deployment

**1. Backend on LAN:**
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

**2. Update Frontend:**
```javascript
// ui/js/app.js
const CONFIG = {
    apiUrl: 'http://192.168.1.100:8000/chat',  // Your machine's IP
};
```

**3. Serve Frontend:**
```bash
python -m http.server 8080 --bind 0.0.0.0
```

### Production Deployment

**Using Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/ui;
        index index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Security Checklist for Production

- [ ] Change encryption key in `CONFIG`
- [ ] Restrict CORS origins (no `*`)
- [ ] Use HTTPS (SSL certificates)
- [ ] Set up authentication/authorization
- [ ] Rate limiting on API endpoints
- [ ] Sanitize all inputs server-side
- [ ] Regular security audits
- [ ] Environment variables for secrets
- [ ] Backup database regularly

---

## 📊 Performance Metrics

### Model Performance
| Metric | Value |
|--------|-------|
| Parameters | 2 Billion |
| Quantization | 4-bit (QLoRA) |
| VRAM Usage | ~4GB (inference) |
| Inference Time | 2-5 seconds (GPU) |
| Inference Time | 10-30 seconds (CPU) |

### Training Performance
| Metric | Value |
|--------|-------|
| VRAM Required | 8-12GB |
| Training Time | ~30 min (50 samples) |
| Checkpoint Size | ~10MB per adapter |
| Dataset Format | JSON (instruction-response) |

### Frontend Performance
| Metric | Value |
|--------|-------|
| Initial Load | < 1 second |
| Typing Speed | 20ms per character |
| Chat Switch | < 100ms |
| Theme Toggle | 300ms transition |
| Mobile Optimized | 100% responsive |

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit changes**: `git commit -m 'Add AmazingFeature'`
4. **Push to branch**: `git push origin feature/AmazingFeature`
5. **Open Pull Request**

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test on multiple browsers
- Update README for new features
- Keep commits atomic and descriptive

### Reporting Issues

Found a bug? [Open an issue](https://github.com/yourusername/poppit-ai/issues)

Include:
- Browser/OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## 📈 Roadmap

### Planned Features

- [ ] **Streaming Responses** - Real-time token-by-token display
- [ ] **Multi-Language Support** - Translations for UI
- [ ] **File Upload** - Process documents, images
- [ ] **Advanced RAG** - Retrieval-augmented generation
- [ ] **User Authentication** - Login system
- [ ] **Cloud Deployment** - Docker + Kubernetes
- [ ] **Mobile App** - React Native wrapper
- [ ] **Voice Output** - Text-to-speech responses
- [ ] **Custom Themes** - User-created color schemes
- [ ] **Plugin System** - Extensible architecture

### Recently Completed ✅

- ✅ ChatGPT-style auto-growing input
- ✅ Arrow key history navigation
- ✅ Code block rendering with copy
- ✅ Triple quote bordered blocks
- ✅ Line break preservation
- ✅ XSS prevention & security
- ✅ Voice input support
- ✅ Chat session management
- ✅ Pin/unpin functionality
- ✅ Dark/Light mode toggle

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

## 👨‍💻 Author

**Your Name**

- 🌐 Portfolio: [your-website.com](https://your-website.com)
- 💼 LinkedIn: [linkedin.com/in/yourprofile](https://linkedin.com/in/yourprofile)
- 🐙 GitHub: [@yourusername](https://github.com/yourusername)
- 📧 Email: your.email@example.com

---

## 🙏 Acknowledgments

- **Google** - For the amazing Gemma 2B model
- **Hugging Face** - Transformers, PEFT, and TRL libraries
- **FastAPI** - Modern web framework for APIs
- **Community** - Open source contributors

---

## 📚 Resources & Learning

### Documentation
- [Gemma Model Card](https://huggingface.co/google/gemma-2b)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Transformers Library](https://huggingface.co/docs/transformers)
- [PEFT Documentation](https://huggingface.co/docs/peft)

### Tutorials
- [Fine-tuning LLMs with QLoRA](https://huggingface.co/blog/4bit-transformers-bitsandbytes)
- [Building Modern UIs](https://developer.mozilla.org/)
- [RESTful API Design](https://restfulapi.net/)

---

## ⭐ Show Your Support

If this project helped you, please consider:

- ⭐ **Star this repository**
- 🐛 **Report bugs** you find
- 💡 **Suggest new features**
- 📢 **Share with others**
- ☕ **Buy me a coffee** (if you feel generous!)

---

<div align="center">

**🚀 Ready to start? Run `start_ai.bat` and visit http://localhost:8080**

**Download Modal From [here](https://drive.google.com/file/d/10Pr7Kqx2kHyQ6tx61YrTsUlokSQUV7xm/view?usp=sharing)**

*Built with ❤️ using Gemma 2B, QLoRA, FastAPI, and Vanilla JavaScript*

**[⬆ Back to Top](#-poppit-ai---intelligent-conversational-assistant)**

</div>




