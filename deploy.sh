# sudo apt-get update
# sudo apt-get upgrade
# sudo apt-get install nginx

yarn build
scp ./dist/* admin@${GUSTAV_IP}:/var/www/gustav/public
