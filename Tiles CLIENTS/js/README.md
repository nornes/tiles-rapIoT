# TilesJS Library

Tiles Client Library is an event-driven API for the Tiles project written in JavaScript for Node.js and the browser. It's built on top of [MQTT.js](https://github.com/mqttjs/MQTT.js) and Node.js's [EventEmitter](https://github.com/Gozala/events).

<a name="Installation"></a>
## Library Installation

Install dependencies:
```sh
npm install
```

To use this client library in the browser see the [Browser](#Browser) section.

## Fundamentals 

Tiles applications are based on Tiles modules exchanging *events* and *commands*, encapsulating interaction primitives, between each other and with third-party clients. 

![GitHub Logo](imgs/events-commands.png)

An *event* describes and input primitive, like a tile being tapped, shaken or rotated. 

A *command* describes an output primitive provided by a tile module, for example vibrating, changing the LED colors or emitting a sound.

Events and commands are characterized by *name* and *two optinal parameters* which further describe the type of interaction primitive happening.

The list of events and commands currently implemented is available [HERE](https://docs.google.com/spreadsheets/d/1b0ByrMQosh1BtK5hjAW2eLOzJf7y3-SCpFSCwuzxlRg/edit?usp=sharing)

<a name="Example"></a>
## Example

This code showcases how to connect to Tiles Cloud, receive an event (input primitive) from Tiles and send a command (output primitive) to one or more tiles. Whenever an event is received, the event will be printed to the console.

In this example, we first connect to Tiles Cloud as `TestUser`, in the namespaced group `demo`. Then, whenever a Tile is tapped once, it will start blinking in red. If the Tile is tapped twice, the LED will be turned off.

```js
var TilesClient = require('tiles-client.js');

var client = new TilesClient('TestUser', 'demo').connect();

client.on('receive', function(tileId, event){
	console.log('Event received from ' + tileId + ': ' + JSON.stringify(event));
    if (event.name === 'tap' && event.properties[0] === 'single'){
    	client.send(tileId, 'led', 'blink', 'red');
    } else if (event.name === 'tap' && event.properties[0] === 'double'){
    	client.send(tileId, 'led', 'off');
    }
});
```

<a name="API"></a>
## API

### Create client
Create a client by providing your username and connecting to the default Tiles Cloud server. The `group` parameter is optional and enables targeting a subgroup of your devices. If this parameter is omitted, the client is able to communicate with any Tiles device in the user's "global channel", i.e. Tiles without a specified group.
```javascript
var tilesClient = new TilesClient(username[, group]).connect();
```

(Optional) Create a client by connecting to a custom Tiles Cloud server:
```javascript
var tilesClient = new TilesClient(username[, group][, server_address][, port]).connect();
```

### Send command
Send a command to a Tile by specifying the Tile's ID, and a command name and properties.

<small>This function requires minimum one property, i.e. a total of three required parameters. There are currently no imposed maximum limit for number of properties this function can handle, but all actuators currently supported by the Tiles devices can be controlled by the use of at most two properties.</small>
```javascript
tilesClient.send(tileId, commandName, property1[, property2][, ...]);
```

### Events

Add listeneres for events by registering callback methods.
```javascript
tilesClient.on(event, callback);
```

#### Event `'connect'`

`function() {}`

Emitted on successful (re)connection to the server.

#### Event `'receive'`

`function(tileId, event) {}`

Emitted when a message sent from/to a Tile is received. (See [example](#Example) above)
* `tileId` The ID of the Tile the message was sent to/from.
* `event` An event object (Parsed JSON payload of the received packet)
* `event.name` Name of the received event
* `event.properties[n-1]` The n-th property of the event <small>(Currently, the Tiles devices emits events with at most two properties)</small>

#### Event `'tileRegistered'`

`function(tileId) {}`

Emitted when a Tile is registered/connected.
* `tileId` The ID of the registered Tile

#### Event `'tileUnregistered'`

`function(tileId) {}`

Emitted when a Tile is unregistered/disconnected.
* `tileId` The ID of the unregistered Tile

<a name="GetTileByName"></a>
### Get Tile by name
Get the ID (MAC address) of a Tile by looking it up by name:
```javascript
tilesClient.tiles['TILES1']
```

<a name="Browser"></a>
## Browser

### Browserify

In order to use this client library in a browser, [Browserify](https://github.com/substack/node-browserify) can be used to create a stand-alone build.

```sh
npm install // Install dependencies
npm install -g browserify // Install Browserify globally
browserify tiles-client.js -s TilesClient > browserTilesClient.js
```

This can also be done using a predefined script (after completing the steps under [Installation](#Installation)):

```sh
npm run [bundle-js | bundle-min-js]
```

This will create a bundled JavaScript file in the ``dist/`` directory. Use ``bundle-min-js`` if you want to create a minified version.

The generated module is AMD/CommonJS compatible. If no module system is found, an object ``TilesClient`` is added to the global namespace, which makes it accessible from the browser.
