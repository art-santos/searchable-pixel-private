import { NextApiRequest, NextApiResponse } from 'next';
/**
 * Webhook handler for Split AI content delivery
 * This endpoint receives content from Split and saves it to your designated content directory
 */
export default function handler(req: NextApiRequest, res: NextApiResponse): Promise<void>;
