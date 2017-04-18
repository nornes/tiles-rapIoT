
import { Injectable } from '@angular/core';
import { Events } from 'ionic-angular';
import { BLE } from '@ionic-native/ble';
import { Observable, Subscription } from 'rxjs';
import 'rxjs/add/operator/toPromise';

import { DevicesService }from './devices.service';
import { MqttClient } from './mqttClient';
import { TilesApi  } from './tilesApi.service';
import { CommandObject, Device, UtilsService } from './utils.service';


@Injectable()
export class BleService {
  bleScanner: Subscription;
  rfduino = {
    serviceUUID: '2220',
    receiveCharacteristicUUID: '2221',
    sendCharacteristicUUID: '2222',
    disconnectCharacteristicUUID: '2223',
  };

  constructor(private events: Events,
              private ble: BLE,
              private devicesService: DevicesService,
              private mqttClient: MqttClient,
              private tilesApi: TilesApi,
              private utils: UtilsService) {}

  /**
   * Start the BLE scanner making it scan every 30s
   */
  startBLEScanner = (): void => {
    this.scanForDevices();
    this.bleScanner = Observable.interval(10000).subscribe(res => {
      this.scanForDevices();
    });
  }

  /**
   * Stop the BLE scanner
   */
  stopBLEScanner = (): void => {
    if (this.bleScanner !== undefined) {
      this.bleScanner.unsubscribe();
    }
  }

  /**
   * Checking if bluetooth is enabled and enable on android if not
   */
  scanForDevices = (): void => {
    this.devicesService.clearDisconnectedDevices();
    this.ble.isEnabled()
            .then( res => {
              this.scanBLE();
            })
            .catch( err => {
              // alert('Bluetooth not enabled!');
              // NB! Android only!! IOS users has to turn bluetooth on manually
              this.ble.enable()
                 .then( res => {
                    this.scanBLE();
                  })
                 .catch( err => {
                    // alert('Failed to enable bluetooth, try doing it manually');
                  });
            });
  }

  /**
   * Checking to see if any bluetooth devices are in reach
   */
  scanBLE = (): void => {
    // A list of the discovered devices
    const virtualTiles = this.tilesApi.getVirtualTiles();
    this.ble.scan([], 30).toArray().subscribe(
      // function to be called for each new device discovered
      bleDevices => {
        let devices = new Array();
        for (let i = 0; i < bleDevices.length; i++) {
          if (this.tilesApi.isTilesDevice(bleDevices[i])) {
            this.devicesService.convertBleDeviceToDevice(bleDevices[i]).then( device => {
              if (virtualTiles.filter(tile => tile.tile != null)
                              .map(tile => tile.tile.name)
                              .includes(device.tileId)) {
                this.connect(device);
              }
              devices.push(device);
              if (i === bleDevices.length - 1) {
                this.devicesService.setDevices(devices);
              }
            }).catch(err => {
              alert(err);
            });
          }
        }
      },
      err => {
        alert('Error when scanning for devices: ' + err);
      },
      () => {
        console.log('done scanning');
      });
  }

  /**
   * Connect to a device
   * @param {Device} device - the target device
   */
  connect = (device: Device): void => {
    this.ble.connect(device.id)
        .subscribe(
          res => {
            console.log('connecting to : ' + device.name);
            // Setting information about the device
            device.connected = true;
            this.startDeviceNotification(device);
            this.mqttClient.registerDevice(device);
          },
          err => {
            device.connected = false;
            this.devicesService.clearDisconnectedDevices();
            this.events.publish('updateDevices');
            this.disconnect(device);
          },
          () => {});
  }

  /**
   * Connect and rename a device
   * @param {Device} device - the target device
   */
  locate = (device: Device): void => {
    this.ble.connect(device.id)
        .subscribe(
          res => {
            this.sendData(device, 'led,on,red');
            setTimeout(() => {
              this.sendData(device, 'led,off');
              if (!device.connected) {
                this.disconnect(device);
              }
            }, 3000);
          },
          err => {
            console.log(err);
          },
          () => {});
  }

  /**
   * Start getting notifications of events from a device
   * @param {Device} device - the id from the target device
   */
  startDeviceNotification = (device: Device): void => {
    this.ble.startNotification(device.id, this.rfduino.serviceUUID, this.rfduino.receiveCharacteristicUUID)
      .subscribe(
        res => {
          const responseString = ((String.fromCharCode.apply(null, new Uint8Array(res))).slice(0, -1)).trim();
          const message: CommandObject = this.utils.getEventStringAsObject(responseString);
          if (message === null) {
            console.log('Couldnt make an object from event: ' + responseString);
          } else {
            this.mqttClient.sendEvent(device.tileId, message);
            this.events.publish('recievedEvent', device.tileId, message);
          }
        },
        err => {
          console.log('Failed to start notification');
        },
        () => { // called when the device disconnects
          device.connected = false;
          this.mqttClient.unregisterDevice(device);
        });
  }

  /**
   * Disconnect from device
   * @param {Device} device - the target device
   */
  disconnect = (device: Device): void => {
    this.ble.disconnect(device.id)
            .then( res => {
              device.connected = false;
              this.mqttClient.unregisterDevice(device);
              console.log('diconnected from device: ' + device.name);
            })
            .catch( err => {
              console.log('Failed to disconnect');
            });
  }

  /**
   * Send data to a device using BLE
   * @param {Device} device - the target device
   * @param {string} dataString - the string of data to send to the device
   */
  sendData = (device: Device, dataString: string): void => {
    try {
      const dataArray = this.utils.convertStringtoBytes(dataString);
      // Attempting to send the array of bytes to the device
      this.ble.writeWithoutResponse(device.id,
                               this.rfduino.serviceUUID,
                               this.rfduino.sendCharacteristicUUID,
                               dataArray.buffer)
              .then( res => console.log('Success sending the string: ' + dataString))
              .catch( err => alert('Failed when trying to send data to the device!'));
    } catch (err) {
      alert('Failed when trying to send data to the device!');
    }
  }
}
