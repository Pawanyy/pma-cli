export interface PerformanceResourceEntry extends PerformanceResourceTiming {
    name: string;                      // The name of the resource (URL)
    entryType: 'resource';             // The type of performance entry
    startTime: number;                 // The time the resource started loading
    duration: number;                  // The duration it took to load the resource
    initiatorType: string;             // The type of initiator (script, img, etc.)
    nextHopProtocol: string;          // The protocol used for the resource
    transferSize: number;              // The total number of bytes transferred (including headers)
    encodedBodySize: number;           // The number of bytes in the body of the resource
    decodedBodySize: number;           // The number of bytes in the body after decompression
    responseEnd: number;               // The time when the response ended
    fetchStart: number;                // The time when the resource fetch started
    domainLookupStart: number;         // The time when the domain lookup started
    domainLookupEnd: number;           // The time when the domain lookup ended
    connectStart: number;              // The time when the connection started
    connectEnd: number;                // The time when the connection ended
    secureConnectionStart: number;     // The time when the connection was established securely
    requestStart: number;              // The time when the request was sent
    responseStart: number;             // The time when the response started
}

export interface AnalysisResults {
    performanceGrade: string;
    pageSize: number;
    loadTime: string;
    numberOfRequests: number;
    contentSizeByType: Record<string, number>;
    contentSizeByDomain: Record<string, number>;
    requestsByType: Record<string, number>;
    requestsByDomain: Record<string, number>;
    requestsByFile: Record<string, number>;
}