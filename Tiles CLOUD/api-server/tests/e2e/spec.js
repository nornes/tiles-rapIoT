describe('Tiles IDE', function() {
    var EC = protractor.ExpectedConditions;

    var username = 'TestUser'; // User must exist in DB
    var appName = 'MyTestApp';
    var groupName = 'MyGroup';

    // Elements
    var loginUsernameInput = element(by.model('username'));
    var signInBtn = element(by.buttonText('Sign In'))
    var openCreateAppModalBtn = element(by.css('.sidemenu-btn[data-target="#createAppModal"]'));
    var newAppRecipeNameInput = element(by.model('newAppRecipe.name'));
    var newAppRecipeGroupInput = element(by.model('newAppRecipe.group'));
    var createNewAppRecipeBtn = element(by.css('[ng-click="createAppRecipe()"]'));
    var createAppModal = element(by.id('createAppModal'));
    var sidemenuAppRecipeList = element.all(by.repeater('appRecipe in appRecipes'));
    var openDeleteAppModalBtn = element(by.css('[ng-click="showConfirmDeleteAppModal()"]'));
    var deleteAppBtn = element(by.css('[ng-click="deleteAppRecipe(msb.selectedAppRecipe)"]'));
    var deleteAppModal = element(by.id('confirmAppDeleteModal'));
    var selectedAppGroupInput = element(by.model('msb.selectedAppRecipe.group'));

    var createNewApp = function(group) {
        // Open 'Create app' modal
        openCreateAppModalBtn.click();
        
        // Fill form and submit
        browser.wait(EC.visibilityOf(createAppModal), 5000);
        newAppRecipeNameInput.sendKeys(appName);
        if (group) newAppRecipeGroupInput.sendKeys(groupName);
        createNewAppRecipeBtn.click();

        browser.wait(EC.invisibilityOf(createAppModal), 5000);
    }

    var selectNewestApp = function() {
        // Select created app from sidemenu
        var sidemenuItem = sidemenuAppRecipeList.last();
        sidemenuItem.click();
    }

    var deleteCurrentlySelectedApp = function () { 
        // Open 'Delete app' modal
        browser.wait(EC.elementToBeClickable(openDeleteAppModalBtn), 5000);
        openDeleteAppModalBtn.click();

        // Confirm app deletion
        browser.wait(EC.visibilityOf(deleteAppModal), 5000);
        deleteAppBtn.click();
    }

    beforeEach(function() {
        // Login
        browser.get('http://localhost:3000/apps/#/login');
        loginUsernameInput.sendKeys(username);
        signInBtn.click();

        // Disable fade effect for modals
        browser.waitForAngular();
        browser.executeScript("$('#createAppModal').removeClass('fade');");
        browser.executeScript("$('#confirmAppDeleteModal').removeClass('fade');");
    });

    it('should create new app and delete', function() {
        createNewApp();
        selectNewestApp();
        deleteCurrentlySelectedApp();
    });

    it('should create app with specified group', function() {
        createNewApp(true);
        selectNewestApp();

        // Expect displayed group input to equal group name specified on creation
        browser.wait(EC.visibilityOf(selectedAppGroupInput), 5000);
        selectedAppGroupInput.getAttribute('value').then(function(value) {
            expect(value).toEqual(groupName);
        });

        deleteCurrentlySelectedApp();
    });
});
