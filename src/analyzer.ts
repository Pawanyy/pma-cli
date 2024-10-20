import { Page } from 'puppeteer';
import { AnalysisResults } from './types';

export async function analyzeWebPage(page: Page): Promise<AnalysisResults> {
  const performanceMetrics = await page.metrics();
  const resources = await page.evaluate(() => {
    return (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).map((entry) => (
      {
        name: entry.name,
        type: entry.initiatorType,
        size: entry.transferSize,
        duration: entry.duration,
      }));
  });

  const totalSize = resources.reduce((acc, resource) => acc + resource.size, 0);
  const totalLoadTime = performanceMetrics.TaskDuration || 0;
  const numberOfRequests = resources.length;

  const contentSizeByType: Record<string, number> = {};
  const contentSizeByDomain: Record<string, number> = {};
  const requestsByType: Record<string, number> = {};
  const requestsByDomain: Record<string, number> = {};
  const requestsByFile: Record<string, number> = {};

  resources.forEach((resource) => {
    const domain = new URL(resource.name).hostname;

    requestsByFile[resource.name] = resource.size;
    contentSizeByType[resource.type] = (contentSizeByType[resource.type] || 0) + resource.size;
    contentSizeByDomain[domain] = (contentSizeByDomain[domain] || 0) + resource.size;
    requestsByType[resource.type] = (requestsByType[resource.type] || 0) + 1;
    requestsByDomain[domain] = (requestsByDomain[domain] || 0) + 1;
  });

  const performanceGrade = calculatePerformanceGrade(totalLoadTime, totalSize, numberOfRequests);

  return {
    performanceGrade,
    pageSize: totalSize,
    loadTime: `${totalLoadTime.toFixed(2)}ms`,
    numberOfRequests,
    contentSizeByType: Object.fromEntries(
      Object.entries(contentSizeByType).map(([type, size]) => [type, size])
    ),
    contentSizeByDomain: Object.fromEntries(
      Object.entries(contentSizeByDomain).map(([domain, size]) => [domain, size])
    ),
    requestsByType,
    requestsByDomain,
    requestsByFile
  };
}

function calculatePerformanceGrade(loadTime: number, pageSize: number, requestCount: number): string {
  const loadTimeScore = Math.max(0, 100 - loadTime / 100);
  const pageSizeScore = Math.max(0, 100 - pageSize / 1000000);
  const requestCountScore = Math.max(0, 100 - requestCount / 2);

  const overallScore = (loadTimeScore + pageSizeScore + requestCountScore) / 3;

  if (overallScore >= 90) return 'A';
  if (overallScore >= 80) return 'B';
  if (overallScore >= 70) return 'C';
  if (overallScore >= 60) return 'D';
  return 'F';
}