import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Webhook handler for Split AI content delivery
 * This endpoint receives content from Split and saves it to your designated content directory
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle GET requests for ping/verification
  if (req.method === 'GET') {
    try {
      // Check if this is a ping request
      const isPingCheck = req.query.ping === 'true';
      
      if (isPingCheck) {
        // Get agent ID from environment
        const agentId = process.env.SPLIT_AGENT_ID;
        const siteId = process.env.SPLIT_SITE_ID;
        const contentDir = process.env.SPLIT_CONTENT_DIR || 'content/split';
        
        // Check if content directory exists
        let contentDirExists = false;
        try {
          await fs.access(path.join(process.cwd(), contentDir));
          contentDirExists = true;
        } catch (e) {
          // Directory doesn't exist, which is fine for this check
        }
        
        return res.status(200).json({
          success: true,
          status: 'connected',
          agent_id: agentId,
          site_id: siteId,
          version: '1.0', // Future-proofing for version checks
          content_dir: contentDir,
          content_dir_exists: contentDirExists,
          timestamp: new Date().toISOString()
        });
      }
      
      // If not a ping request, just return a simple success response
      return res.status(200).json({ 
        success: true,
        message: 'Split agent is running'
      });
    } catch (error) {
      console.error('Split agent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Handle POST requests for content delivery
  if (req.method === 'POST') {
    try {
      // 1. Verify the request signature
      const signature = req.headers['x-split-signature'] as string;
      if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
      }

      // 2. Get request body as text for signature verification
      const rawBody = JSON.stringify(req.body);
      
      // 3. Verify HMAC signature
      const isValid = verifySignature(rawBody, signature);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      // 4. Parse the body content
      const { content, metadata } = req.body;
      
      if (!content || !metadata || !metadata.slug) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // 5. Save the MDX content to the content directory
      const contentDir = process.env.SPLIT_CONTENT_DIR || 'content/split';
      const filePath = path.join(process.cwd(), contentDir, `${metadata.slug}.mdx`);
      
      // Ensure the directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write the file
      await fs.writeFile(filePath, content);
      
      // 6. Optionally update sitemap.xml and llms.txt
      await updateSitemap(metadata);
      await updateLlmsTxt(metadata);
      
      return res.status(200).json({ success: true, slug: metadata.slug });
      
    } catch (error) {
      console.error('Split agent error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * Verify the HMAC signature from Split
 */
function verifySignature(payload: string, signature: string): boolean {
  try {
    const secret = process.env.SPLIT_AGENT_SECRET;
    if (!secret) {
      console.error('Missing SPLIT_AGENT_SECRET environment variable');
      return false;
    }
    
    const hmac = crypto.createHmac('sha256', secret);
    const expectedSignature = hmac.update(payload).digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Update sitemap.xml with the new content URL
 */
async function updateSitemap(metadata: { slug: string, title: string }) {
  try {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    
    // Check if sitemap exists
    let sitemapContent: string;
    try {
      sitemapContent = await fs.readFile(sitemapPath, 'utf8');
    } catch (error) {
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
    sitemapContent = sitemapContent.replace(
      '<!-- Split AI content will be automatically added to this sitemap -->',
      newEntry
    );
    
    await fs.writeFile(sitemapPath, sitemapContent);
    console.log(`Updated sitemap.xml with new entry for slug: ${metadata.slug}`);
  } catch (error) {
    console.error('Error updating sitemap:', error);
  }
}

/**
 * Update llms.txt with the new content URL
 */
async function updateLlmsTxt(metadata: { slug: string, title: string }) {
  try {
    const llmsPath = path.join(process.cwd(), 'public', 'llms.txt');
    
    // Check if llms.txt exists
    let llmsContent: string;
    try {
      llmsContent = await fs.readFile(llmsPath, 'utf8');
    } catch (error) {
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
    
    await fs.writeFile(llmsPath, llmsContent);
    console.log(`Updated llms.txt with new entry for slug: ${metadata.slug}`);
  } catch (error) {
    console.error('Error updating llms.txt:', error);
  }
} 