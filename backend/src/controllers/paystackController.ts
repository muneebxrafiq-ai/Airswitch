import { Request, Response } from 'express';
import * as paystackService from '../services/paystackService';

interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const initializePayment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { amount, email, currency, callback_url, planId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!amount || !email) {
            return res.status(400).json({ error: 'Amount and email are required' });
        }

        // callback_url from client is ignored; backend uses its own URL for deep linking
        const result = await paystackService.initializeTransaction(email, amount, userId, currency, callback_url, planId);
        res.json(result);
    } catch (error: any) {
        console.error('Paystack Init Controller Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const verifyPayment = async (req: Request, res: Response) => {
    try {
        const { reference } = req.params;
        if (!reference) {
            return res.status(400).json({ error: 'Reference is required' });
        }

        const result = await paystackService.verifyTransaction(reference as string);
        res.json(result);
    } catch (error: any) {
        console.error('Paystack Verify Controller Error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const handlePaystackReturn = async (req: Request, res: Response) => {
    const { reference } = req.query;

    const scheme = process.env.MOBILE_DEEP_LINK_SCHEME || 'airswitch';
    const deepLink =
        `${scheme}://payment-complete` +
        (reference ? `?reference=${encodeURIComponent(String(reference))}` : '');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Finishing up...</title>
          <script>
            window.location = '${deepLink}';
            setTimeout(function () {
              var btn = document.getElementById('open-app-btn');
              if (btn) btn.style.display = 'block';
            }, 2000);
          </script>
        </head>
        <body>
          <p>You can now return to the Airswitch app.</p>
          <button id="open-app-btn" style="display:none" onclick="window.location='${deepLink}'">
            Open the app
          </button>
        </body>
      </html>
    `);
};
