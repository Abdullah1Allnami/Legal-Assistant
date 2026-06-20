import os
import argparse
import logging
import yaml
import torch
import random
import numpy as np
from transformers import get_scheduler

from src.model import load_qlora_model_and_tokenizer
from src.dataset import create_dataloader
from src.train import train_model

# Set up basic logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

def set_seed(seed):
    """
    Utility function to set reproducibility seeds across random, numpy, and torch.
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
    logger.info(f"Random seed set to {seed}")

def get_device(device_setting):
    """
    Helper to resolve target training hardware device automatically.
    """
    if device_setting == "auto":
        if torch.cuda.is_available():
            return torch.device("cuda")
        elif torch.backends.mps.is_available():
            return torch.device("mps")
        else:
            return torch.device("cpu")
    return torch.device(device_setting)

def main():
    parser = argparse.ArgumentParser(description="QLoRA Fine-tuning of Qwen3-8B on Pile of Law")
    parser.add_argument("--config", type=str, default="configs/config.yaml", help="Path to config YAML file")
    parser.add_argument("--dry-run", action="store_true", help="Run in dry-run mode (limited steps/samples) for verification")
    args = parser.parse_args()

    # Load parameters configuration
    logger.info(f"Loading configuration from {args.config}...")
    with open(args.config, "r") as f:
        config = yaml.safe_load(f)

    # 1. Setup seed
    seed = config["training"].get("seed", 42)
    set_seed(seed)

    # 2. Resolve target device using get_device
    device_setting = config["training"].get("device", "auto")
    device = get_device(device_setting)
    logger.info(f"Target execution hardware resolved to: {device}")

    # 3. Load QLoRA base model & tokenizer
    model_name = config["model"]["name"]
    use_qlora = config["model"].get("use_qlora", True)
    lora_config = config["lora"]
    
    # Load model and tokenizer
    model, tokenizer = load_qlora_model_and_tokenizer(
        model_name=model_name,
        lora_config=lora_config,
        use_qlora=use_qlora,
        device=device_setting
    )

    # 4. Initialize data loaders (train/val)
    dataset_name = config["data"]["dataset_name"]
    subset = config["data"]["subset"]
    text_col = config["data"]["text_col"]
    max_length = config["model"].get("max_length", 1024)
    batch_size = config["training"].get("batch_size", 2)
    
    max_train_samples = config["data"].get("max_train_samples", None)
    max_val_samples = config["data"].get("max_val_samples", None)
    
    # Override samples if dry-run to speed up loading
    if args.dry_run:
        logger.info("Dry-run mode: Limiting datasets to very few samples.")
        max_train_samples = 10
        max_val_samples = 5

    logger.info("Initializing train data loader...")
    train_dataloader = create_dataloader(
        dataset_name=dataset_name,
        subset=subset,
        split="train",
        tokenizer=tokenizer,
        batch_size=batch_size,
        max_length=max_length,
        max_samples=max_train_samples,
        shuffle=True,
        text_col=text_col
    )

    logger.info("Initializing validation data loader...")
    val_dataloader = create_dataloader(
        dataset_name=dataset_name,
        subset=subset,
        split="validation",  # Pile of Law uses 'validation' for its val split
        tokenizer=tokenizer,
        batch_size=batch_size,
        max_length=max_length,
        max_samples=max_val_samples,
        shuffle=False,
        text_col=text_col
    )

    # 5. Instantiate model, loss function, optimizer, and lr scheduler
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=float(config["training"]["learning_rate"]),
        weight_decay=float(config["training"]["weight_decay"])
    )
    
    # Calculate learning rate steps
    epochs = config["training"].get("epochs", 1)
    grad_accum_steps = config["training"].get("gradient_accumulation_steps", 1)
    
    num_update_steps_per_epoch = len(train_dataloader) // grad_accum_steps
    num_update_steps_per_epoch = max(num_update_steps_per_epoch, 1)
    max_train_steps = epochs * num_update_steps_per_epoch
    warmup_steps = int(max_train_steps * config["training"].get("warmup_ratio", 0.03))
    
    scheduler = get_scheduler(
        name="linear",
        optimizer=optimizer,
        num_warmup_steps=warmup_steps,
        num_training_steps=max_train_steps
    )

    # 6. Execute model training
    logger.info("Starting model fine-tuning...")
    best_val_loss = train_model(
        model=model,
        train_dataloader=train_dataloader,
        val_dataloader=val_dataloader,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        epochs=epochs,
        gradient_accumulation_steps=grad_accum_steps,
        save_dir=config["training"].get("save_dir", "outputs"),
        dry_run=args.dry_run
    )
    
    logger.info(f"Fine-tuning complete. Best validation loss: {best_val_loss:.4f}")

if __name__ == "__main__":
    main()
