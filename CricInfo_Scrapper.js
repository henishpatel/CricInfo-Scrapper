// The purpose of this project is to extract information of WorldCup 2019 from cricinfo and present that in the form of
// excel and pdf scorecards. But the real purpose is to learn how to extract information and get experience with JS

// ------Module Dependencies----------
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

// -------CMD to run---------
// node CricInfo_scrapper.js --excel=WorldCup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results 

let minimist = require('minimist');
let axios = require('axios');
let jsdom = require('jsdom');
let excel = require('excel4node');
let pdf = require('pdf-lib');
let path = require('path');
let fs = require('fs');

let args = minimist(process.argv);

//------THINGS TO ACHIEVE------
// 1.Dowload using axios
// 2.Read using Jsdom
// 3.convert matches to teams
// 3.Make excel using excel4node
// 4.Make pdf using pdf-lib

// Dowloaded using axios and Used Jsdom to read matches from html
let responseKaPromise = axios.get(args.source);
responseKaPromise.then(function (response) {
    let html = response.data;

    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;

    let matches = [];
    let matchScoreDivs = document.querySelectorAll("div.match-score-block");
    for (let i = 0; i < matchScoreDivs.length; i++){
        
        let match = {
            team1: "",
            team2: "",
            team1Score: "",
            team2Score: "",
            result: ""
        };

        let teamsNames = matchScoreDivs[i].querySelectorAll("p.name");
        match.team1 = teamsNames[0].textContent;
        match.team2 = teamsNames[1].textContent;

        let teamsScores = matchScoreDivs[i].querySelectorAll("div.score-detail > span.score");
        match.team1Score = ""; 
        match.team2Score = ""; 
        
        // check if both team has a score
        if (teamsScores.length == 2) {
            match.team1Score = teamsScores[0].textContent;
            match.team2Score = teamsScores[1].textContent;
        } else if (teamsScores.length == 1) {
            match.team1Score = teamsScores[0].textContent;
        }

        let matchresult = matchScoreDivs[i].querySelector("div.status-text > span");
        match.result = matchresult.textContent;

        matches.push(match);  
    }
    
    let matchesJSON = JSON.stringify(matches);
    fs.writeFileSync("matches.json", matchesJSON, "utf-8");

    let teams = [];
    for (let i = 0; i < matches.length; i++){
        putTeamInTeamsArrayIfMissing(teams, matches[i]);
    }
    for (let i = 0; i < matches.length; i++){
        putMatchInAppropriateTeams(teams, matches[i]);
    }

    let teamsJSON = JSON.stringify(teams);
    fs.writeFileSync("team.json", teamsJSON, "utf-8");

    createExcelFile(teams);
    createFolder(teams);

}).catch(function (err){
    console.log(err);
})

function createFolder(teams) {
    if (!fs.existsSync(args.dataFolder)) {
        fs.mkdirSync(args.dataFolder);
    }
    for (let i = 0; i < teams.length; i++){
        let teamsFN = path.join(args.dataFolder, teams[i].name);
        if (!fs.existsSync(teamsFN)) {
            fs.mkdirSync(teamsFN);
        }
        for (let j = 0; j < teams[i].matches.length; j++){
            let scorecardName = path.join(teamsFN, teams[i].matches[j].opponent + ".pdf");
            createPdfs(teams[i].name,teams[i].matches[j],scorecardName)
        }
    }
    
}

function createPdfs(teamName, match, scorecardName) {
    let team1 = teamName;
    let team2 = match.opponent;
    let selfScore = match.selfScore;
    let opponentScore = match.opponentScore;
    let result = match.result;

    let bytesOfTemplete = fs.readFileSync("Template.pdf");
    let pdfdocKaPromise = pdf.PDFDocument.load(bytesOfTemplete);
    pdfdocKaPromise.then(function (pdfdoc) {
        let page = pdfdoc.getPage(0);

        page.drawText(team1, {
            x: 320,
            y: 729,
            size: 8
        });
        page.drawText(team2, {
            x: 320,
            y: 715,
            size: 8
        });
        page.drawText(selfScore, {
            x: 320,
            y: 701,
            size: 8
        });
        page.drawText(opponentScore, {
            x: 320,
            y: 687,
            size: 8
        });
        page.drawText(result, {
            x: 320,
            y: 673,
            size: 8
        });

        let finalPDFBytesKaPromise = pdfdoc.save();
        finalPDFBytesKaPromise.then(function (finalPDFBytes) {
            fs.writeFileSync(scorecardName, finalPDFBytes);
        })
    })
}

function createExcelFile(teams) {
    let wb = new excel.Workbook();

    for (let i = 0; i < teams.length; i++) {
        let sheet = wb.addWorksheet(teams[i].name);

        sheet.cell(1, 1).string("Opponent");
        sheet.cell(1, 2).string(teams[i].name + "'s Score");
        sheet.cell(1, 3).string("Opponent Score");
        sheet.cell(1, 4).string("Result");

        for (let j = 0; j < teams[i].matches.length; j++) {
            sheet.cell(j + 2, 1).string(teams[i].matches[j].opponent);
            sheet.cell(j + 2, 2).string(teams[i].matches[j].selfScore);
            sheet.cell(j + 2, 3).string(teams[i].matches[j].opponentScore);
            sheet.cell(j + 2, 4).string(teams[i].matches[j].result);
        }
    }
    wb.write(args.excel);
}

function putTeamInTeamsArrayIfMissing(teams, match) {
    let team1idx = -1;
    for (let i = 0; i < teams.length; i++){
        if (teams[i].name == match.team1) {
            team1idx = i;
            break;
        }
    }
    
    if (team1idx == -1) {
        teams.push({
            name: match.team1,
            matches: []
        });
    }

    let team2idx = -1;
    for (let i = 0; i < teams.length; i++){
        if (teams[i].name == match.team2) {
            team2idx = i;
            break;
        }
    }
    
    if (team2idx == -1) {
        teams.push({
            name: match.team2,
            matches: []
        });
    }
}

function putMatchInAppropriateTeams(teams, match) {
    let team1idx = -1;
    for (let i = 0; i < teams.length; i++){
        if (teams[i].name == match.team1) {
            team1idx = i;
            break;
        }
    }

    let team1 = teams[team1idx];
    team1.matches.push({
        opponent: match.team2,
        selfScore: match.team1Score,
        opponentScore: match.team2Score,
        result: match.result
    });

    let team2idx = -1;
    for (let i = 0; i < teams.length; i++){
        if (teams[i].name == match.team2) {
            team2idx = i;
            break;
        }
    }

    let team2 = teams[team2idx];
    team2.matches.push({
        opponent: match.team1,
        selfScore: match.team2Score,
        opponentScore: match.team1Score,
        result: match.result
    });
}