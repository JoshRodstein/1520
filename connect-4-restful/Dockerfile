FROM python:3.7.2

MAINTAINER Your Name "joshua.rodstein@elliemae.com"

COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
ENTRYPOINT ["python"]
CMD ["connect4.py"]
