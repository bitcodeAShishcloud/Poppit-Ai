import os
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel

BASE_MODEL = "google/gemma-2b-it"
ADAPTER_REPO = "USERNAMagupta38160/gemma-qlora-adapter"

HF_TOKEN = os.getenv("HF_TOKEN")

tokenizer = AutoTokenizer.from_pretrained(
    BASE_MODEL,
    token=HF_TOKEN
)

base_model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    device_map="auto",
    torch_dtype=torch.float16,
    token=HF_TOKEN
)

model = PeftModel.from_pretrained(
    base_model,
    ADAPTER_REPO,
    token=HF_TOKEN
)

model.eval()
