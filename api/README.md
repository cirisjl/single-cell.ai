# AI-Ready(FastAPI Backend Application)

## Python Configuration:
When running this application using pycharm, configure python interpreter and create virtual environment

### Step 1:
Install all the packages in the requirements.txt and Run the main.py

### Step 2:
#### Start the celery instance
```celery -A celery_worker.celery worker --loglevel=info --concurrency=2```

### step 3:
#### start the flower monitoring tool
```celery flower -A celery_worker.celery --broker:amqp://localhost```

### step 4:
#### Start the rabbitmq docker container
```docker run -d -p 5673:5673 rabbitmq```

### step 5:
#### start the redis docker container
```docker run -d -p 6379:6379 redis```
