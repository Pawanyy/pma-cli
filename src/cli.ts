import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import inquirer from 'inquirer';
import { createSpinner } from 'nanospinner';
import { analyzeWebPage } from './analyzer.js';
import { launchBrowser, createPage } from './browser.js';
import { formatBytes } from './utils.js';
import { AnalysisResults } from './types.js';

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

  let url: string | undefined;
  let html: string | undefined;

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
    } else {
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
  } else {
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
  } catch (error) {
    spinner.error({ text: 'Analysis failed!' });
    console.error(chalk.red('Error:'), error);
    process.exit(1);
  }
}
function displayResults(results: AnalysisResults) {
  console.log(chalk.bold.cyan('\nAnalysis Results:'));

  const logTextAsTable = (rows: (string | number)[][], totalRow: (string | number)[] = []) => {
    const maxLabelLength = Math.max(...rows.map(row => String(row[0]).length));
    const maxValueLength = Math.max(...rows.map(row => String(row[1]).length));
    const padding = 1; // Additional padding for space after the colon

    rows.forEach(([label, value]) => {
      const labelStr = String(label).padEnd(maxLabelLength + padding, ' ');
      const valStr = String(value).padStart(maxValueLength + padding);
      console.log(chalk.yellow(`${labelStr}:`), valStr);
    });

    if (totalRow.length > 0) {
      const totalLabelStr = String(totalRow[0]).padEnd(maxLabelLength + padding, ' ');
      const totalValStr = String(totalRow[1]).padStart(maxValueLength + padding);
      console.log(chalk.bold.white(`${totalLabelStr}:`), totalValStr);
    }
  };

  // Performance Summary
  logTextAsTable([
    ["Performance grade", results.performanceGrade],
    ["Page size", formatBytes(results.pageSize)],
    ["Load time", results.loadTime],
    ["Requests", results.numberOfRequests]
  ]);

  // Reusable logSummary function with dynamic alignment
  const logSummary = (title: string, data: { [key: string]: number }, formatValue: (v: number) => string | number = v => v) => {
    const rows = Object.entries(data).map(([key, value]) => [key, formatValue(value)]);
    const total = Object.entries(data).reduce((acc, [, value]) => acc + Number(value), 0); // Assuming value is numeric
    console.log(chalk.bold.cyan(`\n${title}:`));
    logTextAsTable(rows, ["Total", formatValue(total)]);
  };

  logSummary('Content Size by Content Type', results.contentSizeByType, formatBytes);
  logSummary('Content Size by Domain', results.contentSizeByDomain, formatBytes);
  logSummary('Requests by Content Type', results.requestsByType);
  logSummary('Requests by Domain', results.requestsByDomain);
  logSummary('Requests by File', results.requestsByFile, formatBytes);
}