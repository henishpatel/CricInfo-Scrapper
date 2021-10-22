# CricInfo-Scrapper
A web scrapper application which has ability to scrap any tournament fixtures and keep those matches in excel and folders.
# Tech-Stack Used
 - JavaScript
 - Libraries used
    - Minimist -> Used to take command line argument
    - Axios -> For making hhtp request and get html response
    - JSDOM -> To make DOM tree just like browser make
    - Excel4Node -> Used to make excel file
    - PDF_LIB -> Used to make pdf

# Features And Functions
Dowloading data in the form of HTML by making a http request using axios as we are not using any browser so axios will help to achieve this.
Reading HTML and extracting important and useful information using Jsdom.
Converting matches to teams using Array Manipulation.
Making of excel file and adding important stuff in that excel using excel4node library.
Making pdf and making changes to Template pdf using pdf-lib library.
 
## To Run this project on Local machine
First fork this to your profile, then clone it to your desktop
   
Then install libraries 
```bash
npm install minimist
npm install axios
npm install pdf-lib
npm install excel4node
npm install jsdom  
```
To run this project use this command

```bash
node CricInfo_scrapper.js --excel=WorldCup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results 
```
