import torch
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
    TrainingArguments,
)
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

MODEL_ID = "google/gemma-2b"

# Load dataset
dataset = load_dataset("json", data_files="data.json")

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
tokenizer.pad_token = tokenizer.eos_token

# QLoRA config (4-bit)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

# Load base model
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.float16
)


# LoRA config
lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    lora_dropout=0.05,
    target_modules=["q_proj", "v_proj"],
    bias="none",
    task_type="CAUSAL_LM",
)

model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

# Format prompt (VERY IMPORTANT)
def format_prompt(example):
    return f"""### Instruction:
{example['instruction']}

### Response:
{example['response']}"""

training_args = TrainingArguments(
    output_dir="./gemma-qlora-output",
    per_device_train_batch_size=1,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    num_train_epochs=3,

    fp16=False,        # ❌ disable AMP completely
    bf16=False,        # ❌ disable BF16

    logging_steps=1,
    save_steps=50,
    save_total_limit=2,
    report_to="none",

    optim="adamw_torch",   # safest on Windows
    max_grad_norm=0.0      # CRITICAL: disables unscale path
)



# Trainer
trainer = SFTTrainer(
    model=model,
    train_dataset=dataset["train"],
    args=training_args,
    formatting_func=format_prompt,
)
trainer.args.max_grad_norm = 0
trainer.accelerator.scaler = None

# Start training
trainer.train()

# Save adapter
model.save_pretrained("gemma-qlora-adapter")
tokenizer.save_pretrained("gemma-qlora-adapter")

print("✅ Fine-tuning completed")
