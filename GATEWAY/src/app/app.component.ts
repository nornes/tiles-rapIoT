import { Component } from '@angular/core';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Events, Platform } from 'ionic-angular';
import { Splashscreen, StatusBar } from 'ionic-native';

import { TabsPage } from '../pages/tabs/tabs';
import { BleService } from '../providers/ble.service';
import { DevicesService } from '../providers/devices.service';
import { CommandObject, UtilsService } from '../providers/utils.service';


@Component({
  providers: [
    BleService,
    DevicesService,
    UtilsService,
  ],
  templateUrl: 'app.html',
})
export class Tiles {
  private rootPage = TabsPage; // tslint:disable-line

  constructor(private backgroundMode: BackgroundMode,
              private events: Events,
              private platform: Platform,
              private bleService: BleService,
              private devicesService: DevicesService,
              private utils: UtilsService ) {

    this.backgroundMode.enable();

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
      const devices = this.devicesService.getDevices();
      for (let device of devices) {
        if (device.tileId === deviceId) {
          const commandString = this.utils.getCommandObjectAsString(command);
          this.bleService.sendData(device, commandString);
        }
      }
    });
  }
}
