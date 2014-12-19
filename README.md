#Freesoundplaytag

Create a Raspberry Pi audio player that plays sounds files from the freesound.org api.

##Setup

You'll want to setup your RPi's SD Card following [these steps](https://gist.github.com/vinceallenvince/7cae6fcfc78091475e81). Follow the instructions to use NodeJS and the 'player' npm module.

Clone this repo to your home folder.
```
git clone https://github.com/vinceallenvince/freesoundplaytag.git
```

Install the node modules.
```
cd freesoundplaytag
npm install
```

If you want the player to auto-start when you boot up the RPi, add this like to the bottom of your /etc/profile file.
```
/opt/node/bin/node /home/pi/freesoundplaytag/main.js
```

You also need the pi to auto login. Follow [these instructions](http://raspberrypi.stackexchange.com/questions/3873/auto-login-with-gui-disabled-in-raspbian).
