# Build a new image
docker build --tag pbot --build-arg config_file=config.prod.js .

# Replace the running container (if any) with one based on the new image
docker stop pbot -t 10 && docker container rm pbot
docker run -itd --name pbot pbot

# Remove old images to free up disk space
docker images | grep none | awk '{ print $3 }' | xargs docker rmi
