const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

async function applyForLinkedInJobs(linkedinCookie, chatId) {
  let driver;
  try {
    const service = new chrome.ServiceBuilder('path/to/chromedriver').build();
    service.start();
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeService(service)
      .build();

    activeDrivers[chatId] = driver;

    console.log('Navigating to LinkedIn...');
    await driver.get('https://www.linkedin.com');
    await driver.manage().addCookie({ name: 'li_at', value: linkedinCookie });
    await driver.navigate().refresh();
    
    // Check if the cookie was set correctly
    const cookies = await driver.manage().getCookies();
    console.log('Current cookies:', cookies);
    
    console.log('Navigating to job search page...');
    await driver.get('https://www.linkedin.com/jobs/search/');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Replace setTimeout with a promise

    console.log('Getting job listings...');
    let allListings = await driver.findElements(By.css('a.job-card-container__link'));

    for (let listing of allListings) {
      try {
        console.log('Clicking on listing...');
        await listing.click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Replace setTimeout with a promise

        let applyButton = await driver.findElement(By.css('button.jobs-apply-button'));
        if (applyButton && await applyButton.getText().includes('Easy Apply')) {
          console.log('Applying for the job...');
          await applyButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Replace setTimeout with a promise
          await handleLinkedInApplicationForm(driver);
        }
      } catch (err) {
        console.error('Error during job application process:', err);
        continue;
      }
    }
  } catch (error) {
    console.error('Error in applyForLinkedInJobs:', error);
    bot.sendMessage(chatId, 'An error occurred during the job application process. Check the console for details.');
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}
