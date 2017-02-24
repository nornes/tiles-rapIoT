import { Component } from '@angular/core';
import { AlertController, Events, NavController, Platform } from 'ionic-angular';
import { BleService } from '../../providers/ble.service';
import { Device, DevicesService } from '../../providers/devices.service';
import { MqttClient } from '../../providers/mqttClient';
import { TilesApi, CommandObject } from '../../providers/tilesApi.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [
    TilesApi,
    MqttClient,
    DevicesService,
    BleService
  ]
})

export class HomePage {
  public devices: Device[];
  serverConnectStatusMsg: string;
  statusMsg: string;

  constructor(public navCtrl: NavController,
              public events: Events,
              public platform: Platform,
              private bleService: BleService,
              private devicesService: DevicesService,
              public tilesApi: TilesApi,
              private mqttClient: MqttClient,
              private alertCtrl: AlertController)
  {

  	this.setDevices();
  	this.serverConnectStatusMsg = 'Click to connect to server';


  	// Subscriptions to events that can be emitted from other places in the code

    this.events.subscribe('serverConnected', () => {
      this.serverConnectStatusMsg = 'Connected to server';
      this.scanForNewBLEDevices();
    });

    this.events.subscribe('offline', () => {
      this.mqttClient.setServerConnectionStatus(false);
      this.serverConnectStatusMsg = 'Client gone offline';
    });

    this.events.subscribe('close', () => {
      this.mqttClient.setServerConnectionStatus(false);
      this.serverConnectStatusMsg = 'Disconnected from server';
    });

    this.events.subscribe('reconnect', () => {
      this.mqttClient.setServerConnectionStatus(false);
      this.serverConnectStatusMsg = 'A reconnect is started';
    });

    this.events.subscribe('error', (err) => {
      this.mqttClient.setServerConnectionStatus(false);
      this.serverConnectStatusMsg = 'Error: ${err}';
    });

  	//TODO: Dunno if these should be in the constructor or if that was a mistake
	  this.events.subscribe('command', (deviceId: string, command: CommandObject) => {
	    for (let device of this.devices) {
	      if (device.id === deviceId) {
	      	//alert('Recieved command from server: ' + JSON.stringify(command));
	        device.ledOn = (command.name === 'led' && command.properties[0] === 'on');
	        console.log('Device led on: ' + device.ledOn);
	        const commandString = this.tilesApi.getCommandObjectAsString(command);
	        this.bleService.sendData(device, commandString);

        }
      }
    });
  };

  /**
   * Set the devices equal to the devices from devicesservice
   */
  setDevices = () => {
    this.devices = this.devicesService.getDevices();
  }

  /**
   * Use ble to discover new devices
   */
  scanForNewBLEDevices = () => {
    this.statusMsg = 'Searching for devices...';
    this.devicesService.clearDisconnectedDevices();
    this.bleService.scanForDevices();
    this.setDevices();
  };

  /**
   * Connect to the mqttServer
   */
  connectToServer = () => {
    this.mqttClient.connect(this.tilesApi.hostAddress, this.tilesApi.mqttPort);
  };

	fetchEventMappings = (device: Device) => {
		this.tilesApi.fetchEventMappings(device.id);
	};

  /**
   * Called when the refresher is triggered by pulling down on the view of 
	 * the devices. 
	 */
	refreshDevices = (refresher) => {
		console.log('Scanning for more devices...');
		this.scanForNewBLEDevices();
		//Makes the refresher run for 2 secs
		setTimeout(() => {
			refresher.complete();
		}, 2000);
	};


  /**
   * Called when the rename button is pushed on the view of the the
   * the devices.
   * @param {Device} device - the target device
   * @param {bleService} ble - the bleService provider containing the updateName function
   */
  changeNamePop = (device, ble) => {
    let alert = this.alertCtrl.create({
      title: 'Change tile name',
      inputs: [
        {
          name: 'newName',
          placeholder: 'new name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Rename',
          handler: data => {
            ble.updateName(device, data.newName);
          }
        }
      ]
    });
    alert.present();
  };
};
