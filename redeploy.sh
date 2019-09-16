git pull;
npm i;
pm2 stop 0;
pm2 del 0;
pm2 start "npm run start";
pm2 log 0;