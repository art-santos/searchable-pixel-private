"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Webhook handler for Split AI content delivery
 * This endpoint receives content from Split and saves it to your designated content directory
 */
async function POST(req) {
    try {
        // 1. Verify the request signature
        const signature = req.headers.get('x-split-signature');
        if (!signature) {
            return new server_1.NextResponse(JSON.stringify({ error: 'Missing signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // 2. Get request body as text for signature verification
        const rawBody = await req.text();
        // 3. Verify HMAC signature
        const isValid = verifySignature(rawBody, signature);
        if (!isValid) {
            return new server_1.NextResponse(JSON.stringify({ error: 'Invalid signature' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // 4. Parse the body content
        const body = JSON.parse(rawBody);
        const { content, metadata } = body;
        if (!content || !metadata || !metadata.slug) {
            return new server_1.NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // 5. Save the MDX content to the content directory
        const contentDir = process.env.SPLIT_CONTENT_DIR || 'content/split';
        const filePath = path_1.default.join(process.cwd(), contentDir, `${metadata.slug}.mdx`);
        // Ensure the directory exists
        await promises_1.default.mkdir(path_1.default.dirname(filePath), { recursive: true });
        // Write the file
        await promises_1.default.writeFile(filePath, content);
        // 6. Optionally update sitemap.xml and llms.txt
        await updateSitemap(metadata);
        await updateLlmsTxt(metadata);
        return new server_1.NextResponse(JSON.stringify({ success: true, slug: metadata.slug }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    catch (error) {
        console.error('Split agent error:', error);
        return new server_1.NextResponse(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
/**
 * Verify the HMAC signature from Split
 */
function verifySignature(payload, signature) {
    try {
        const secret = process.env.SPLIT_AGENT_SECRET;
        if (!secret) {
            console.error('Missing SPLIT_AGENT_SECRET environment variable');
            return false;
        }
        const hmac = crypto_1.default.createHmac('sha256', secret);
        const expectedSignature = hmac.update(payload).digest('hex');
        return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}
/**
 * Update sitemap.xml with the new content URL
 */
async function updateSitemap(metadata) {
    try {
        const sitemapPath = path_1.default.join(process.cwd(), 'public', 'sitemap.xml');
        // Check if sitemap exists
        let sitemapContent;
        try {
            sitemapContent = await promises_1.default.readFile(sitemapPath, 'utf8');
        }
        catch (error) {
            console.warn('Sitemap not found, skipping update');
            return;
        }
        // Don't add duplicate entries
        if (sitemapContent.includes(`<loc>https://${process.env.NEXT_PUBLIC_DOMAIN}/blog/${metadata.slug}</loc>`)) {
            return;
        }
        // Add new URL before the closing tag
        const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const newEntry = `  <url>
    <loc>https://${process.env.NEXT_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'yourdomain.com'}/blog/${metadata.slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Split AI content will be automatically added to this sitemap -->`;
        // Replace the comment with our new entry plus the comment again (to keep the marker for future additions)
        sitemapContent = sitemapContent.replace('<!-- Split AI content will be automatically added to this sitemap -->', newEntry);
        await promises_1.default.writeFile(sitemapPath, sitemapContent);
        console.log(`Updated sitemap.xml with new entry for slug: ${metadata.slug}`);
    }
    catch (error) {
        console.error('Error updating sitemap:', error);
    }
}
/**
 * Update llms.txt with the new content URL
 */
async function updateLlmsTxt(metadata) {
    try {
        const llmsPath = path_1.default.join(process.cwd(), 'public', 'llms.txt');
        // Check if llms.txt exists
        let llmsContent;
        try {
            llmsContent = await promises_1.default.readFile(llmsPath, 'utf8');
        }
        catch (error) {
            console.warn('llms.txt not found, skipping update');
            return;
        }
        // Don't add duplicate entries
        const domain = process.env.NEXT_PUBLIC_DOMAIN || process.env.VERCEL_URL || 'yourdomain.com';
        const urlToAdd = `https://${domain}/blog/${metadata.slug}`;
        if (llmsContent.includes(urlToAdd)) {
            return;
        }
        // Add new URL with a comment describing the content
        const newEntry = `${urlToAdd} # ${metadata.title}`;
        llmsContent += `\n${newEntry}`;
        await promises_1.default.writeFile(llmsPath, llmsContent);
        console.log(`Updated llms.txt with new entry for slug: ${metadata.slug}`);
    }
    catch (error) {
        console.error('Error updating llms.txt:', error);
    }
}
