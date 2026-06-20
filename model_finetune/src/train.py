import logging
import torch
import os
from tqdm import tqdm

logger = logging.getLogger(__name__)

def train_epoch(model, dataloader, optimizer, scheduler, device, gradient_accumulation_steps=1, dry_run=False):
    """
    Executes one epoch of training over the dataloader for causal language modeling.
    Supports gradient accumulation and Hugging Face model labels computation.
    """
    model.train()
    total_loss = 0.0
    optimizer.zero_grad()
    
    num_steps = len(dataloader)
    if num_steps == 0:
        logger.warning("Empty training dataloader.")
        return 0.0

    progress_bar = tqdm(enumerate(dataloader), total=num_steps, desc="Training")
    
    actual_steps = 0
    for step, batch in progress_bar:
        if dry_run and step >= 3:
            logger.info("Dry-run: exiting training epoch early.")
            break
            
        # Move tensor elements of the batch dictionary to target device
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)
        
        # Forward pass: HF AutoModelForCausalLM calculates loss internally when labels are supplied
        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        
        # Normalize loss to account for gradient accumulation
        loss = loss / gradient_accumulation_steps
        
        if not dry_run:
            loss.backward()
            
        total_loss += loss.item() * gradient_accumulation_steps
        actual_steps += 1
        
        # Step optimizer and learning rate scheduler at accumulation interval boundary
        if (step + 1) % gradient_accumulation_steps == 0 or (step + 1) == num_steps:
            if not dry_run:
                # Perform gradient clipping to avoid exploding gradients in LLMs
                torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
                optimizer.step()
                if scheduler is not None:
                    scheduler.step()
                optimizer.zero_grad()
                
        progress_bar.set_postfix({"loss": f"{loss.item() * gradient_accumulation_steps:.4f}"})
        
    avg_loss = total_loss / max(actual_steps, 1)
    return avg_loss

def train_model(
    model, 
    train_dataloader, 
    val_dataloader, 
    optimizer, 
    scheduler, 
    device, 
    epochs, 
    gradient_accumulation_steps,
    save_dir, 
    dry_run=False
):
    """
    Orchestrates the multi-epoch training pipeline, periodic validation, and model checkpoint saving.
    """
    # Inline import to avoid circular dependency
    from src.evaluate import evaluate_model
    
    best_val_loss = float("inf")
    
    for epoch in range(epochs):
        logger.info(f"=== Epoch {epoch + 1}/{epochs} ===")
        
        train_loss = train_epoch(
            model=model,
            dataloader=train_dataloader,
            optimizer=optimizer,
            scheduler=scheduler,
            device=device,
            gradient_accumulation_steps=gradient_accumulation_steps,
            dry_run=dry_run
        )
        logger.info(f"Epoch {epoch + 1} average training loss: {train_loss:.4f}")
        
        # Evaluate model performance
        logger.info("Evaluating model on validation split...")
        val_metrics = evaluate_model(
            model=model,
            dataloader=val_dataloader,
            device=device,
            dry_run=dry_run
        )
        
        val_loss = val_metrics.get("loss", float("inf"))
        perplexity = val_metrics.get("perplexity", float("inf"))
        logger.info(f"Validation loss: {val_loss:.4f} | Perplexity: {perplexity:.4f}")
        
        # Save best weights/adapters checkpoint
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            if not dry_run:
                os.makedirs(save_dir, exist_ok=True)
                save_path = os.path.join(save_dir, "best_model_checkpoint")
                logger.info(f"Saving new best checkpoint to {save_path}...")
                model.save_pretrained(save_path)
                
    return best_val_loss
