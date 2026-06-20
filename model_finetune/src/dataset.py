import torch
from torch.utils.data import Dataset, DataLoader
from datasets import load_dataset
import logging

logger = logging.getLogger(__name__)

class CustomDataset(Dataset):
    """
    Dataset wrapper for Pile of Law dataset from Hugging Face for Causal Language Modeling.
    """
    def __init__(self, dataset_name, subset, split, tokenizer, max_length=1024, max_samples=None, text_col="text", **kwargs):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.text_col = text_col
        
        logger.info(f"Loading dataset '{dataset_name}' (subset: '{subset}', split: '{split}')...")
        
        # Load dataset from Hugging Face
        raw_dataset = load_dataset(dataset_name, name=subset, split=split)
        
        # Optionally slice/limit samples for verification or resource constraints
        if max_samples and max_samples < len(raw_dataset):
            logger.info(f"Slicing dataset split '{split}' to first {max_samples} samples.")
            self.samples = raw_dataset.select(range(max_samples))
        else:
            self.samples = raw_dataset
            
        logger.info(f"Loaded {len(self.samples)} samples for split '{split}'.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample = self.samples[idx]
        text = sample[self.text_col] or ""
        
        # Tokenize the text sequence
        encodings = self.tokenizer(
            text,
            truncation=True,
            max_length=self.max_length,
            padding=False,  # Dynamic padding will be handled in the collator
            return_tensors=None
        )
        
        input_ids = encodings["input_ids"]
        attention_mask = encodings["attention_mask"]
        
        # Labels are identical to input_ids for autoregressive language modeling
        labels = input_ids.copy()
        
        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "labels": labels
        }

def causal_lm_collate_fn(batch, pad_token_id):
    """
    Collator to dynamically pad inputs and target labels in a batch.
    - input_ids are padded with the tokenizer pad_token_id.
    - attention_mask is padded with 0.
    - labels are padded with -100 (standard PyTorch ignore_index).
    """
    input_ids = [torch.tensor(item["input_ids"]) for item in batch]
    attention_mask = [torch.tensor(item["attention_mask"]) for item in batch]
    labels = [torch.tensor(item["labels"]) for item in batch]
    
    padded_input_ids = torch.nn.utils.rnn.pad_sequence(
        input_ids, batch_first=True, padding_value=pad_token_id
    )
    padded_attention_mask = torch.nn.utils.rnn.pad_sequence(
        attention_mask, batch_first=True, padding_value=0
    )
    padded_labels = torch.nn.utils.rnn.pad_sequence(
        labels, batch_first=True, padding_value=-100
    )
    
    return {
        "input_ids": padded_input_ids,
        "attention_mask": padded_attention_mask,
        "labels": padded_labels
    }

def create_dataloader(dataset_name, subset, split, tokenizer, batch_size, max_length, max_samples=None, shuffle=True, **kwargs):
    """
    Instantiate CustomDataset and return a PyTorch DataLoader with dynamic padding collator.
    """
    dataset = CustomDataset(
        dataset_name=dataset_name,
        subset=subset,
        split=split,
        tokenizer=tokenizer,
        max_length=max_length,
        max_samples=max_samples,
        **kwargs
    )
    
    # Resolve pad_token_id (default to 0 if not defined)
    pad_token_id = tokenizer.pad_token_id if tokenizer.pad_token_id is not None else 0
    
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        collate_fn=lambda b: causal_lm_collate_fn(b, pad_token_id)
    )
    
    return dataloader
