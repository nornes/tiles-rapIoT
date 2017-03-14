import { TabsPage } from './tabs';
import { Tiles } from '../../app/app.component';
import { TestBed, ComponentFixture, async } from '@angular/core/testing';
import { IonicModule, NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';

let comp: TabsPage;
let fixture: ComponentFixture<TabsPage>;
 
describe('TabsPage', () => {
 
    beforeEach(async(() => {
        TestBed.configureTestingModule({
 
            declarations: [
                Tiles,
                TabsPage
            ],
             
            providers: [
                
            ],
            imports: [
                IonicModule.forRoot(Tiles)
            ]
 
        }).compileComponents();
    }));
 
    beforeEach(() => {
 
        fixture = TestBed.createComponent(TabsPage);
        comp    = fixture.componentInstance;
    });
 
    afterEach(() => {
        fixture.destroy();
        comp = null;
    });
 
    it('is created', () => {
 
        expect(fixture).toBeTruthy();
        expect(comp).toBeTruthy();
 
    });
});