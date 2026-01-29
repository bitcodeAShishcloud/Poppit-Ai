# 🤖 Poppit AI - Intelligent Conversational Assistant

<div align="center">

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**A professional full-stack AI chatbot powered by fine-tuned Gemma 2B with QLoRA, featuring a modern ChatGPT-like interface**

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Documentation](#-documentation) • [API](#-api-reference)

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
- [Training](#-training-custom-model)
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
- **Training Pipeline** - Complete training scripts and configuration

## ✨ Key Features

### AI Model
- 🧠 **Google Gemma 2B** - Efficient 2B parameter language model
- ⚡ **QLoRA Fine-tuning** - 4-bit quantization for memory efficiency
- 🎯 **Custom Dataset** - Trained on personalized instruction-response pairs
- 💾 **Low Memory Footprint** - Runs on consumer GPUs

### Backend API
- 🚀 **FastAPI Server** - High-performance async API
- 🔗 **RESTful Endpoints** - `/chat` for inference, `/like` for feedback
- 🌐 **CORS Enabled** - Browser-friendly configuration
- 📊 **Response Logging** - Track liked responses for retraining

### Frontend UI
- 🎨 **Glassmorphism Design** - Modern, beautiful interface
- 💬 **Smart Matching** - Synonym support + confidence scoring
- ⌨️ **Typing Animation** - Realistic character-by-character display
- 🌓 **Dark/Light Mode** - Theme toggle with smooth transitions
- 🧠 **Context Memory** - Remembers conversation history
- 💡 **Did-You-Mean** - Smart suggestions when no match found

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- CUDA-capable GPU (recommended, 4GB+ VRAM)
- 10GB+ free disk space

### Installation

1. **Clone or navigate to project**
```bash
cd c:\Users\shesh\Desktop\modal
```

2. **Create and activate virtual environment**
```bash
python -m venv gemma_qlora
gemma_qlora\Scripts\activate
```

3. **Install dependencies**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install transformers datasets accelerate peft trl bitsandbytes
pip install fastapi uvicorn pydantic
```

### Running the System

#### Option 1: Automated Start (Recommended)
```bash
start_ai.bat
```
This will:
1. Activate virtual environment
2. Start AI model server on port 8000
3. Start UI server on port 8080
4. Open browser automatically

#### Option 2: Manual Start
```bash
# Terminal 1: Start AI Model Backend
gemma_qlora\Scripts\activate
uvicorn server:app --reload --port 8000

# Terminal 2: Start UI Server
cd ui
python -m http.server 8080

# Open: http://localhost:8080
```

## 📁 Project Structure

```
modal/
├── README.md                      # This file
├── start_ai.bat                   # Automated startup script
│
├── train.py                       # Fine-tuning script
├── run_model.py                   # Model inference (simple)
├── run_model_core.py             # Core inference logic
├── server.py                      # FastAPI backend server
│
├── data.json                      # Training dataset
├── data_backup.json              # Dataset backup
├── like.json                      # Liked responses (user feedback)
├── tocken.txt                     # API tokens (if needed)
│
├── gemma_qlora/                   # Python virtual environment
├── gemma-qlora-adapter/          # Fine-tuned LoRA adapter weights
├── gemma-qlora-output/           # Training checkpoints
│   ├── checkpoint-50/
│   └── checkpoint-87/
│
└── ui/                            # Frontend web interface
    ├── index.html                # Main UI
    ├── README.md                 # Frontend documentation
    ├── css/
    │   └── styles.css
    └── js/
        └── app.js                # Smart chatbot logic
```

## 🎓 Training Your Own Model

### 1. Prepare Training Data

Edit `data.json` with instruction-response pairs:

```json
[
  {
    "instruction": "Who created you?",
    "response": "I am Poppit AI, created by Ashish Gupta using Gemma 2B model."
  },
  {
    "instruction": "What can you do?",
    "response": "I can answer questions, provide information, and have conversations!"
  }
]
```

### 2. Configure Training Parameters

Edit `train.py` to adjust:
- `MODEL_ID` - Base model (default: "google/gemma-2b")
- `r` - LoRA rank (default: 8)
- `lora_alpha` - LoRA scaling (default: 16)
- Training epochs, batch size, learning rate

### 3. Run Training

```bash
gemma_qlora\Scripts\activate
python train.py
```

Training outputs:
- `gemma-qlora-adapter/` - Final fine-tuned weights
- `gemma-qlora-output/` - Training checkpoints

### 4. Use Trained Model

The adapter weights are automatically loaded by `run_model_core.py` from:
- `gemma-qlora-adapter/adapter_model.safetensors`

## 🔧 Configuration

### Backend Configuration (`server.py`)
- Change port: `uvicorn server:app --port 8000`
- CORS settings: Modify `CORSMiddleware` configuration
- Model loading: Edit `run_model_core.py`

### Frontend Configuration (`ui/js/app.js`)
```javascript
const CONFIG = {
    apiUrl: 'http://localhost:8000/chat',  // Backend URL
    useLocalData: false,                    // false = AI, true = local JSON
    typingSpeed: 20,                        // Typing animation speed (ms)
    minConfidenceThreshold: 0.3,           // Question matching threshold
    maxSuggestions: 3                       // Number of suggestions
};
```

## 📡 API Documentation

### POST `/chat`
Send message to AI model

**Request:**
```json
{
  "message": "Hello, who are you?"
}
```

**Response:**
```json
{
  "response": "I am Poppit AI, created by Ashish Gupta..."
}
```

### POST `/like`
Save liked response for retraining

**Request:**
```json
{
  "instruction": "What is AI?",
  "response": "AI stands for Artificial Intelligence..."
}
```

**Response:**
```json
{
  "message": "Response liked and saved!"
}
```

## 🛠️ Troubleshooting

### Model Loading Issues
- **Out of Memory**: Reduce batch size in training, ensure 4-bit quantization is enabled
- **CUDA not available**: Install PyTorch with CUDA support
- **Adapter not found**: Run training first to generate adapter weights

### Server Issues
- **Port already in use**: Change port number or kill existing process
- **CORS errors**: Check browser console, verify CORS middleware configuration
- **Slow responses**: First inference is slow (model loading), subsequent calls are faster

### UI Issues
- **Can't connect to AI**: Ensure backend server is running on port 8000
- **No responses**: Check browser console for errors, verify API URL in config
- **Typing animation stuck**: Clear browser cache and reload

## 📊 Performance Metrics

### Model Performance
- **Parameters**: 2B (Gemma 2B base)
- **Quantization**: 4-bit (QLoRA)
- **Memory Usage**: ~4GB VRAM during inference
- **Inference Time**: 2-5 seconds per response (GPU)

### Training Performance
- **Memory Required**: 8-12GB VRAM
- **Training Time**: ~30 minutes for 50 samples (varies by hardware)
- **Checkpoint Size**: ~10MB per adapter

## 🔐 Security Notes

- `tocken.txt` contains API tokens - **DO NOT commit to public repos**
- Server runs on localhost by default - configure firewall for external access
- CORS is set to `*` for development - restrict in production

## 🚀 Deployment

### Local Network Deployment
```bash
# Run server on all interfaces
uvicorn server:app --host 0.0.0.0 --port 8000

# Update frontend CONFIG.apiUrl to your machine's IP
# e.g., 'http://192.168.1.100:8000/chat'
```

### Production Deployment
- Use reverse proxy (nginx/Apache)
- Enable HTTPS
- Restrict CORS origins
- Set up proper authentication
- Use production WSGI server (gunicorn)

## 📚 Technical Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** - Deep learning framework
- **Transformers** - Hugging Face model library
- **PEFT** - Parameter-Efficient Fine-Tuning
- **BitsAndBytes** - Quantization library
- **TRL** - Transformer Reinforcement Learning

### Frontend
- **HTML5** - Semantic structure
- **CSS3** - Glassmorphism, animations
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **JSON** - Data storage and knowledge base

## 🎯 Use Cases

- Personal AI assistant
- Customer support chatbot
- Educational Q&A system
- Domain-specific knowledge base
- Interactive FAQ system
- Prototype for larger AI systems

## 📈 Future Enhancements

- [ ] Multi-turn conversation context
- [ ] Voice input/output integration
- [ ] User authentication and profiles
- [ ] Conversation history storage
- [ ] Streaming responses
- [ ] Multi-language support
- [ ] Model performance analytics
- [ ] A/B testing framework
- [ ] Automated retraining pipeline
- [ ] Docker containerization

## 🤝 Contributing

This is a personal project, but feel free to:
1. Fork and experiment
2. Report issues
3. Suggest improvements
4. Share your training results

## 📄 License

Open source - use freely for personal and educational purposes.

## 👨‍💻 Developer

**Created by Ashish Gupta**

### Key Technologies Used
- Google Gemma 2B
- QLoRA (Quantized Low-Rank Adaptation)
- FastAPI + PyTorch
- Vanilla JavaScript

---

## 🎓 Learning Resources

### Understanding the Components

**QLoRA**: Efficient fine-tuning that reduces memory by 4x using 4-bit quantization
**LoRA**: Low-Rank Adaptation adds small trainable parameters while freezing base model
**Gemma 2B**: Google's efficient 2B parameter open language model

### Recommended Reading
- [Hugging Face Transformers Docs](https://huggingface.co/docs/transformers)
- [PEFT Documentation](https://huggingface.co/docs/peft)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [QLoRA Paper](https://arxiv.org/abs/2305.14314)

---

**🚀 Start chatting with your AI now!**

Run `start_ai.bat` and visit http://localhost:8080

*Built with ❤️ using Gemma 2B, QLoRA, FastAPI, and JavaScript*
