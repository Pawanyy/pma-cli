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
import { isValidUrl, isValidFilePath, getValidFilePath } from './utils.js';

export async function runCLI() {
  console.log(gradient.pastel.multiline(figlet.textSync('PMA CLI')));

  const program = new Command();
  program
    .name('pma')
    .version('1.0.2', '-v')
    .description('A CLI tool for analyzing web pages')
    .option('-u, --url <url>', 'URL of the web page to analyze')
    .option('-f, --file <filePath>', 'File Path of the HTML to analyze')
    .option('-d, --debug', 'output the process in debug mode')
    .parse(process.argv);

  const options = program.opts();

  let url: string | undefined;
  let filePath: string | undefined;
  const debug: boolean = options.debug || false;

  if (!options.url && !options.file) {
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
          message: 'Enter the HTML filePath to analyze:',
          validate: (input) => input.trim() !== '',
        },
      ]);
      filePath = htmlAnswer.html;
    }
  } else {
    url = options.url;
    filePath = options.file;
  }

  const spinner = createSpinner('Analyzing...').start();

  try {

    if (url && !isValidUrl(url)) {
      throw new Error('Invalid URL');
    }

    if (filePath && !isValidFilePath(filePath)) {
      throw new Error('Invalid HTML file path');
    }

    let absoluteHtmlPath: string | null = null;
    if (filePath) {
      absoluteHtmlPath = getValidFilePath(filePath);
    }

    const browser = await launchBrowser(debug);
    const page = await createPage(browser, url, absoluteHtmlPath);
    const results = await analyzeWebPage(page);
    await browser.close();

    spinner.success({ text: 'Analysis complete!' });

    displayResults(results);
  } catch (error: any) {
    spinner.error({ text: 'Analysis failed!' });
    console.error(chalk.red('Error:'), error.message);
    process.exit(1);
  }
}
function displayResults(results: AnalysisResults) {
  console.log(chalk.bold.cyan('\nAnalysis Results:'));

  const logTextAsTable = (rows: (string | number)[][], totalRow: (string | number)[] = []) => {
    const maxLabelLength = Math.max(...rows.map(row => String(row[0]).length));
    const maxValueLength = Math.max(...rows.map(row => String(row[1]).length));
    const padding = 1;

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

process.on('SIGINT', () => {
  console.log(chalk.red('\nProcess terminated. Cleaning up...'));
  process.exit(0);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('\nUnhandled Rejection at:', reason));
  process.exit(1);
});