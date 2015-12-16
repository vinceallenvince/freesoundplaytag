#rpi-freesound-player

Create a Raspberry Pi audio player that plays sounds files from the [freesound.org](http://www.freesound.org) api based on a tag (ie. birds, bells, santa, etc).

##Config

Copy the _config.js file as config.js and add a tag to describe the sounds you want to play... like "dogs", "ocean", "ambient", etc.

Also add your [freesound api key](https://www.freesound.org/api/apply/).

##Setup

Use the following instructions to prepare your RPi's SD Card.

###Install an operating system.

You first need to install an operating system on your RPi. Raspian should work fine. If you're using a monitor, keyboard and mouse, using an install manager is the easiest way. Just follow the [instuctions for installing NOOBS](http://www.raspberrypi.org/help/noobs-setup/).

If you are developing headless, follow the instructions for [downloading](http://www.raspberrypi.org/downloads/) and [installing](http://www.raspberrypi.org/documentation/installation/installing-images/mac.md) Raspian. You'll also need to login via [ssh](http://www.adafruit.com/blog/2012/12/20/tutorial-adafruits-raspberry-pi-lesson-6-using-ssh-raspberry_pi-raspberrypi/) or a [console cable](https://learn.adafruit.com/adafruits-raspberry-pi-lesson-5-using-a-console-cable/software-installation-mac). If you're on Yosemite on a Mac, [this post](http://zittlau.ca/fix-usb-serial-console-on-raspberry-pi-for-yosemite/) will help.

Your SD Card should be at least 8GB to hold both the operating system and your application.

###System setup

If you installed via NOOBS, you'll see raspi-config. If not, after a successful first boot, run raspi-config and set the following options.

```
raspi-config
```

* Expand filesystem

    Follow the instructions to expand the filesystem. You may need to reboot. If so, launch raspi-config again when the system returns.

* Audio out

    If you plan to use the audio jack, force audio out the 3.5mm jack instead of the HDMI port. Go to 'Advanced Options': 'Audio' and select 'Force 3.5mm jack'.

###Wifi

* Single Wifi point

    [https://learn.adafruit.com/adafruits-raspberry-pi-lesson-3-network-setup/setting-up-wifi-with-occidentalis](https://learn.adafruit.com/adafruits-raspberry-pi-lesson-3-network-setup/setting-up-wifi-with-occidentalis)

    Note: Use tabs to indent the wpa-ssid and wpa-psk entries, not spaces.

    After rebooting test the Wifi connection.
    ```
    ping 139.130.4.5
    ```

* Multiple Wifi points

    http://www.algissalys.com/index.php/how-to/90-how-to-raspberry-pi-wifi-setup-through-command-line

    For details on using wpa_supplicant.conf
    ```
    zcat /usr/share/doc/wpasupplicant/README.Debian.gz | less
    ```

    To check and see which one you’re using at any given time, just use the following command.
    ```
    iwconfig
    ```

    Shutdown the Wifi interface.
    ```
    sudo ifdown wlan0
    ```

    Reload the Wifi interface.
    ```
    sudo ifup wlan0
    ```

###Install packages

Make sure you've configured an Internet connection before proceeding.

* NodeJS

    - Install Node using [these instructions](http://raspberryalphaomega.org.uk/2014/06/11/installing-and-using-node-js-on-raspberry-pi/). The latest version I found compiled for the RPi is [v0.10.28](http://nodejs.org/dist/v0.10.28/).

    - Install node-gyp by referencing the full path to node when running the command as root. To fix this, check out [this thread](http://raspberrypi.stackexchange.com/questions/11958/running-npm-install-throws-permission-error). You need this for the [speaker](https://github.com/turingou/player) npm module.

    ```
    sudo /opt/node/bin/npm install -g node-gyp
    ```

 * Get [libasound2-dev](https://packages.debian.org/search?keywords=libasound2-dev).

    ```
    sudo apt-get install libasound2-dev
    ```

* Get [avahi-utils](https://packages.debian.org/wheezy/avahi-utils)

    ```
    sudo apt-get install avahi-utils
    ```

* Get [libevent-2.0-5](https://packages.debian.org/search?keywords=libevent-2.0-5)

    ```
    sudo apt-get install libevent-2.0-5
    ```

* Get [portaudio19-dev](https://packages.debian.org/search?keywords=portaudio19-dev)

    ```
    sudo apt-get install portaudio19-dev
    ```

* Install git.

    ```
    sudo apt-get install git-core
    ```

* If you want to use vim instead of nano.

    ```
    sudo apt-get install vim
    ```

* Check your remaining disk space.

    ```
    df
    ```

###Configure

* If you're building a headless project, you'll likely want the RPi to auto login.

   Update the /sbin/getty invocations for the runlevels
   ```
   sudo vim /etc/inittab
   ```
   Find this line.
   ```
   1:2345:respawn:/sbin/getty --noclear 38400 tty1
   ```
   Comment it out and add the following line as the next line.
   ```
   1:2345:respawn:/bin/login -f pi tty1 </dev/tty1 >/dev/tty1 2>&1
   ```
   Now you should have this.
   ```
   #1:2345:respawn:/sbin/getty --noclear 38400 tty1
   1:2345:respawn:/bin/login -f pi tty1 </dev/tty1 >/dev/tty1 2>&1
   ```

   - Note: if you are connected via a console cable, you want to add the autologin option to the corresponding line in /etc/inittab
   ```
   T0:23:respawn:/sbin/getty --autologin pi -L ttyAMA0 115200 vt100
   ```

### Install rpi-freesound-player

* Clone this repo to your home folder.

	```
	git clone https://github.com/vinceallenvince/freesoundplaytag.git
	```

* Install the node modules.

	```
	cd freesoundplaytag
	npm install
	```

* If you want the player to auto-start when you boot up the RPi, add this like to the bottom of your /etc/profile file.
	```
	/opt/node/bin/node /home/pi/freesoundplaytag/main.js
	```

* You also need the pi to auto login. Follow [these instructions](http://raspberrypi.stackexchange.com/questions/3873/auto-login-with-gui-disabled-in-raspbian).
