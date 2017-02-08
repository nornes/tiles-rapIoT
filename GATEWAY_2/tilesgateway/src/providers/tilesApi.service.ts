import { Injectable } from '@angular/core';
import { Http }    from '@angular/http';
import { Storage } from '@ionic/storage';
import 'rxjs/add/operator/toPromise';

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

  eventMappings = {};


  // TODO: Move these back into the constructor. This caused a runtime-error saying 
  // 'No provider for String!'. It seems the angular2 @Inject() will solve it 
  username: string = 'TestUser';
  hostAddress: string = 'cloud.tilestoolkit.io'; 
  mqttPort: number = 8080;

	constructor(//public username: string = 'TestUser', 
							//public hostAddress: string = 'cloud.tilestoolkit.io', 
							//public mqttPort: number = 8080,
							public storage: Storage,
							private http: Http) { 
	};
	
	// Returns an object with name and properties from the inputstring
  getEventStringAsObject = (eventString: string) => {
    const params = eventString.split(',');
    return {
      name: params[0],
      properties: Array.prototype.slice.call(params, 1)
    };
  };

  // Turn the eventobject into a string
  // TODO: create a type class for the commandObject to ensure correct data is passed 
  getCommandObjectAsString = cmdObj => {
    return cmdObj.name + ',' + cmdObj.properties.toString();
  };

  // Create a new object that has all the attributes from both inputobjects
  extend = (obj1, obj2) => {
    let extended = {};
    // TODO: if any attr has the same name obj 2 will overwrite obj1
    for (let attrname of obj1) { 
      extended[attrname] = obj1[attrname]; 
    };
    for (let attrname of obj2) { 
      extended[attrname] = obj2[attrname]; 
    };
    return extended;
  }


  setUsername = (username: string) => {
    this.username = username;
  };

  setHostAddress = (hostAddress: string) => {
    this.hostAddress = hostAddress;
  };

  setHostMqttPort = (hostMqttPort) => {
    this.mqttPort = hostMqttPort;
  };

  getEventMapping = (tileId, eventAsString) => {
    if (this.eventMappings[this.username] == null || 
        this.eventMappings[this.username][tileId] == null) {
      this.loadEventMappings(tileId);
    }
    return this.eventMappings[this.username][tileId][eventAsString];
  };

  loadEventMappings = (tileId) => {
  	// TODO: get the mappings from the actual stored ones. 
    const storedEventMappings = this.storage.get(`eventMappings_${this.username}_${tileId}`)
                                            .then( res => res);
    if (this.eventMappings[this.username] == null) {
      this.eventMappings[this.username] = {};
    };
    this.eventMappings[this.username][tileId] = this.extend(this.defaultEventMappings, storedEventMappings);
  };


  fetchEventMappings = (tileId, successCb) => {
   const eventMappingsUrl = `http://${this.hostAddress}:${this.mqttPort}/eventmappings/${this.username}/${tileId}`;
    return this.http.get(eventMappingsUrl)
					     .toPromise()
					   	 .then((res) => {
						      const fetchedEventMappings = JSON.stringify(res.json().data);
						      console.log(`Success. Fetched data:${{fetchedEventMappings}}`);
						      this.storage.set(`eventMappings_${this.username}_${tileId}`, fetchedEventMappings);
						      if (this.eventMappings[this.username] == null) {
						      	this.eventMappings[this.username] = {};
						      };

						      this.eventMappings[this.username][tileId] = this.extend(this.defaultEventMappings, res.json().data);

						      if (successCb) {
                    successCb(res.json().data);
                  };
						   })
						   .catch((err) => (console.error('Error', JSON.stringify(err))));
  };
};