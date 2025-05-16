export async function getCrawlResults(crawlId: string): Promise<PageData[]> {
  let formattedData: PageData[] = []; // Initialize to empty array
  try {
    const result = await app.checkCrawlStatus(crawlId);
    console.log(`[firecrawl-client.ts] app.checkCrawlStatus RAW response in getCrawlResults for job ${crawlId}:`, JSON.stringify(result, null, 2));

    if (!result.success) {
      console.error('[firecrawl-client.ts] getCrawlResults (via checkCrawlStatus) API call reported not success:', result.error);
      // return []; // Keep as before, will return initialized empty formattedData
    } else {
      const firecrawlResponseData = result.data; // This is the object that has { status: 'completed', data: [...] }
      if (typeof firecrawlResponseData === 'object' && firecrawlResponseData !== null && 
          'status' in firecrawlResponseData && (firecrawlResponseData as any).status === 'completed') {
       
        const pageArrayFromApi = (firecrawlResponseData as any).data;
        if (Array.isArray(pageArrayFromApi)) {
          if (pageArrayFromApi.length === 0) {
            console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} completed but returned 0 pages in its actual data array.`);
          }
          // Perform the mapping
          formattedData = pageArrayFromApi.map((page: any) => {
            const url = page.metadata?.sourceURL || page.url || ''; // Ensure URL is robustly fetched
            const isDocument = page.metadata?.isDocument || /.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(url);
            const contentType = page.metadata?.contentType || (isDocument ? url.split('.').pop()?.toLowerCase() : 'html');
           
            return {
              url,
              title: page.metadata?.title || page.title || '',
              markdown: page.markdown || '',
              html: page.html || '',
              metadata: page.metadata || {},
              structuredData: page.json || page.llm_extraction || null 
            };
          });
          console.log(`[firecrawl-client.ts] Mapped ${formattedData.length} pages successfully for job ${crawlId}.`);
        } else {
          console.error('[firecrawl-client.ts] Firecrawl job ${crawlId} completed, but result.data.data was not an array. Received:', pageArrayFromApi);
        }
      } else {
        console.warn(`[firecrawl-client.ts] Firecrawl job ${crawlId} status not 'completed' or unexpected structure. Status: ${(firecrawlResponseData as any)?.status}. Data:`, firecrawlResponseData);
      }
    }
  } catch (error: any) {
    console.error(`[firecrawl-client.ts] CRITICAL ERROR in getCrawlResults for job ${crawlId}:`, error);
    // In case of a critical error, ensure we return an empty array and don't let it crash the caller silently
    // throw new Error(`Failed to get crawl results from Firecrawl: ${error?.message || error}`); // Optionally re-throw
  }
  console.log(`[firecrawl-client.ts] getCrawlResults for job ${crawlId} is returning ${formattedData.length} pages.`);
  return formattedData;
} 