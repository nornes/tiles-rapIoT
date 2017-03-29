import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Events } from 'ionic-angular';

import { Device } from './utils.service';

@Injectable()
export class DevicesService {
  private devices: Device[];

  constructor(public storage: Storage,
              public events: Events) {
    this.devices = [];
  }

  /**
   * Returns the list of devices currently stored
   */
  getDevices = (): Device[] => {
    return this.devices;
  }

  /**
   * Converts the device discovered by ble into a device on the tiles format
   * @param {any} bleDevice - the returned device from the ble scan
   */
  convertBleDeviceToDevice = (bleDevice: any): Promise<Device>  => {
    let temp = new Device;
    return this.storage.get(bleDevice.name).then( name => {
        temp.id = bleDevice.id;
        temp.tileId = bleDevice.name;
        temp.name = (name !== null && name !== undefined) ? name : bleDevice.name;
        temp.connected = false;
        temp.ledOn = false;
        temp.buttonPressed = false;
        return temp;
    }).catch(err => {
        temp.id = bleDevice.id;
        temp.tileId = bleDevice.name;
        temp.name = bleDevice.name;
        temp.connected = false;
        temp.ledOn = false;
        temp.buttonPressed = false;
        return temp;
    });
  }

  /**
   * Adds a new device to the list of devices
   * @param {Device} device - the device to add
   */
  newDevice = (device: Device) => {
    if (this.isNewDevice(device)) {
      this.devices.push(device);
    }
  }

  /**
   * Check if a device already exists among the stored ones
   * @param {any} device - The device to check
   */
  isNewDevice = (device: any): boolean => {
    return !this.devices.map(storedDevice => storedDevice.tileId).includes(device.tileId);
  }

  /**
   * Sets a custom name for the device
   * @param {Device} device - a tile device
   * @param {string} name - the new name for the device
   */
  setCustomDeviceName = (device: Device, name: string): void => {
    this.storage.set(device.tileId, name);
    for (let d of this.devices) {
      if (d.tileId === device.tileId) {
        d.name = name;
      }
    }
    this.events.publish('updateDevices');
  }

  /**
   * Sets the device name to the ble name
   * @param {Device} device - a tile device
   */
  resetDeviceName = (device: Device): void => {
    this.setCustomDeviceName(device, device.tileId);
  }

  /**
   * Go through the list of registered devices and keep only those connected
   */
  clearDisconnectedDevices = (): void => {
    for (let i = 0; i < this.devices.length; i++) {
      const device = this.devices[i];
      if (device.connected === false) {
        this.devices.splice(i, 1);
      }
    }
  }
}
