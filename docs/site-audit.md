# Site Audit Feature

The Site Audit feature in Split uses Firecrawl to analyze websites for SEO and AI Engine Optimization (AEO).

## Features

### Core Analysis
- **Content Structure Analysis**: Evaluates headings, content structure, readability, and semantic HTML
- **Technical Checks**: Tests status codes, redirects, broken links, and page load issues
- **AI Visibility Scoring**: Assesses how well content is optimized for AI engines
- **LLMS.txt Detection**: Checks for and validates llms.txt files for AI crawler permissions
- **Schema.org Implementation**: Analyzes structured data for quality and coverage
- **Issue Detection**: Identifies critical, warning, and information-level issues

### Enhanced Analysis
- **Document Analysis**: Handles PDF, DOCX, and other document formats
- **Media Accessibility**: Evaluates image alt text, video captions, and transcript availability
- **Interactive Testing**: Performs actions to test popups, cookie banners, and dynamic content
- **AI-Powered Extraction**: Uses LLMs to extract website purpose and audience information
- **Screenshots**: Captures visual representation of the website during crawling
- **Robots.txt Analysis**: Checks for AI crawler directives in robots.txt

## Getting Started

### Running a Site Audit
1. Enter a website URL in the input field
2. Configure advanced options if desired:
   - **Max Pages**: Limit the number of pages to crawl (default: 100)
   - **Include Documents**: Include PDFs, DOCXs, and other documents (default: enabled)
   - **Media Accessibility**: Analyze images, videos, and other media for accessibility (default: enabled)
   - **Interactive Checks**: Test for popups, cookie banners, and other interactive elements (default: disabled)
3. Click "Start Crawl" to begin the audit

### Viewing Results
The audit results are broken into several tabs:
- **Pages**: Lists all crawled pages with status, AI visibility, and issues
- **Issues**: Detailed breakdown of all detected issues across the site
- **Performance**: Technical and content quality metrics
- **AI Visibility**: Specific scores and details for AI optimization

### Understanding the AI Visibility Score
The AI Visibility score is a composite of multiple factors:
- **LLMS.txt Coverage**: Percentage of site protected by llms.txt directives (25%)
- **Structured Data**: Quality and coverage of schema.org markup (25%)
- **Content Structure**: Quality of headings, lists, and semantic HTML (25%)
- **Semantics**: Readability and contextual organization (15%)
- **Media Accessibility**: Alt text and transcripts for media content (10%)

## Technical Implementation

### Database Schema
The site audit feature uses the following database tables:
- `sites`: Stores information about audited websites
- `crawls`: Tracks crawl jobs and overall metrics
- `pages`: Stores individual page data and metrics
- `issues`: Records issues found during the audit
- `recommendations`: Stores specific recommendations for improvements
- `screenshots`: Stores screenshots captured during interactive testing

### API Endpoints
- `POST /api/site-audit/start`: Start a new site audit
- `GET /api/site-audit/status/[id]`: Check the status of an audit
- `GET /api/site-audit/partial-results/[id]`: Get partial results of an in-progress audit
- `GET /api/site-audit/results/[id]`: Get complete results of a finished audit

## Troubleshooting

### Common Issues
- **Timeouts**: Some sites may block or rate-limit crawlers. Try with fewer pages.
- **Authentication**: The crawler cannot access pages behind login walls without special configuration.
- **JavaScript-heavy sites**: Some dynamic content may not be fully rendered.

### Performance Considerations
- Large sites may take significant time to crawl and process
- Consider limiting the max pages for quicker results
- Interactive checks increase the processing time but provide valuable insights

## Next Steps
Future enhancements to consider:
- Adding competitive analysis to compare against similar websites
- Implementing historical tracking to show improvements over time
- Generating SEO and AEO action plans automatically
- Integrating with content management systems for direct fixes
- Supporting crawling behind authentication 