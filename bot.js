const TelegramBot = require('node-telegram-bot-api');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { ServiceBuilder } = require('selenium-webdriver/chrome');
const { setTimeout } = require('timers/promises');

// Define the path to your ChromeDriver
const service = new chrome.ServiceBuilder('E:\\Telegram_Bot\\telegram-job-bot\\chromedriver-win64\\chromedriver.exe').build();
async function startService() {
  await service.start(); // Start the ChromeDriver service
}
startService().catch(err => {
  console.error('Error starting the ChromeDriver service:', err);
});


// Initialize the Telegram bot with your bot token
const token = '7580274947:AAG62x-ePo9K1O_bTyunV6szRVWNdWezN_I'; // Set your bot token directly
console.log("Token loaded:", token);  // Use environment variable
if (!token) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set in the .env file.");
  process.exit(1); // Exit the process if the token is not loaded
}
const bot = new TelegramBot(token, { polling: { interval: 1000 } });

console.log('Bot started successfully');

// Store user data
const userCookies = {};
const userPlatforms = {};
const activeDrivers = {};

const PLATFORM_KEYBOARD = [
  ['LinkedIn', 'Internshala']
];

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Please choose the platform you want to submit cookies for:', {
    reply_markup: {
      keyboard: PLATFORM_KEYBOARD,
      one_time_keyboard: true
    }
  });
});

// Handle user's platform choice
bot.on('message', (msg) => {
  console.log('Received message:', msg.text);
  const chatId = msg.chat.id;

  // Ignore messages from the bot itself
  if (msg.from.is_bot) return; 

  const platform = msg.text.toLowerCase();

  if (['linkedin', 'internshala'].includes(platform)) {
    userPlatforms[chatId] = platform;
    bot.sendMessage(chatId, `Platform '${platform}' chosen. Now, please send your cookie.`);
  } else if (userPlatforms[chatId]) {
    const cookie = msg.text.trim();
    if (!cookie || cookie.length < 10) { // Validate cookie length
      return bot.sendMessage(chatId, 'Invalid cookie. Please provide a valid cookie.');
    }
    userCookies[chatId] = { platform: userPlatforms[chatId], cookie_value: cookie };
    bot.sendMessage(chatId, `Cookie for ${userPlatforms[chatId]} received! You can now use /apply to start the application process or /stop to stop it.`);
  }
});


// Handle /apply command
bot.onText(/\/apply/, async (msg) => {
  const chatId = msg.chat.id;

  // Check if the user has provided a platform and cookie data
  if (!userCookies[chatId] || !userCookies[chatId].platform || !userCookies[chatId].cookie_value) {
    return bot.sendMessage(chatId, 'Please submit your cookie and platform first by typing /start.');
  }

  const platform = userCookies[chatId].platform;
  const cookieValue = userCookies[chatId].cookie_value;

  try {
    console.log('Starting the application process for:', platform);
    await bot.sendMessage(chatId, `Starting the application process for ${platform}...`); // Only send one message at the start

    if (platform === 'linkedin') {
      await applyForLinkedInJobs(cookieValue, chatId);
      await bot.sendMessage(chatId, 'LinkedIn application process completed successfully.');
    } else if (platform === 'internshala') {
      await applyForInternshalaJobs(cookieValue, chatId);
      await bot.sendMessage(chatId, 'Internshala application process completed successfully.');
    }
  } catch (error) {
    console.error(`Error during ${platform} application:`, error);
    await bot.sendMessage(chatId, `An error occurred during the ${platform} job application process. Please try again later.`);
  }
});

// Handle /stop command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (activeDrivers[chatId]) {
    activeDrivers[chatId].quit();
    delete activeDrivers[chatId];
  }
  delete userCookies[chatId];
  delete userPlatforms[chatId];
  bot.sendMessage(chatId, 'Process stopped. You can start again using /start.');
});


async function applyForLinkedInJobs(linkedinCookie, chatId) {
  let driver;

  try {
    // Validate the LinkedIn cookie
    if (!isValidCookie(linkedinCookie)) {
      console.log("Invalid cookie. Please provide a valid cookie.");
      bot.sendMessage(chatId, 'Invalid cookie. Please provide a valid cookie.');
      return; // Stop further execution
    }

    await service.start();
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeService(service)
      .build();

    activeDrivers[chatId] = driver;

    console.log('Navigating to LinkedIn...');
    bot.sendMessage(chatId, 'Navigating to LinkedIn...');

    await driver.get('https://www.linkedin.com');
    await driver.manage().addCookie({ name: 'li_at', value: linkedinCookie });
    await driver.navigate().refresh();

    const cookies = await driver.manage().getCookies();
    console.log('Current cookies:', cookies);

    console.log('Navigating to job search page...');
    await driver.get('https://www.linkedin.com/jobs/search/');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for the job search page to load

    console.log('Getting job listings...');
    let allListings = await driver.findElements(By.css('a.job-card-container__link'));

    for (let listing of allListings) {
      try {
        console.log('Clicking on job listing...');
        await listing.click();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the job details to load

        let applyButton = await driver.findElement(By.css('button.jobs-apply-button'));
        if (applyButton && await applyButton.getText().includes('Easy Apply')) {
          console.log('Applying for the job...');
          await applyButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the application form to load

          await handleLinkedInApplicationForm(driver);
          bot.sendMessage(chatId, 'Successfully applied for a job.');
        } else {
          console.log('No Easy Apply button found for this job listing.');
          bot.sendMessage(chatId, 'No Easy Apply option available for this job.');
        }
      } catch (err) {
        console.error('Error during job application process:', err);
        bot.sendMessage(chatId, `Error during job application: ${err.message}`);
        continue; // Continue to the next job listing even if an error occurs
      }
    }
  } catch (error) {
    console.error('Error in applyForLinkedInJobs:', error);
    bot.sendMessage(chatId, 'An error occurred during the LinkedIn job application process. Please try again later.');
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

// Function to validate the cookie
function isValidCookie(cookie) {
  // Implement your cookie validation logic here
  // For example, you could check if it's not empty and follows the expected pattern
  return cookie && typeof cookie === 'string' && cookie.length > 0;
}

// Function to handle the LinkedIn application form
async function handleLinkedInApplicationForm(driver) {
  try {
    console.log('Filling LinkedIn job application form...');

    // Wait for the Easy Apply form to appear
    await driver.wait(until.elementLocated(By.css('form')), 5000);

    // Fill in the text input fields
    let nameInput = await driver.findElement(By.css('input[name="name"]'));
    if (nameInput) {
      await nameInput.clear();
      await nameInput.sendKeys('Sneha Singh');
    }

    let emailInput = await driver.findElement(By.css('input[name="email"]'));
    if (emailInput) {
      await emailInput.clear();
      await emailInput.sendKeys('snehasinghaug09@gmail.com.com');
    }

    let phoneInput = await driver.findElement(By.css('input[name="phone"]'));
    if (phoneInput) {
      await phoneInput.clear();
      await phoneInput.sendKeys('9528966514');
    }

    // Handle dropdowns or radio buttons (if any)
    let radioButton = await driver.findElement(By.css('input[type="radio"]'));
    if (radioButton) {
      await radioButton.click();
    }

    // Handle checkboxes (if any)
    let checkbox = await driver.findElement(By.css('input[type="checkbox"]'));
    if (checkbox && !await checkbox.isSelected()) {
      await checkbox.click();
    }

    // Upload a resume if the option exists
    let resumeUpload = await driver.findElement(By.css('input[type="file"]'));
    if (resumeUpload) {
      await resumeUpload.sendKeys("C:\\Users\\Sneha\\Desktop\\SNEHA SINGH_RESUME.pdf");
    }

    // Click the 'Submit' button to apply
    let submitButton = await driver.findElement(By.css('button[type="submit"]'));
    if (submitButton) {
      await submitButton.click();
      console.log('Application submitted.');
    } else {
      console.log('No submit button found.');
    }

    await setTimeout(2000); // Give time for submission to process
  } catch (error) {
    console.error('Error in filling the LinkedIn form:', error);
  }
}

// Function to apply for Internshala jobs
async function applyForInternshalaJobs(internshalaCookie, chatId) {
  let driver;
  try {
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeService(service)
      .build();

    activeDrivers[chatId] = driver;

    console.log('Navigating to Internshala...');
    await driver.get('https://internshala.com/');
    await driver.manage().addCookie({ name: 'PHPSESSID', value: internshalaCookie });
    await driver.navigate().refresh();

    await driver.get('https://internshala.com/jobs/work-from-home/');
    await setTimeout(3000);

    let allListings = await driver.findElements(By.className('internship-heading-container'));
    for (let listing of allListings) {
      try {
        console.log('Clicking on listing...');
        await listing.click();
        await setTimeout(2000);

        let applyButton = await driver.findElement(By.id('continue_button'));
        await applyButton.click();
        await setTimeout(2000);
      } catch (err) {
        console.error('Error during Internshala application process:', err);
        bot.sendMessage(chatId, `Error applying for Internshala listing: ${err.message}`);
        continue; // Continue to the next listing even if there is an error
      }
    }
  } catch (error) {
    console.error('Error in applyForInternshalaJobs:', error);
    bot.sendMessage(chatId, 'An error occurred during the Internshala job application process. Please try again later.');
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}
