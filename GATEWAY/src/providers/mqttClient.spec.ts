import { inject, TestBed } from '@angular/core/testing';
import { Http, BaseRequestOptions } from '@angular/http';
import { MockBackend } from '@angular/http/testing';
import { BackgroundFetch } from '@ionic-native/background-fetch';
import { Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { TilesApi } from './tilesApi.service';
import { MqttClient } from './mqttClient';
import { LoginData } from './utils.service';
import { StorageMock } from '../mocks';

describe('mqttClient', () => {

  let mqttClient: MqttClient = null;
  let loginData: LoginData = new LoginData('TestUser', '172.68.99.218', 8080, false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TilesApi,
        MqttClient,
        Events,
        BackgroundFetch,
        {
          provide: Storage,
          useClass: StorageMock
        },
        MockBackend,
        BaseRequestOptions,
        {
          provide : Http,
          useFactory: (backendInstance: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backendInstance, defaultOptions);
          },
          deps: [MockBackend, BaseRequestOptions],
        },
      ],
    });
  });

  beforeEach(inject([MqttClient], (temp: MqttClient) => {
    mqttClient = temp;
    mqttClient.setConnectionData(loginData);
  }));

  afterEach(() => {
    mqttClient = null;
  });

  it('should create an instance of the MqttClient', () => {
    expect(mqttClient).toBeTruthy;
  });

  describe('sendConnectionData(mqttConnectionData: LoginData): void', () => {

  });

  describe('getDeviceSpecificTopic(deviceId: string, isEvent: boolean): string', () => {
    it('should return a correct url adress for the specific device', () => {
      let testID: string = 'testEvent';
      let testEventBool: boolean = true;
      expect(mqttClient.getDeviceSpecificTopic(testID, testEventBool)).toEqual('tiles/evt/TestUser/testEvent');
    });

    it('should return a correct url adress for the specific device when no event is passed as an argument', () => {
      let testID: string = 'testEvent';
      let testEventBool: boolean = false;
      expect(mqttClient.getDeviceSpecificTopic(testID, testEventBool)).toEqual('tiles/cmd/TestUser/testEvent');
    });
  });

  describe('connect(user: string, host: string, port: number): void', () => {
    /*it('should connect to the server and keep the connection alive afterwards until other commands are given', () => {
      let tUser: string = 'test1';
      let tHost: string = '127.0.0.0';
      let tPort: number = 8080;
      mqttClient.connect(tUser, tHost, tPort);
    });*/
  });

  describe('registerDevice(device: Device): void', () => {

  });

  describe('unregisterDevice(device: Device): void', () => {

  });

  describe('sendEvent(deviceId: string, event: CommandObject): void', () => {

  });

  describe('endConnection(deviceId: string, event: any): void', () => {

  });

  describe('startBackgroundFetch(): void', () => {

  });

  describe('stopBackgroundFetch(): void', () => {

  });

});
