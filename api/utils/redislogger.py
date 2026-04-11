import redis
import asyncio
from utils.logger import *


# unique_id: user_id or job_id
class RedisLogger:
    def __init__(self):
        # redis_pass = os.getenv("REDIS_PASSWORD")
        # redis_port = os.getenv("REDIS_PORT")
        redis_password = self.read_secret(path="/run/secrets/redis_password")
        redis_host = os.getenv("CELERY_RESULT_BACKEND_HOST", "oscb_redis")
        redis_port = os.getenv("REDIS_PORT", "6388")

        print(f"Connecting to Redis at {redis_host}:{redis_port} with password: {redis_password}")

        pool = redis.ConnectionPool(host=redis_host, port=redis_port, password=redis_password, db=0)
        self.r = redis.Redis(connection_pool=pool)
        # self.r = redis.Redis(host='oscb_redis', port=6388, password='eYVX7EwVmmxKPCDmwMtyKVge8oLd2t81', db=0)
        self.app_logger = logger

    
    def read_secret(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
        

    def write_log(self, unique_id, msg):
        self.r.rpush(unique_id, msg)

    def read_log(self, unique_id):
        """
        Fetch all logs for the given unique_id from Redis.
        """
        try:
            # Fetch all logs for the given key
            logs = self.r.lrange(unique_id, 0, -1)  # Retrieve the entire list
            log_lines = [log.decode('utf-8') for log in logs]  # Decode bytes to strings

            self.r.expire(unique_id, 60 * 30)  # Reset key expiration to 30 minutes
            return log_lines
        except Exception as e:
            print(f"Error reading logs: {e}")
            return []


    def clear_log(self, unique_id):
        self.r.ltrim(unique_id, 1, 0)


    def close(self):
        self.r.close()

    
    @staticmethod
    def trace(self, unique_id, msg):
        self.write_log(unique_id, 'TRACE    | ' + msg)
        self.app_logger.trace(unique_id, msg)
 

    def debug(self, unique_id, msg):
        self.write_log(unique_id, 'DEBUG    | ' + msg)
        self.app_logger.debug(unique_id, msg)
 

    def info(self, unique_id, msg):
        self.write_log(unique_id, 'INFO     | ' + msg)
        self.app_logger.info(unique_id, msg)
 

    def success(self, unique_id, msg):
        self.write_log(unique_id, 'SUCCESS  | ' + msg)
        self.app_logger.success(unique_id, msg)
 

    def warning(self, unique_id, msg):
        self.write_log(unique_id, 'WARNING  | ' + msg)
        self.app_logger.warning(unique_id, msg)
 

    def error(self, unique_id, msg):
        self.write_log(unique_id, 'ERROR    | ' + msg)
        self.app_logger.error(unique_id, msg)
 

    def critical(self, unique_id, msg):
        self.write_log(unique_id, 'CRITICAL | ' + msg)
        self.app_logger.critical(unique_id, msg)



redislogger = RedisLogger()

# async def log_reader(unique_id, start=0, end=30) -> list:
#     log_lines = []
#     for line in redislogger.read_log(unique_id, start, end):
#         if line.__contains__("ERROR"):
#             log_lines.append(f'<span class="text-red-500">{line}</span><br/>')
#         elif line.__contains__("WARNING"):
#             log_lines.append(f'<span class="text-yellow-400">{line}</span><br/>')
#         elif line.__contains__("SUCCESS"):
#             log_lines.append(f'<span class="text-green-500">{line}</span><br/>')
#         else:
#             log_lines.append(f"{line}<br/>")
#     return log_lines

async def log_reader(unique_id, last_read_index):
    """
    Fetch only new logs from Redis, starting from the last_read_index.
    """
    try:
        # Fetch all logs for the unique_id
        all_logs = redislogger.read_log(unique_id)  # Get all logs as a list of strings
        log_lines = []

        # Process only the new logs (from last_read_index onwards)
        new_logs = all_logs[last_read_index:]

        for log in new_logs:
            if "ERROR" in log:
                log_lines.append(f'<span class="text-red-500">{log}</span><br/>')
            elif "WARNING" in log:
                log_lines.append(f'<span class="text-yellow-400">{log}</span><br/>')
            elif "SUCCESS" in log:
                log_lines.append(f'<span class="text-green-500">{log}</span><br/>')
            else:
                log_lines.append(f"{log}<br/>")

        # Update the last_read_index to the current total length of logs
        if new_logs:  # Only update if new logs are processed
            last_read_index += len(new_logs)
        return log_lines, last_read_index  # Return new logs and the updated index
    except Exception as e:
        print(f"Error in log_reader: {e}")
        return [], last_read_index  # Return an empty list if an error occurs
