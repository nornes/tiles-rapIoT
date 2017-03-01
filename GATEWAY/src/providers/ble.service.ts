import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { BLE } from 'ionic-native';
import 'rxjs/add/operator/toPromise';

import { MqttClient } from './mqttClient';
import { TilesApi, CommandObject } from './tilesApi.service';
import { Device, DevicesService }from './devices.service';

// A dictionary of new device names set by user
let tileNames = {};

@Injectable()
export class BleService {

	rfduino = {
    serviceUUID: '2220',
    receiveCharacteristicUUID: '2221',
    sendCharacteristicUUID: '2222',
    disconnectCharacteristicUUID: '2223'
  };

  mockDevices = [
  	{'name': 'TI SensorTag','id': '01:23:45:67:89:AB', 'rssi': -79, 'advertising': null},
  	{'name': 'Some OtherDevice', 'id': 'A1:B2:5C:87:2D:36', 'rssi': -52, 'advertising': null}
  ];


  constructor(private events: Events,
              private devicesService: DevicesService,
              private mqttClient: MqttClient,
  						private tilesApi: TilesApi) {
  };

  /**
   * Checking if bluetooth is enabled and enable on android if not
   * never used atm
   */
  scanForDevices = (): void => {
    BLE.isEnabled()
		  		  .then( res => {
		   		 		this.scanBLE();
		   		 	})
		  		  .catch( err => {
		  		 		alert('Bluetooth not enabled!');
		  		 		// NB! Android only!! IOS users has to turn bluetooth on manually
		  		 		BLE.enable()
				  		 	 .then( res => {
                    alert('Bluetooth has been enabled');
                    this.scanBLE();
                  })
				    		 .catch( err => {
                    alert('Failed to enable bluetooth, try doing it manually');
                  });
		  		  });
  };

  /**
   * Checking to see if any bluetooth devices are in reach
   */
  scanBLE = (): void => {
    // A list of the discovered devices
    let newDevices: Array<Device> = [];
    //TODO: BUG: The completion function is never called.

    // The ble-service returns an observable and we subscribe to it here
    // This means that for every new device discovered the first function
    // should run, and when it has discovered all the devices it should run
    // the last one.
    //TODO: unsubscribe at some point
    BLE.scan([], 30).subscribe(
      // function to be called for each new device discovered
      bleDevice => {
        if (this.tilesApi.isTilesDevice(bleDevice) && this.devicesService.isNewDevice(bleDevice)) {
          const device = this.devicesService.convertBleDeviceToDevice(bleDevice);
          //test that the discovered device is not in the list of new devices
          if (!newDevices.map(discoveredDevice => discoveredDevice.id).includes(device.id)) {
            this.mqttClient.registerDevice(device);
            this.devicesService.newDevice(device);
            newDevices.push(device);
            //TODO: temporary, until we get the completion function to run
            this.events.publish('updateDevices');
          }
        }
      },
      // function to be called if an error occurs
      err => {
        alert('Error when scanning for devices: ' + err);
      },
      // function to be called when the scan is complete
      () => {
        alert('No more devices');
        // If we found any devices we should update the device list
        if (newDevices.length > 0) {
          this.events.publish('updateDevices');
        }
        console.log('\nNo more devices: ');
      });
  };

  /**
   * Connect to a device
	 * @param {Device} device - the target device
	 */
  connect = (device: Device): void => {
    //TODO: unsubscribe at some point ? 
    //alert('connecting to device: ' + device.name)
  	BLE.connect(device.id)
  		  .subscribe(
          res => {
    		  	// Setting information about the device
  	  		 	device.ledOn = false;
  	  		 	device.connected = true;
            device.buttonPressed = false;
  	        this.tilesApi.loadEventMappings(device.id);
            this.mqttClient.registerDevice(device);
            this.startDeviceNotification(device);
            if (device.name in tileNames){
              device.name = tileNames[device.name];
            }
        },
        err => {
          device.connected = false;
          this.disconnect(device);
          alert('Lost connection to ' + device.name)
        },
        () => {
          alert('Connection attempt completed')
        });
  };

  /**
   * Start getting notifications of events from a device
   * @param {Device} device - the id from the target device
   */
  startDeviceNotification = (device: Device): void => {
    //alert('Starting notifications from device: ' + device.name);
    //TODO: unsubscribe at some point. Could return the subscriber and unsubscribe after a timeout
    BLE.startNotification(device.id, this.rfduino.serviceUUID, this.rfduino.receiveCharacteristicUUID)
      .subscribe(
        res => {
          // Convert the bytes sent from the device into a string
          const responseString = ((String.fromCharCode.apply(null, new Uint8Array(res))).slice(0, -1)).trim();
          let message: CommandObject = this.tilesApi.getEventStringAsObject(responseString);
          //alert('Recieved event: ' + message.name + ' with properties: ' + message.properties);
          if (message === null) {
            alert('Found no mapping for event: ' + responseString);
          } else {
            // Switch on the event type of the message
            const eventType = message.properties[0];
            switch (eventType){
              case 'tap':
                device.buttonPressed = device.buttonPressed !== undefined
                                      ? !device.buttonPressed : true;
                alert('tappeti tap')
                break;
              case 'tilt':
                alert('You are tilting me!');
                break;
              default:
                alert('No response for ' + message.properties[0])
                break;
            }
            this.mqttClient.sendEvent(device.id, message);
          }
        },
        err => {
          console.log('Failed to start notification');
        },
        () => {
          console.log('Finished attempt to start getting notifications from device with id: ' + device.id);
        });
  };

  /**
   * Disconnect from device
	 * @param {Device} device - the target device
	 */
  disconnect = (device: Device): void => {
  	BLE.disconnect(device.id)
  					.then( res => {
  						device.connected = false;
  						this.mqttClient.unregisterDevice(device);
              this.devicesService.clearDisconnectedDevices();
  					})
  					.catch( err => {
              console.log('Failed to disconnect')
              device.connected = false;
            });
  };

  /**
   * Send data to a device using BLE
   * @param {Device} device - the target device
   * @param {string} dataString - the string of data to send to the device
   */
  sendData = (device: Device, dataString: string): void => {
    try {
      console.log('Attempting to send data to device via BLE.');

        // Turns the dataString into an array of bytes
        let dataArray = new Uint8Array(dataString.length);
        for(let i = 0; i < dataString.length; i ++){
          dataArray[i] = dataString.charCodeAt(i);
        }
      console.log('Bytes: ' + dataArray.length);

      // Attempting to send the array of bytes to the device
      BLE.writeWithoutResponse(device.id,
                               this.rfduino.serviceUUID,
                               this.rfduino.sendCharacteristicUUID,
                               dataArray.buffer)
              .then( res => alert('Success sending the string: ' + dataString))
              .catch( err => console.log('Failed when trying to send daata to the RFduino'));
    } finally {}
  };

  /**
   * Update the name of a device
   * @param {Device} device - the target device
   * @param {string} newName - The new name
   */
  updateName = (device: Device, newName: string): void => {
    this.devicesService.setCustomDeviceName(device, newName);
  };
};
