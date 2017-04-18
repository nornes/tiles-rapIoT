import { Component } from '@angular/core';
import { Events, Platform } from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';
import { TabsPage } from '../pages/tabs/tabs';


import { BleService } from '../providers/ble.service';
import { DevicesService } from '../providers/devices.service';
import { CommandObject, Device, UtilsService } from '../providers/utils.service';


@Component({
  templateUrl: 'app.html',
  providers: [
    DevicesService,
    BleService,
    UtilsService,
  ],
})
export class Tiles {
  rootPage = TabsPage;
  devices: Device[];

  constructor(private events: Events,
              platform: Platform,
              private bleService: BleService,
              private devicesService: DevicesService,
              private utils: UtilsService, ) {

    platform.ready().then(() => {
      StatusBar.styleDefault();
      Splashscreen.hide();
    });

    this.events.subscribe('serverConnected', () => {
      this.bleService.startBLEScanner();
    });

    this.events.subscribe('offline', () => {
      this.bleService.stopBLEScanner();
    });

    this.events.subscribe('command', (deviceId: string, command: CommandObject) => {
      for (let device of this.devices) {
        if (device.tileId === deviceId) {
          const commandString = this.utils.getCommandObjectAsString(command);
          this.bleService.sendData(device, commandString);
        }
      }
    });

    this.events.subscribe('updateDevices', () => {
      this.devices = this.devicesService.getDevices();
    });
  }
}
