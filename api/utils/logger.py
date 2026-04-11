from loguru import logger as lg
import sys
import os


# unique_id: user_id or job_id
class AppLogger:
    def __init__(self):
        self.app_logger = lg

    def set_logger(self, log_path=sys.stderr, unique_id=None, rotation='500 MB', retention='7 days', filter_type=None, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {extra[unique_id]} | {message}", level='DEBUG'):
        """
        :param log_path: log file path
        :param filter_type: filter
        :param level: [TRACE, DEBUG, INFO, SUCCESS, WARNING, ERROR, CRITICAL]
        :return:
        """
        if unique_id:
            log_path = './' + unique_id +'.log'

        if not os.path.exists(os.path.dirname(log_path)):
             os.makedirs(os.path.dirname(log_path))
            
        dic = dict(
            sink=log_path,
            rotation=rotation,
            retention=retention,
            format=format,
            encoding='utf-8',
            level=level,
            enqueue=True,
        )
        if unique_id:
            dic["filter"] = lambda record: record["extra"].get("unique_id") == unique_id
            # self.app_logger = self.app_logger.bind(unique_id=unique_id)
        elif filter_type:
            dic["filter"] = lambda x: filter_type in str(x['level']).upper()
        
        self.app_logger.add(**dic)

        return self.app_logger

    @property
    def get_logger(self):
        return self.app_logger
    
    @staticmethod
    def trace(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).trace(msg)
 
    def debug(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).debug(msg)
 
    def info(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).info(msg)
 
    def success(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).success(msg)
 
    def warning(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).warning(msg)
 
    def error(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).error(msg)
 
    def critical(self, unique_id, msg):
        self.app_logger.bind(unique_id=unique_id).critical(msg)


# user_format = "{level} | {message}"
logger = AppLogger()
logger.set_logger('/data/logs/error.log', filter_type='ERROR')
logger.set_logger('/data/logs/activity.log', filter_type='INFO', level='INFO')