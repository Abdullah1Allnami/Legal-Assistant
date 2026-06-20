import logging
import torch
import math
from tqdm import tqdm

logger = logging.getLogger(__name__)

def evaluate_model(model, dataloader, device, dry_run=False):
    """
    Evaluates the model on validation data for causal language modeling.
    Returns a dictionary containing average evaluation loss and perplexity.
    """
    model.eval()
    total_loss = 0.0
    
    num_steps = len(dataloader)
    if num_steps == 0:
        logger.warning("Empty validation dataloader.")
        return {"loss": float("inf"), "perplexity": float("inf")}

    progress_bar = tqdm(enumerate(dataloader), total=num_steps, desc="Evaluating")
    
    actual_steps = 0
    with torch.no_grad():
        for step, batch in progress_bar:
            if dry_run and step >= 3:
                logger.info("Dry-run: exiting evaluation loop early.")
                break
                
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)
            
            # Forward pass: HF AutoModelForCausalLM computes cross-entropy internally
            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            
            total_loss += loss.item()
            actual_steps += 1
            
            progress_bar.set_postfix({"loss": f"{loss.item():.4f}"})
            
    avg_loss = total_loss / max(actual_steps, 1)
    
    # Perplexity (PPL) calculation: exp(loss)
    try:
        perplexity = math.exp(avg_loss)
    except OverflowError:
        perplexity = float("inf")
        
    return {
        "loss": avg_loss,
        "perplexity": perplexity
    }
