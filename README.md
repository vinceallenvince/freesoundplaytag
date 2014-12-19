#Freesoundplaytag

Create a Raspberry Pi audio player that plays sounds files from the freesound.org api.

##Setup

You'll want to setup your RPi's SD Card following these steps. Follow the instructions to use NodeJS and the 'player' npm module.

If you want the player to auto-start when you boot up the RPi, you'll also want to create a file in your RPi's /home/pi folder called start.sh. 

```
#!/bin/bash
( cd /home/pi/freesoundplaytag
node main.js
)
```

You also need to run this file on login. Follow [these instructions](http://www.opentechguides.com/how-to/article/raspberry-pi/5/raspberry-pi-auto-start.html).

You'll also need to run that script as root. Follow [these instructions](http://askubuntu.com/questions/167847/how-to-run-bash-script-as-root-with-no-password) to setup the permissions.
