# Build a new image
docker build --tag pissbot --build-arg config_file=config.prod.js .

# Replace the running container (if any) with one based on the new image
docker stop pissbot -t 10 && docker container rm pissbot
docker run -itd --name pissbot pissbot

# Remove old images to free up disk space
docker images | grep none | awk '{ print $3 }' | xargs docker rmi
