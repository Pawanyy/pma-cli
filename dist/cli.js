import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import { analyzeWebPage } from './analyzer.js';
import { launchBrowser, createPage } from './browser.js';
export async function runCLI() {
    console.log(gradient.pastel.multiline(figlet.textSync('Web Analyzer')));
    const program = new Command();
    program
        .version('1.0.0')
        .description('A CLI tool for analyzing web pages')
        .option('-u, --url <url>', 'URL of the web page to analyze')
        .option('-h, --html <html>', 'HTML content to analyze')
        .parse(process.argv);
    const options = program.opts();
    let url;
    let html;
    if (!options.url && !options.html) {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'inputType',
                message: 'What do you want to analyze?',
                choices: ['URL', 'HTML'],
            },
        ]);
        if (answer.inputType === 'URL') {
            const urlAnswer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'url',
                    message: 'Enter the URL to analyze:',
                    validate: (input) => input.trim() !== '',
                },
            ]);
            url = urlAnswer.url;
        }
        else {
            const htmlAnswer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'html',
                    message: 'Enter the HTML content to analyze:',
                    validate: (input) => input.trim() !== '',
                },
            ]);
            html = htmlAnswer.html;
        }
    }
    else {
        url = options.url;
        html = options.html;
    }
    const spinner = createSpinner('Analyzing...').start();
    try {
        const browser = await launchBrowser();
        const page = await createPage(browser, url, html);
        const results = await analyzeWebPage(page);
        await browser.close();
        spinner.success({ text: 'Analysis complete!' });
        displayResults(results);
    }
    catch (error) {
        spinner.error({ text: 'Analysis failed!' });
        console.error(chalk.red('Error:'), error);
    }
}
function displayResults(results) {
    console.log(chalk.cyan('\nAnalysis Results:'));
    console.log(chalk.yellow('Performance Grade:'), results.performanceGrade);
    console.log(chalk.yellow('Page Size:'), results.pageSize);
    console.log(chalk.yellow('Load Time:'), results.loadTime);
    console.log(chalk.yellow('Number of Requests:'), results.numberOfRequests);
    console.log(chalk.cyan('\nContent Size by Content Type:'));
    Object.entries(results.contentSizeByType).forEach(([type, size]) => {
        console.log(chalk.yellow(`${type}:`), size);
    });
    console.log(chalk.cyan('\nContent Size by Domain:'));
    Object.entries(results.contentSizeByDomain).forEach(([domain, size]) => {
        console.log(chalk.yellow(`${domain}:`), size);
    });
    console.log(chalk.cyan('\nRequests by Content Type:'));
    Object.entries(results.requestsByType).forEach(([type, count]) => {
        console.log(chalk.yellow(`${type}:`), count);
    });
    console.log(chalk.cyan('\nRequests by Domain:'));
    Object.entries(results.requestsByDomain).forEach(([domain, count]) => {
        console.log(chalk.yellow(`${domain}:`), count);
    });
}
