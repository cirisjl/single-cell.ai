class CeleryTaskException(Exception):
    """Custom Exception Handler for Celery Task Failures

    Attributes:
        message -- explanation of the error
    """
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)

