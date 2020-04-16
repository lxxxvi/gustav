# sudo apt-get update
# sudo apt-get upgrade
# sudo apt-get install nginx

npx webpack

scp ./dist/* admin@${GUSTAV_IP}:/var/www/gustav/public
scp ./public/* admin@${GUSTAV_IP}:/var/www/gustav/public
