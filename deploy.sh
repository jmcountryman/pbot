# Fetch latest code
git pull origin master

cd ../pbot-admin-api
git pull origin master

cd ../pbot-admin-web
git pull origin master

cd ../pbot

# Build a new image
docker-compose up -d --build prod

# Remove old images to free up disk space
docker container prune -f
docker images | grep none | awk '{ print $3 }' | xargs docker rmi
