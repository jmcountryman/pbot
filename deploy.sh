docker build --tag pissbot --build-arg config_file=config.prod.js .
docker stop pissbot -t 10
docker run -itd --name pissbot pissbot
