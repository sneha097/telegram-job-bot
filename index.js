const TelegramBot = require('node-telegram-bot-api');
const puppeteer = require('puppeteer');

// Your Telegram bot token here
const BOT_TOKEN = '7580274947:AAG62x-ePo9K1O_bTyunV6szRVWNdWezN_I';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const userCookies = {};
const userPlatforms = {};
const activeBrowsers = {};

// Command: /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      keyboard: [['LinkedIn', 'Internshala']],
      one_time_keyboard: true
    }
  };
  bot.sendMessage(chatId, 'Welcome! Please choose the platform:', options);
});

// Handle platform selection
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const platform = msg.text.toLowerCase();

  if (platform === 'linkedin' || platform === 'internshala') {
    userPlatforms[chatId] = platform;
    bot.sendMessage(chatId, `Platform '${platform}' chosen. Now, please send your cookie.`);
  }
});

// Handle cookie reception
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (!userPlatforms[chatId]) return;

  const cookieValue = msg.text.trim();
  userCookies[chatId] = {
    platform: userPlatforms[chatId],
    cookieValue
  };

  bot.sendMessage(chatId, `Cookie for ${userPlatforms[chatId]} received! Use /apply to start applying.`);
});

// Command: /apply
bot.onText(/\/apply/, async (msg) => {
  const chatId = msg.chat.id;
  const userData = userCookies[chatId];

  if (!userData) {
    bot.sendMessage(chatId, 'Please submit your cookie first.');
    return;
  }

  const platform = userData.platform;
  const cookieValue = userData.cookieValue;

  if (platform === 'linkedin') {
    applyForLinkedInJobs(cookieValue, chatId);
    bot.sendMessage(chatId, 'LinkedIn application process started.');
  } else if (platform === 'internshala') {
    applyForInternshalaJobs(cookieValue, chatId);
    bot.sendMessage(chatId, 'Internshala application process started.');
  }
});

// Command: /stop
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (activeBrowsers[chatId]) {
    activeBrowsers[chatId].close();
    delete activeBrowsers[chatId];
  }
  delete userCookies[chatId];
  delete userPlatforms[chatId];
  bot.sendMessage(chatId, 'Process stopped. Use /start to begin again.');
});

// Function to apply for LinkedIn jobs
async function applyForLinkedInJobs(cookie, chatId) {
  const browser = await puppeteer.launch({ headless: false });
  activeBrowsers[chatId] = browser;
  const page = await browser.newPage();

  try {
    await page.setCookie({ name: 'li_at', value: cookie, domain: '.linkedin.com' });
    await page.goto('https://www.linkedin.com/jobs/');
    await page.waitForSelector('.job-card-container__link', { timeout: 10000 });

    const listings = await page.$$('.job-card-container__link');
    for (let listing of listings) {
      try {
        await listing.click();
        await page.waitForTimeout(2000);
        const applyButton = await page.$('button.jobs-apply-button');
        if (applyButton) {
          await applyButton.click();
          await page.waitForTimeout(2000);
          // Additional logic to fill the form and submit the application
        }
      } catch (error) {
        console.error('Error during application:', error);
      }
    }
  } finally {
    await browser.close();
  }
}

// Function to apply for Internshala jobs
async function applyForInternshalaJobs(cookie, chatId) {
  const browser = await puppeteer.launch({ headless: false });
  activeBrowsers[chatId] = browser;
  const page = await browser.newPage();

  try {
    await page.setCookie({ name: 'PHPSESSID', value: cookie, domain: '.internshala.com' });
    await page.goto('https://internshala.com/jobs/');
    await page.waitForSelector('.internship-heading-container', { timeout: 10000 });

    const listings = await page.$$('.internship-heading-container');
    for (let listing of listings) {
      try {
        await listing.click();
        await page.waitForTimeout(2000);
        const applyButton = await page.$('#continue_button');
        if (applyButton) {
          await applyButton.click();
          await page.waitForTimeout(2000);
          // Additional logic to fill the form and submit the application
        }
      } catch (error) {
        console.error('Error during application:', error);
      }
    }
  } finally {
    await browser.close();
  }
}
