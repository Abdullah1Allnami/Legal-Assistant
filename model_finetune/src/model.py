import torch
import torch.nn as nn
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import logging

logger = logging.getLogger(__name__)

def load_qlora_model_and_tokenizer(model_name, lora_config, use_qlora=True, device="auto", **kwargs):
    """
    Loads pre-trained model and tokenizer, applies 4-bit quantization (QLoRA) if requested,
    and configures/attaches LoRA adapter modules.
    """
    logger.info(f"Initializing model '{model_name}'...")
    
    # 1. Configure BitsAndBytes quantization if QLoRA is toggled
    bnb_config = None
    if use_qlora:
        if torch.cuda.is_available():
            logger.info("CUDA device detected. Setting up 4-bit BitsAndBytes quantization (NF4)...")
            # Select bfloat16 if GPU support exists, otherwise float16
            compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
                bnb_4bit_compute_dtype=compute_dtype
            )
        else:
            logger.warning("CUDA not available. Dynamic QLoRA quantization disabled. Falling back to half-precision/full precision.")

    # 2. Resolve default training hardware and memory dtype
    device_map = "auto" if device == "auto" else device
    if not torch.cuda.is_available() and device_map == "auto":
        device_map = "cpu"
        
    torch_dtype = torch.float32
    if torch.cuda.is_available():
        torch_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16

    # 3. Load base model
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        quantization_config=bnb_config,
        device_map=device_map,
        torch_dtype=torch_dtype,
        trust_remote_code=True
    )

    # 4. Load & configure tokenizer
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        logger.info("Setting tokenizer pad_token to eos_token.")
        tokenizer.pad_token = tokenizer.eos_token
        
    # 5. Prepare quantized model for training (gradient checkpointing and layer frozen states)
    if use_qlora and bnb_config is not None:
        model = prepare_model_for_kbit_training(model)

    # 6. Apply LoRA Peft adapters
    logger.info("Initializing LoRA adapter configurations...")
    peft_config = LoraConfig(
        r=lora_config.get("r", 16),
        lora_alpha=lora_config.get("alpha", 32),
        target_modules=lora_config.get("target_modules", ["q_proj", "k_proj", "v_proj", "o_proj"]),
        lora_dropout=lora_config.get("dropout", 0.05),
        bias=lora_config.get("bias", "none"),
        task_type="CAUSAL_LM"
    )

    model = get_peft_model(model, peft_config)
    
    # Disable cache to avoid warnings with gradient checkpointing during training
    model.config.use_cache = False
    
    logger.info(f"Model successfully loaded. Trainable parameters:")
    model.print_trainable_parameters()
    
    return model, tokenizer
