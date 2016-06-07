# Tiles Mobile Application

### Installation

First, install [Node.js](http://nodejs.org/).

#### Suggested step for Mac OS X

Install [Homebrew](http://brew.sh), a package manager for OS X, and then run the following command:
```sh
$ brew install node
```

#### Mobile Platform
Then, install the latest Cordova and Ionic [command-line tools](https://www.npmjs.com/package/ionic):

```sh
$ npm install -g cordova
$ npm install -g ionic
```

Change directory to "Tiles MOBILE":
```sh
$ cd "Tiles MOBILE"
```

Now, we need to tell Ionic that we want to enable the Android and iOS platforms. Note: Unless you are on Mac OS, leave out the iOS platform:
```sh
$ ionic platform add android
$ ionic platform add ios
```

Update Ionic library files:
```sh
$ ionic lib update
```

Restore and/or reinstall cordova plugins to versions defined in ``package.json``:
```sh
$ ionic state restore --plugins
```

### Run application
Deploy the Ionic app on specified platform devices. If a device is not hooked up to the USB port, it'll then deploy to an emulator/simulator.
To deploy and test the app on Android devices you need to enable USB debugging in the device's settings: ``Settings`` -> ``Developer options`` -> Enable ``USB debugging``.

```sh
$ ionic run [android|ios] # -l enables live reload, -c enables console log
```
To build native project for the target platform. Projects will be compiled in the /platform dir
```sh
$ ionic build [android|ios]
```

#### iOS Only
- Run the XCODE project from the ``/platform`` dir. You will need a valid provisioning profile. Since 2015 you can get a free, limited provisioning profile see [Free provisining profile](https://developer.xamarin.com/guides/ios/getting_started/installation/device_provisioning/free-provisioning/)
- Once the App in installed, in case you get an "Untrusted developer" warning, go to ``Settings`` -> ``General`` -> ``Device Management``, tap on your ``Profile`` then tap on the ``Trust`` button.

#### Tiles Connection
- Turn on Bluetooth.
- In the app, use pull-to-refresh or the 'Refresh'-button to refresh the list of nearby Bluetooth devices
- When the Tile device is discovered, click 'Connect'.
- You'll now be presented with a button to set the group for the device and an expandable accordion panel which contains a switch to control the LED Light on the Tile, and an indicator showing the most recently received event.

#### Server Connection
From the app you can connect to the server using:

- Username: ``<your_username_of_choice>``
- Host: ``cloud.tilestoolkit.io``
- Port: ``8080``

#### Mosquitto Test Server
- The app can connect to Mosquitto's test server/broker if an internet connection is available on the device.
- When a Tile is successfully connected to the phone, it will be able to send and receive messages to/from the server, using the phone as a gateway.
- This functionality can be tested using a tool such as [MQTTlens](https://chrome.google.com/webstore/detail/mqttlens/hemojaaeigabkbcookmlgmdigohjobjm):
  - Set up a connection to Mosquitto's test server (Hostname: ``tcp://test.mosquitto.org``, Port: ``1883``).
  - Subscribe to the topic ``tiles/evt/<userName>/#``.
  - Now, whenever an event is emitted by one of `<userName>`'s Tiles, a JSON formatted string, containing the event, will be sent to the MQTT broker and the message will show up in MQTTlens.
  - To send a command from the server to a Tile, publish a message to the topic ``tiles/cmd/<userName>/<group>/<deviceId>`` in the following format: 
  ```json
  {"name": "led", "properties": ["blink","blue"]}
  ```
  If no group is specified for the device, use ``global``.
