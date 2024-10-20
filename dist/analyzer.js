export async function analyzeWebPage(page) {
    const performanceMetrics = await page.metrics();
    const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map((entry) => ({
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize,
            duration: entry.duration,
        }));
    });
    const totalSize = resources.reduce((acc, resource) => acc + resource.size, 0);
    const totalLoadTime = performanceMetrics.TaskDuration;
    const numberOfRequests = resources.length;
    const contentSizeByType = {};
    const contentSizeByDomain = {};
    const requestsByType = {};
    const requestsByDomain = {};
    resources.forEach((resource) => {
        const domain = new URL(resource.name).hostname;
        contentSizeByType[resource.type] = (contentSizeByType[resource.type] || 0) + resource.size;
        contentSizeByDomain[domain] = (contentSizeByDomain[domain] || 0) + resource.size;
        requestsByType[resource.type] = (requestsByType[resource.type] || 0) + 1;
        requestsByDomain[domain] = (requestsByDomain[domain] || 0) + 1;
    });
    const performanceGrade = calculatePerformanceGrade(totalLoadTime, totalSize, numberOfRequests);
    return {
        performanceGrade,
        pageSize: formatBytes(totalSize),
        loadTime: `${totalLoadTime.toFixed(2)}ms`,
        numberOfRequests,
        contentSizeByType: Object.fromEntries(Object.entries(contentSizeByType).map(([type, size]) => [type, formatBytes(size)])),
        contentSizeByDomain: Object.fromEntries(Object.entries(contentSizeByDomain).map(([domain, size]) => [domain, formatBytes(size)])),
        requestsByType,
        requestsByDomain,
    };
}
function calculatePerformanceGrade(loadTime, pageSize, requestCount) {
    const loadTimeScore = Math.max(0, 100 - loadTime / 100);
    const pageSizeScore = Math.max(0, 100 - pageSize / 1000000);
    const requestCountScore = Math.max(0, 100 - requestCount / 2);
    const overallScore = (loadTimeScore + pageSizeScore + requestCountScore) / 3;
    if (overallScore >= 90)
        return 'A';
    if (overallScore >= 80)
        return 'B';
    if (overallScore >= 70)
        return 'C';
    if (overallScore >= 60)
        return 'D';
    return 'F';
}
function formatBytes(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
