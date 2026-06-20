import redis
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def check_redis_connection() -> bool:
    try:
        return redis_client.ping()
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False
