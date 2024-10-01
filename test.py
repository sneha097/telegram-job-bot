import logging
import time
import random
from telegram import Update, ReplyKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, ConversationHandler
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from selenium.webdriver.common.keys import Keys
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

user_cookies = {}
user_platforms = {}
active_drivers = {}

executor = ThreadPoolExecutor(max_workers=4)

CHOOSING_PLATFORM, RECEIVING_COOKIE = range(2)

PLATFORM_KEYBOARD = [['LinkedIn', 'Internshala']]

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    reply_markup = ReplyKeyboardMarkup(PLATFORM_KEYBOARD, one_time_keyboard=True)
    await update.message.reply_text(
        "Welcome! Please choose the platform you want to submit cookies for:",
        reply_markup=reply_markup
    )
    return CHOOSING_PLATFORM

async def choose_platform(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    platform = update.message.text.lower()

    if platform in ['linkedin', 'internshala']:
        user_platforms[chat_id] = platform
        await update.message.reply_text(f"Platform '{platform}' chosen. Now, please send your cookie.")
        return RECEIVING_COOKIE
    else:
        await update.message.reply_text("Invalid platform. Please choose either LinkedIn or Internshala.")
        return CHOOSING_PLATFORM

async def receive_cookies(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    cookie_value = update.message.text.strip()

    platform = user_platforms.get(chat_id)
    if platform:
        user_cookies[chat_id] = {
            'platform': platform,
            'cookie_value': cookie_value
        }
        await update.message.reply_text(f"Cookie for {platform} received! You can now use /apply to start the application process or /stop to stop the application process.")
        return ConversationHandler.END
    else:
        await update.message.reply_text("Please choose a platform first using /start.")
        return RECEIVING_COOKIE

async def apply(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    user_data = user_cookies.get(chat_id)

    if not user_data:
        await update.message.reply_text("Please send your cookie first using /start.")
        return

    platform = user_data['platform']
    cookie_value = user_data['cookie_value']

    if platform == 'linkedin':
        executor.submit(apply_for_linkedin_jobs, cookie_value, chat_id)
        await update.message.reply_text("LinkedIn application process ongoing.")

    elif platform == 'internshala':
        executor.submit(apply_for_internshala_jobs, cookie_value, chat_id)
        await update.message.reply_text("Internshala application process ongoing.")

    else:
        await update.message.reply_text("Unknown platform.")

async def stop(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat_id
    if chat_id in active_drivers:
        active_drivers[chat_id].quit()
        del active_drivers[chat_id]
    if chat_id in user_cookies:
        del user_cookies[chat_id]
    if chat_id in user_platforms:
        del user_platforms[chat_id]
    await update.message.reply_text("Process stopped. You can start again using /start.")

def click_until_input_fields_or_submit(driver, chat_id):
    while True:
        if chat_id not in user_cookies:
            break
        try:
            continue_button = driver.find_element(By.CSS_SELECTOR, "button.artdeco-button--primary")
            continue_button.click()
            time.sleep(2)
            try:
                questions = driver.find_elements(By.CLASS_NAME, "artdeco-text-input--input")
                if questions:
                    for question in questions:
                        if question.get_attribute('value') == '':
                            question.send_keys(random.randint(1, 99))
                        else:
                            question.clear()
                            question.send_keys(random.choice(['yes', 'no']))
            except NoSuchElementException:
                pass
            try:
                checkbox_3_years = driver.find_elements(By.TAG_NAME, 'label')
                for checkbox in checkbox_3_years:
                    if "Upload resume" not in checkbox.text:
                        if checkbox.text:
                            checkbox.click()
            except:
                pass
            try:
                select_elements = driver.find_elements(By.TAG_NAME, 'select')
                for select in select_elements:
                    dropdown = Select(select)
                    options = dropdown.options
                    valid_options = [option for option in options if option.text != "Select an option"]
                    if valid_options:
                        chosen_option = random.choice(valid_options)
                        dropdown.select_by_visible_text(chosen_option.text)
            except:
                pass
        except NoSuchElementException:
            break

def apply_for_linkedin_jobs(linkedin_cookie, chat_id):
    PHONE = '654930195'
    options = Options()
    options.add_argument("--disable-web-security")
    options.add_argument("--user-data-dir=/tmp/user-data")
    options.add_argument("--allow-running-insecure-content")
    options.headless = False
    service = Service(executable_path="/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    active_drivers[chat_id] = driver
    try:
        driver.get("https://www.linkedin.com")
        driver.add_cookie({"name": "li_at", "value": linkedin_cookie})
        driver.refresh()

        driver.get("https://www.linkedin.com/jobs/search/")
        time.sleep(3)

        while True:
            element = driver.find_element(By.CLASS_NAME, "global-footer-compact")
            driver.execute_script("arguments[0].scrollIntoView();", element)
            all_listings = driver.find_elements(By.CSS_SELECTOR, "a.job-card-container__link")
            if not all_listings:
                break
            for listing in all_listings:
                try:
                    listing.click()
                    time.sleep(2)
                    apply_button = driver.find_element(By.CSS_SELECTOR, "button.jobs-apply-button")
                    if 'Easy Apply' in apply_button.text:
                        apply_button.click()
                        time.sleep(2)
                        try:
                            phone_input = driver.find_element(By.CLASS_NAME, "artdeco-text-input--input")
                            if not phone_input.get_attribute('value'):
                                phone_input.send_keys(PHONE)
                        except NoSuchElementException:
                            pass
                        click_until_input_fields_or_submit(driver, chat_id)
                        submit_button = driver.find_element(By.CSS_SELECTOR, "button.artdeco-button--primary")
                        submit_button.click()
                        time.sleep(5)
                        close_button = driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Dismiss"]')
                        close_button.click()
                except Exception as e:
                    continue
    finally:
        driver.quit()

def apply_for_internshala_jobs(internshala_cookie, chat_id):
    options = Options()
    options.add_argument("--disable-web-security")
    options.add_argument("--user-data-dir=/tmp/user-data")
    options.add_argument("--allow-running-insecure-content")
    options.headless = False
    service = Service(executable_path="/usr/bin/chromedriver")
    driver = webdriver.Chrome(service=service, options=options)
    active_drivers[chat_id] = driver

    try:
        driver.get("https://internshala.com/")
        driver.add_cookie({"name": "PHPSESSID", "value": internshala_cookie})
        driver.refresh()

        driver.get("https://internshala.com/jobs/work-from-home/")
        time.sleep(3)

        while True:
            all_listings = driver.find_elements(By.CLASS_NAME, "internship-heading-container")
            if not all_listings:
                break
            time.sleep(2)
            for listing in all_listings:
                time.sleep(2)
                listing.click()
                time.sleep(2)
                try:
                    apply_button = driver.find_element(By.ID, "continue_button")
                    apply_button.click()
                    time.sleep(2)
                except:
                    wait = WebDriverWait(driver, 10)
                    wait.until(EC.presence_of_element_located((By.ID, "continue_button")))
                    apply_button = driver.find_element(By.ID, "continue_button")
                    apply_button.click()
                    time.sleep(2)

                try:
                    question_button = driver.find_elements(By.CLASS_NAME, "question-heading")
                    store = ""
                    for q in question_button:
                        store += q.text
                    if 'Assessment' in store:
                        wait = WebDriverWait(driver, 10)
                        exit = wait.until(EC.element_to_be_clickable((By.XPATH, '//*[@id="easy_apply_modal_close"]')))
                        exit.click()
                        time.sleep
