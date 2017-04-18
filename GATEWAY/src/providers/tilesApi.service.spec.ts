import { inject, TestBed } from '@angular/core/testing';
import { Http, Response, ResponseOptions, BaseRequestOptions, RequestMethod } from '@angular/http';
import { Storage } from '@ionic/storage';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { Device, LoginData } from './utils.service';
import { TilesApi } from './tilesApi.service';
import { StorageMock } from '../mocks';

import * as mockTilesApplicationDetailsResponse from '../fixtures/applicationDetails.json';
import * as mockTilesApplicationsResponse from '../fixtures/applications.json';

describe('tilesAPI', () => {

  let tilesApi: TilesApi = null;
  let loginData: LoginData = new LoginData('Test', '172.68.99.218', 8080, false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockBackend,
        BaseRequestOptions,
        {
          provide : Http,
          useFactory: (backendInstance: MockBackend, defaultOptions: BaseRequestOptions) => {
            return new Http(backendInstance, defaultOptions);
          },
          deps: [MockBackend, BaseRequestOptions],
        },
        {
          provide: Storage,
          useClass: StorageMock
        },
        TilesApi,
      ],
    });
  });

  beforeEach(inject([TilesApi], (temp: TilesApi) => {
    tilesApi = temp;
    tilesApi.setLoginData(loginData);
  }));

  afterEach(() => {
    tilesApi = null;
  });

  it('should create an instance of the TilesApi', () => {
    expect(tilesApi).toBeTruthy;
  });

  describe('isTilesDevice(device: any): boolean', () => {
    it('should return true when given a valid device-input', () => {
      const testDevice = new Device('xx', 'xx', 'TileTest', false);
      expect(tilesApi.isTilesDevice(testDevice)).toBeTruthy;
    });

    it('should return false when given a invalid device-input', () => {
      const testDevice2 = new Device('xx', 'xx', 'NotATile', false);
      expect(tilesApi.isTilesDevice(testDevice2)).toBeFalsy;
    });
  });

  describe('setLoginData(loginData: LoginData): void', () => {

  });

  describe('getLoginData(): void', () => {

  });

  describe('setVirtualTiles(appId: string): void', () => {

  });

  describe('getAllApplications(): Promise<any>', () => {
    it('should return all available applications registered for all users',
      inject([MockBackend], mockBackend => {

      const mockResponse = mockTilesApplicationsResponse;

      mockBackend.connections.subscribe((connection) => {
        connection.mockRespond(new Response(new ResponseOptions({
          body: JSON.stringify(mockResponse)
        })));
      });

      tilesApi.getAllApplications().then(applications => {
        expect(applications.length).toEqual(3);
        expect(applications[2]._id).toEqual('asd');
      });
    }));
  });

  describe('getApplicationDetails(applicationId: string): Promise<any>', () => {
    it('should return an application named "test3"',
        inject([MockBackend], (mockBackend) => {

        const mockResponse = mockTilesApplicationDetailsResponse;

        mockBackend.connections.subscribe((connection) => {
          connection.mockRespond(new Response(new ResponseOptions({
            body: JSON.stringify(mockResponse)
          })));
        });

        tilesApi.getApplicationDetails('test3').then(application => {
          expect(application._id).toEqual('test3');
        });

    }));
  });

  describe('getApplicationTiles(applicationId: string): Promise<any>', () => {
    it('should return a list of three virtualTiles',
        inject([MockBackend], (mockBackend) => {

        const mockResponse = mockTilesApplicationDetailsResponse;

        mockBackend.connections.subscribe((connection) => {
          connection.mockRespond(new Response(new ResponseOptions({
            body: JSON.stringify(mockResponse)
          })));
        });

        tilesApi.getApplicationTiles('test3').then(tiles => {
          expect(tiles.length).toEqual(2);
        });

    }));
  });

  describe('pairDeviceToVirtualTile(deviceId: string, virtualTileId: string, applicationId: string): void', () => {
    it('should pair a device to a virtual tile and return status code 201', inject([MockBackend], (mockBackend) => {

      mockBackend.connections.subscribe((connection: MockConnection) => {
        // is it the correct REST type for an insert? (POST)
        expect(connection.request.method).toBe(RequestMethod.Post);

        connection.mockRespond(new Response(new ResponseOptions({status: 201})));
      });

      tilesApi.pairDeviceToVirualTile('test', '58c120c5497df8602fedfbd3', 'test3').then(
        (successResult) => {
          expect(successResult).toBeDefined();
          expect(successResult.status).toBe(201);
        });
    }));
  });
});
