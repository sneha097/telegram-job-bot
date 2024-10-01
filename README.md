# Telegram Job Application Bot(Persist_Jobs)

This is a Telegram bot that automates the job application process on LinkedIn and Internshala. Users can submit their cookies for authentication and the bot will handle the application process for them.

## Features

- **User Interaction**: Users can interact with the bot to select the platform (LinkedIn or Internshala) and provide their cookies for application.
- **Job Applications**: The bot automates the application process for job listings on both platforms using Selenium WebDriver.
- **Error Handling**: The bot provides feedback to users in case of errors or issues during the application process.

## Prerequisites

- Node.js (v12 or later)
- npm (Node package manager)
- ChromeDriver
- A Telegram bot token (create a bot using [BotFather](https://core.telegram.org/bots#botfather))

## Installation Steps
Follow these steps to set up the bot:

1. **Clone the Repository**:
   - Use the following command to clone the repository:
     
     git clone https://github.com/sneha097/telegram-job-bot.git
     
2. **Navigate into the Directory**:
   - Change into the project directory:
     
     cd telegram-job-bot
     

3. **Install Required Dependencies**:
   - Run the following command to install the necessary packages:
  
     npm install
    

4. **Update ChromeDriver Path**:
   - Open the code file and update the path to your `chromedriver.exe`:
    
     const service = new chrome.ServiceBuilder('path_to_your_chromedriver.exe').build();
     

5. **Configure Bot Token**:
   - Replace the placeholder with your actual Telegram bot token:
     ```javascript
     const token = '7580274947:AAG62x-ePo9K1O_bTyunV6szRVWNdWezN_I';
   

## Usage

1. **Start the Bot**: Type `/start` to initiate the conversation.
   
2. **Select Platform**: Choose between LinkedIn or Internshala.
   
3. **Submit Cookie**: Provide your session cookie for the selected platform.
   
4. **Apply for Jobs**: Use the `/apply` command to start the application process.
   
5. **Stop Process**: Use the `/stop` command to terminate any ongoing job application processes.

## Logging

Logs are generated during the bot's execution, providing insights into the application's flow and errors. Monitor the console output for debugging and operational status.

## Contributing

Contributions are welcome! If you find any bugs or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements

- [node-telegram-bot-api](https://www.npmjs.com/package/node-telegram-bot-api) for the Telegram Bot API.
- [Selenium WebDriver](https://www.selenium.dev/documentation/webdriver/) for automating web applications.
  
 ## Conclusion

This bot streamlines the job application process on LinkedIn and Internshala, making it easier for users to apply for positions without manual input. For any issues or feature requests, please check the codebase or open an issue in the repository.
