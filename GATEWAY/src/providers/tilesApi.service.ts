import { Injectable } from '@angular/core';
import { Http }    from '@angular/http';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/toPromise';

import { Device } from './devices.service';

/** 
 * Class to describe the structure of a command 
 */
class CommandObject {
  name: string;
  properties: string;
}

@Injectable()
export class TilesApi {

  // Make this a global?
  defaultEventMappings = {
    btnON: {
      type: 'button_event',
      event: 'pressed'
    },
    btnOFF: {
      type: 'button_event',
      event: 'released'
    }
  };

  // {username: {tile: mappingsForTile}}
  eventMappings = {};

  // TODO: Move these back into the constructor. This caused a runtime-error saying
  // 'No provider for String!'. It seems the angular2 @Inject() will solve it
  username: string = 'TestUser';
  hostAddress: string = '138.68.144.206';
  mqttPort: number = 8080;

	constructor(//public username: string = 'TestUser',
							//public hostAddress: string = 'cloud.tilestoolkit.io',
							//public mqttPort: number = 8080,
							public storage: Storage,
							private http: Http) {
	};

  /** 
   * Returns an object with name and properties from the inputstring
   * @param {string} eventString - A string on the format eventName,properties...
   */
  getEventStringAsObject = (eventString: string) => {
    const params = eventString.split(',');
    if (params.length > 1){
      return {
          name: params[0],
          properties: Array.prototype.slice.call(params, 1)
      };
    }
    return null;
  };

  /** 
   * Returns a string from the given commandObject
   * @param {CommansObject} cmdObj - the command to turn into a string
   */
  getCommandObjectAsString = (cmdObj: CommandObject) => {
    return cmdObj.name + ',' + cmdObj.properties.toString();
  };

  /** 
   * Create a new object that has all the attributes from both inputobjects
   * @param {any} obj1 - The first object
   * @param {any} obj2 - The second object
   */
  extend = (obj1: any, obj2: any) => {
    // TODO: Find out if the objects passed in are of a specific type
    let extended = {};
    // TODO: if any attr has the same name obj 2 will overwrite obj1
    // could be fixed by checking if the attrname exists and then renaming it
    for (let attrname of obj1) {
      extended[attrname] = obj1[attrname];
    }
    for (let attrname of obj2) {
      extended[attrname] = obj2[attrname];
    }
    return extended;
  };

  /** 
   * Tests if a device is a tile
   * @param {Device} device - the device to test
   */
  isTilesDevice = (device: Device) => (device.name != null && device.name.substring(0, 4) === 'Tile');

  /** 
   * Set a username for the tile owner/user
   * @param {string} username - The new username
   */
  setUsername = (username: string) => {
    this.username = username;
  };

  /** 
   * Set the host address
   * @param {string} hostAddress - The url/ip address of the host
   */
  setHostAddress = (hostAddress: string) => {
    this.hostAddress = hostAddress;
  };

  /** 
   * Set the port for connecting to the server
   * @param {number} hostMqttPort - the port number 
   */
  setHostMqttPort = (hostMqttPort: number) => {
    this.mqttPort = hostMqttPort;
  };

  /**
   * Set the eventmapprings for a tile
   * @param {string} tileID - The target tile
   * @param {any} - eventmappings to store for the tile
   */
  setEventMappings = (tileId: string, eventMappings: any) => {
    // TODO: Set an interface for the eventMappings 
    this.storage.set(this.username + '_' + tileId, eventMappings);
  };

  /** 
   * TODO: I cannot see this (or the loadEventMappings working as the eventmappings are objects, not arrays
   * and does not even have any of the fields asked for. 
   * All the functions below needs to be rewritten. 
   */
  getEventMapping = (tileId, eventAsString) => {
    // TODO: Temporary mock code
    return this.eventMappings;
    /*
    if (this.eventMappings[this.username] == null ||
        this.eventMappings[this.username][tileId] == null) {
      this.loadEventMappings(tileId);
    }
    return this.eventMappings[this.username][tileId][eventAsString];*/
  };

  loadEventMappings = (tileId) => {
    return this.eventMappings;/*
    const storedEventMappings = this.storage.get(`eventMappings_${this.username}_${tileId}`)
                                            .then( res => res);
    if (this.eventMappings[this.username] == null) {
      this.eventMappings[this.username] = {};
    }
    this.eventMappings[this.username][tileId] = this.extend(this.defaultEventMappings, storedEventMappings);*/
  };

  /**
   * Fetch the event mappings for the given tile from the web-server
   * @param {string} tileId - The ID of the tile
   */
  fetchEventMappings = (tileId: string) => {
    const url = `http://${this.hostAddress}:${this.mqttPort}/eventmappings/${this.username}/${tileId}`;
    return this.http.get(url)
            .toPromise()
            .then(res => {
              const fetchedEventMappings = res.data;
              console.log('Success. Fetched data:' + JSON.stringify(fetchedEventMappings));
              this.setEventMappings(tileId, fetchedEventMappings);
              // Do we need to check for username? Isn't the user always the same? 
              this.eventMappings[this.username] = {} ? 
                    this.eventMappings[this.username] == null : this.eventMappings[this.username] 
              this.eventMappings[this.username][tileId] = this.extend(this.defaultEventMappings, fetchedEventMappings);
            })
            .catch(err => console.log(err));
    /*
    const eventMappingsUrl = `http://${this.hostAddress}:${this.mqttPort}/eventmappings/${this.username}/${tileId}`;
    return this.http.get(eventMappingsUrl)
					     .toPromise()
					   	 .then((res) => {
						      const fetchedEventMappings = JSON.stringify(res.json().data);
						      console.log(`Success. Fetched data:${{fetchedEventMappings}}`);
						      this.storage.set(`eventMappings_${this.username}_${tileId}`, fetchedEventMappings);
						      if (this.eventMappings[this.username] == null) {
						      	this.eventMappings[this.username] = {};
                  }
                 this.eventMappings[this.username][tileId] = this.extend(this.defaultEventMappings, res.json().data);

						      if (successCb) {
                    successCb(res.json().data);
                  }
               })
						   .catch((err) => (console.error('Error', JSON.stringify(err))));*/
  };
}