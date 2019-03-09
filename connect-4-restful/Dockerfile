FROM python:3.7.2

MAINTAINER Your Name "joshua.rodstein@elliemae.com"

ENV FLASK_APP connect4.py

COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
RUN export FLASK_APP=connect4.py
ENTRYPOINT ["python"]
CMD ["connect4.py"]
