FROM python:alpine
# set work directory
WORKDIR /code

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
# prevents Python from copying pyc files to the container.
ENV PYTHONUNBUFFERED 1
# ENV PYTHONUNBUFFERED 1 ensures that Python output is logged to the terminal,

# Install gcc so Python packages such as MarkupSafe and SQLAlchemy can compile speedups.
# RUN apk add —no-cache gcc musl-dev linux-headers

# install dependencies
RUN pip install --upgrade pip 
COPY requirements.txt requirements.txt
RUN apk update \
    &&  apk add --virtual build-deps pkgconfig  python3-dev openssl-dev libxml2-dev  libxslt-dev libffi-dev musl-dev make gcc  \
    && apk add postgresql-dev  \
    && pip install  psycopg2
RUN pip install --cache-dir .pip_cache -r requirements.txt

# copy project
COPY . .

EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]