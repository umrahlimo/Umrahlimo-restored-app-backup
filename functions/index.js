const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  const fromName = process.env.SMTP_FROM_NAME || "UmrahLimo";

  if (!host || !user || !pass) {
    throw new Error("Missing SMTP config. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables.");
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    fromName,
    secure: port === 465
  };
};

let transporter;

const getTransporter = () => {
  if (!transporter) {
    const { host, port, user, pass, secure } = getSmtpConfig();
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      }
    });
  }
  return transporter;
};

const safeName = (name) => {
  if (!name) return "there";
  const trimmed = String(name).trim();
  return trimmed.length > 0 ? trimmed : "there";
};

const renderEmailBase = ({ preheader, subject, content }) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;font-size:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;">

        <!-- TOP ACCENT BAR -->
        <tr>
          <td style="background:linear-gradient(90deg,#0f766e,#0d9488,#14b8a6);height:5px;border-radius:12px 12px 0 0;font-size:0;">&nbsp;</td>
        </tr>

        <!-- HEADER -->
        <tr>
          <td style="background:#0f172a;padding:30px 40px 26px;text-align:center;">
            <div style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:3px;text-transform:uppercase;font-family:Georgia,serif;">UmrahLimo</div>
            <div style="font-size:11px;color:#5eead4;margin-top:8px;letter-spacing:3px;text-transform:uppercase;">Premium Chauffeur Services</div>
            <div style="width:50px;height:2px;background:#0f766e;margin:14px auto 0;border-radius:2px;"></div>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
            ${content}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0f172a;border-radius:0 0 12px 12px;padding:30px 40px 28px;">

            <!-- Social Icons -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 22px;">
              <tr>
                <td style="padding:0 6px;">
                  <a href="https://facebook.com/umrahlimo" target="_blank" style="display:inline-block;width:44px;height:44px;background-color:#1877F2;border-radius:50%;text-align:center;text-decoration:none;font-size:24px;font-weight:900;font-family:Arial,Helvetica,sans-serif;color:#ffffff;line-height:44px;">f</a>
                </td>
                <td style="padding:0 6px;">
                  <a href="https://instagram.com/umrahlimo" target="_blank" style="display:inline-block;width:44px;height:44px;background-color:#C13584;border-radius:50%;text-align:center;text-decoration:none;font-size:15px;font-weight:900;font-family:Arial,Helvetica,sans-serif;color:#ffffff;line-height:44px;">IG</a>
                </td>
                <td style="padding:0 6px;">
                  <a href="https://tiktok.com/@umrahlimo" target="_blank" style="display:inline-block;width:44px;height:44px;background-color:#010101;border-radius:50%;text-align:center;text-decoration:none;font-size:15px;font-weight:900;font-family:Arial,Helvetica,sans-serif;color:#69C9D0;line-height:44px;">TK</a>
                </td>
                <td style="padding:0 6px;">
                  <a href="https://wa.me/966500000000" target="_blank" style="display:inline-block;width:44px;height:44px;background-color:#25D366;border-radius:50%;text-align:center;text-decoration:none;font-size:15px;font-weight:900;font-family:Arial,Helvetica,sans-serif;color:#ffffff;line-height:44px;">WA</a>
                </td>
                <td style="padding:0 6px;">
                  <a href="https://twitter.com/umrahlimo" target="_blank" style="display:inline-block;width:44px;height:44px;background-color:#14171A;border-radius:50%;text-align:center;text-decoration:none;font-size:22px;font-weight:900;font-family:Arial,Helvetica,sans-serif;color:#ffffff;line-height:44px;">X</a>
                </td>
              </tr>
            </table>

            <!-- Footer Nav -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 18px;">
              <tr>
                <td style="padding:0 12px;border-right:1px solid #1e293b;">
                  <a href="https://umrahlimo.com" style="color:#5eead4;text-decoration:none;font-size:12px;">Website</a>
                </td>
                <td style="padding:0 12px;border-right:1px solid #1e293b;">
                  <a href="https://umrahlimo.com/dashboard" style="color:#5eead4;text-decoration:none;font-size:12px;">Dashboard</a>
                </td>
                <td style="padding:0 12px;border-right:1px solid #1e293b;">
                  <a href="https://umrahlimo.com/search" style="color:#5eead4;text-decoration:none;font-size:12px;">Book a Ride</a>
                </td>
                <td style="padding:0 12px;">
                  <a href="mailto:info@umrahlimo.com" style="color:#5eead4;text-decoration:none;font-size:12px;">Support</a>
                </td>
              </tr>
            </table>

            <!-- Copyright -->
            <div style="text-align:center;font-size:12px;color:#475569;line-height:20px;">
              &copy; ${year} UmrahLimo. All rights reserved.<br>
              <a href="mailto:info@umrahlimo.com" style="color:#334155;text-decoration:none;">info@umrahlimo.com</a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const buildWelcomeEmail = ({ firstName }) => {
  const greetingName = safeName(firstName);
  const subject = "Welcome to UmrahLimo – Your Sacred Journey Awaits";
  const preheader = "Your account is ready. Experience premium chauffeur service for your Umrah journey.";

  const content = `
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#0f172a;">Welcome to UmrahLimo! &#x1F54C;</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;font-weight:500;border-bottom:1px solid #f1f5f9;padding-bottom:20px;">Account successfully created</p>

    <p style="margin:0 0 10px;font-size:16px;color:#1e293b;">Hi <strong>${greetingName}</strong>,</p>
    <p style="margin:0 0 26px;font-size:15px;color:#475569;line-height:26px;">
      We are truly honored to welcome you to <strong>UmrahLimo</strong> — your trusted companion for premium chauffeur services during your sacred Umrah and Hajj journey.
    </p>

    <!-- Feature Cards -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td width="32%" style="padding:0 5px 0 0;vertical-align:top;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 12px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">&#x1F697;</div>
            <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:4px;">Premium Fleet</div>
            <div style="font-size:11px;color:#4ade80;">Luxury vehicles</div>
          </div>
        </td>
        <td width="32%" style="padding:0 2px;vertical-align:top;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px 12px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">&#x1F54C;</div>
            <div style="font-size:12px;font-weight:700;color:#1e40af;margin-bottom:4px;">Holy Routes</div>
            <div style="font-size:11px;color:#60a5fa;">Makkah &amp; Madinah</div>
          </div>
        </td>
        <td width="32%" style="padding:0 0 0 5px;vertical-align:top;">
          <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:12px;padding:18px 12px;text-align:center;">
            <div style="font-size:28px;margin-bottom:8px;">&#x1F6E1;&#xFE0F;</div>
            <div style="font-size:12px;font-weight:700;color:#6b21a8;margin-bottom:4px;">24/7 Support</div>
            <div style="font-size:11px;color:#c084fc;">Always here</div>
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:26px;">
      Manage your bookings, view receipts, track your driver, and access support — all from your personal dashboard.
    </p>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#0f766e;border-radius:10px;">
          <a href="https://umrahlimo.com/dashboard" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">Go to Your Dashboard &rarr;</a>
        </td>
      </tr>
    </table>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;">
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:20px;">
        You received this email because you created an UmrahLimo account.<br>
        Need help? <a href="mailto:info@umrahlimo.com" style="color:#0f766e;text-decoration:none;font-weight:600;">info@umrahlimo.com</a>
      </p>
    </div>
  `;

  const text = `Welcome to UmrahLimo!\n\nHi ${greetingName},\n\nThank you for joining UmrahLimo. Your account is ready.\n\nDashboard: https://umrahlimo.com/dashboard\n\nNeed help? Email us at info@umrahlimo.com`;

  return { subject, preheader, html: renderEmailBase({ preheader, subject, content }), text };
};

const buildWelcomeBackEmail = ({ firstName }) => {
  const greetingName = safeName(firstName);
  const subject = "Welcome Back to UmrahLimo – Ready for Your Next Journey";
  const preheader = "We are ready for your next sacred journey. Plan your ride today.";

  const content = `
    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#0f172a;">Welcome Back! &#x1F44B;</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;font-weight:500;border-bottom:1px solid #f1f5f9;padding-bottom:20px;">Great to see you again</p>

    <p style="margin:0 0 10px;font-size:16px;color:#1e293b;">Hi <strong>${greetingName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:26px;">
      It is wonderful to have you back. Your account is ready and we are honored to serve your next journey with the same comfort and professionalism you deserve.
    </p>

    <!-- Highlight Box -->
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-left:4px solid #0f766e;border-radius:8px;padding:18px 20px;margin:0 0 28px;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#134e4a;">&#x2728; What is waiting for you</p>
      <p style="margin:0;font-size:13px;color:#475569;line-height:22px;">
        New vehicle options &bull; Updated routes &bull; Exclusive member offers &bull; 24/7 driver support
      </p>
    </div>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#0f766e;border-radius:10px;">
          <a href="https://umrahlimo.com/search" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">Plan Your Next Ride &rarr;</a>
        </td>
      </tr>
    </table>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;">
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:20px;">
        Need help? <a href="mailto:info@umrahlimo.com" style="color:#0f766e;text-decoration:none;font-weight:600;">info@umrahlimo.com</a>
      </p>
    </div>
  `;

  const text = `Welcome Back to UmrahLimo!\n\nHi ${greetingName},\n\nGreat to see you again! Your account is ready.\n\nPlan your next ride: https://umrahlimo.com/search\n\nNeed help? Email us at info@umrahlimo.com`;

  return { subject, preheader, html: renderEmailBase({ preheader, subject, content }), text };
};

const buildBookingConfirmationEmail = ({ firstName, bookingId, fromLocation, toLocation, pickupDate, pickupTime, vehicleName, passengers, totalAmount, currency }) => {
  const greetingName = safeName(firstName);
  const shortId = bookingId ? bookingId.slice(0, 8).toUpperCase() : "—";
  const subject = `Booking Received – #${shortId} | UmrahLimo`;
  const preheader = "Your UmrahLimo booking has been received. We will confirm it shortly.";

  const dFrom = fromLocation || "—";
  const dTo = toLocation || "—";
  const dDate = pickupDate || "—";
  const dTime = pickupTime || "—";
  const dVehicle = vehicleName || "—";
  const dPassengers = passengers || "—";
  const dAmount = totalAmount ? `${currency || "USD"} ${Number(totalAmount).toFixed(2)}` : "—";

  const content = `
    <!-- Status Badge -->
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:12px 20px;margin-bottom:28px;text-align:center;">
      <span style="font-size:13px;font-weight:700;color:#854d0e;">&#x23F3; Pending Admin Approval</span>
    </div>

    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#0f172a;">Booking Received! &#x1F4CB;</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;font-weight:500;border-bottom:1px solid #f1f5f9;padding-bottom:20px;">We will confirm your booking shortly</p>

    <p style="margin:0 0 10px;font-size:16px;color:#1e293b;">Hi <strong>${greetingName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:26px;">
      Your booking has been successfully received. Our team is reviewing your request and will confirm it soon. You will receive another email once approved.
    </p>

    <!-- Booking Reference Box -->
    <div style="background:#f8fafc;border:2px solid #0f766e;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
      <div style="font-size:11px;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:1.5px;">Booking Reference</div>
      <div style="font-size:30px;font-weight:900;color:#0f172a;letter-spacing:4px;font-family:Georgia,serif;">#${shortId}</div>
    </div>

    <!-- Trip Details Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td colspan="2" style="padding-bottom:12px;">
          <div style="font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #0f766e;padding-bottom:8px;">&#x1F697; Trip Details</div>
        </td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;width:42%;">&#x1F4CD; From</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dFrom}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F3C1; To</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dTo}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F4C5; Date</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dDate}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x23F0; Pickup Time</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dTime}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F697; Vehicle</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dVehicle}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F465; Passengers</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dPassengers}</td>
      </tr>
      <tr>
        <td style="padding:14px 0;font-size:15px;font-weight:700;color:#0f172a;">&#x1F4B0; Total Amount</td>
        <td style="padding:14px 0;font-size:17px;font-weight:800;color:#0f766e;">${dAmount}</td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:#0f766e;border-radius:10px;">
          <a href="https://umrahlimo.com/dashboard" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">Track Your Booking &rarr;</a>
        </td>
      </tr>
    </table>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;">
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:20px;">
        Questions? Contact us at <a href="mailto:info@umrahlimo.com" style="color:#0f766e;text-decoration:none;font-weight:600;">info@umrahlimo.com</a>
      </p>
    </div>
  `;

  const text = `Booking Received!\n\nHi ${greetingName},\n\nBooking Ref: #${shortId}\nFrom: ${dFrom}\nTo: ${dTo}\nDate: ${dDate}\nTime: ${dTime}\nVehicle: ${dVehicle}\nPassengers: ${dPassengers}\nTotal: ${dAmount}\n\nTrack: https://umrahlimo.com/dashboard\n\nNeed help? info@umrahlimo.com`;

  return { subject, preheader, html: renderEmailBase({ preheader, subject, content }), text };
};

const buildPaymentConfirmationEmail = ({ firstName, bookingId, fromLocation, toLocation, pickupDate, amountPaid, currency, paymentType }) => {
  const greetingName = safeName(firstName);
  const shortId = bookingId ? bookingId.slice(0, 8).toUpperCase() : "—";
  const subject = `Payment Confirmed – #${shortId} | UmrahLimo`;
  const preheader = "Your payment has been successfully received. Thank you!";

  const dFrom = fromLocation || "—";
  const dTo = toLocation || "—";
  const dDate = pickupDate || "—";
  const dAmount = amountPaid ? `${currency || "USD"} ${Number(amountPaid).toFixed(2)}` : "—";
  const dPayType = paymentType === "full" ? "Full Payment" : "Deposit Payment";

  const now = new Date();
  const paymentDate = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const paymentTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const content = `
    <!-- Success Badge -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 20px;margin-bottom:28px;text-align:center;">
      <span style="font-size:13px;font-weight:700;color:#166534;">&#x2705; Payment Successfully Received</span>
    </div>

    <h1 style="margin:0 0 6px;font-size:26px;font-weight:800;color:#0f172a;">Payment Confirmed! &#x1F4B3;</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#64748b;font-weight:500;border-bottom:1px solid #f1f5f9;padding-bottom:20px;">Thank you for your payment</p>

    <p style="margin:0 0 10px;font-size:16px;color:#1e293b;">Hi <strong>${greetingName}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:26px;">
      We have successfully received your payment. Your booking is now confirmed and your driver will be assigned shortly.
    </p>

    <!-- Amount Highlight -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#0f172a;border-radius:12px;padding:24px;text-align:center;">
          <div style="font-size:11px;color:#5eead4;margin-bottom:8px;text-transform:uppercase;letter-spacing:1.5px;">Amount Paid</div>
          <div style="font-size:36px;font-weight:900;color:#ffffff;font-family:Georgia,serif;">${dAmount}</div>
          <div style="display:inline-block;background:#0f766e;border-radius:6px;padding:4px 14px;margin-top:10px;">
            <span style="font-size:12px;color:#ffffff;font-weight:600;">${dPayType}</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Payment Receipt Table -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td colspan="2" style="padding-bottom:12px;">
          <div style="font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #0f766e;padding-bottom:8px;">&#x1F9FE; Payment Receipt</div>
        </td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;width:42%;">&#x1F516; Booking Ref</td>
        <td style="padding:11px 0;font-size:14px;font-weight:700;color:#0f766e;border-bottom:1px solid #f1f5f9;">#${shortId}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F4C5; Payment Date</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${paymentDate}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x23F0; Payment Time</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${paymentTime}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F4CD; From</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dFrom}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F3C1; To</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dTo}</td>
      </tr>
      <tr>
        <td style="padding:11px 0;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">&#x1F5D3;&#xFE0F; Trip Date</td>
        <td style="padding:11px 0;font-size:14px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">${dDate}</td>
      </tr>
      <tr>
        <td style="padding:14px 0;font-size:15px;font-weight:700;color:#0f172a;">&#x1F4B3; Total Paid</td>
        <td style="padding:14px 0;font-size:17px;font-weight:800;color:#0f766e;">${dAmount}</td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0f766e;border-radius:10px;">
          <a href="https://umrahlimo.com/dashboard" style="display:inline-block;padding:15px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">View My Booking &rarr;</a>
        </td>
      </tr>
    </table>

    <!-- Save Receipt Note -->
    <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#854d0e;line-height:20px;">
        &#x1F4A1; <strong>Save this email</strong> as your payment receipt. Need a formal invoice? Contact us.
      </p>
    </div>

    <div style="border-top:1px solid #e2e8f0;padding-top:18px;">
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:20px;">
        Questions? <a href="mailto:info@umrahlimo.com" style="color:#0f766e;text-decoration:none;font-weight:600;">info@umrahlimo.com</a>
      </p>
    </div>
  `;

  const text = `Payment Confirmed!\n\nHi ${greetingName},\n\nBooking Ref: #${shortId}\nAmount Paid: ${dAmount}\nPayment Type: ${dPayType}\nFrom: ${dFrom}\nTo: ${dTo}\nTrip Date: ${dDate}\n\nView booking: https://umrahlimo.com/dashboard\n\nNeed help? info@umrahlimo.com`;

  return { subject, preheader, html: renderEmailBase({ preheader, subject, content }), text };
};

const logEmailEvent = async ({ type, uid, email, status, messageId, error, meta }) => {
  const payload = {
    type,
    uid: uid || null,
    email: email || null,
    status,
    messageId: messageId || null,
    error: error || null,
    meta: meta || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await admin.firestore().collection("email_logs").add(payload);
};

const sendEmail = async ({ to, subject, html, text }) => {
  const { from, fromName } = getSmtpConfig();
  const mailOptions = {
    from: `"${fromName}" <${from}>`,
    to,
    subject,
    html,
    text
  };

  const info = await getTransporter().sendMail(mailOptions);
  return info;
};

const toMillis = (value) => {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const runtimeOptions = {
  timeoutSeconds: 60,
  memory: "256MB"
};

exports.sendWelcomeEmailOnSignup = functions
  .runWith(runtimeOptions)
  .firestore.document("customers_login/{uid}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const email = data.email;
    const firstName = data.firstName || "";

    if (!email) {
      await logEmailEvent({
        type: "welcome",
        uid: context.params.uid,
        email: null,
        status: "skipped_missing_email",
        meta: { eventId: context.eventId }
      });
      return null;
    }

    if (data.welcomeEmailSentAt) {
      return null;
    }

    try {
      const mail = buildWelcomeEmail({ firstName });
      const info = await sendEmail({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text
      });

      await snap.ref.set({
        welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      await logEmailEvent({
        type: "welcome",
        uid: context.params.uid,
        email,
        status: "sent",
        messageId: info.messageId,
        meta: { eventId: context.eventId }
      });
    } catch (error) {
      console.error("Welcome email failed:", error);
      await logEmailEvent({
        type: "welcome",
        uid: context.params.uid,
        email,
        status: "failed",
        error: error.message,
        meta: { eventId: context.eventId }
      });
    }

    return null;
  });

exports.recordLoginAndMaybeSendWelcomeBack = functions
  .runWith(runtimeOptions)
  .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.uid) {
      throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }

    const uid = context.auth.uid;
    const userRef = admin.firestore().doc(`customers_login/${uid}`);
    let userData = null;
    let shouldSend = false;
    const now = Date.now();

    await admin.firestore().runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) {
        return;
      }

      userData = userSnap.data() || {};
      const lastLoginAt = toMillis(userData.lastLoginAt);
      const lastWelcomeBackSentAt = toMillis(userData.lastWelcomeBackSentAt);

      const eligibleByLogin = lastLoginAt && now - lastLoginAt >= FIVE_DAYS_MS;
      const eligibleByWelcomeBack = !lastWelcomeBackSentAt || now - lastWelcomeBackSentAt >= FIVE_DAYS_MS;

      shouldSend = Boolean(eligibleByLogin && eligibleByWelcomeBack);

      const updatePayload = {
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (shouldSend) {
        updatePayload.lastWelcomeBackSentAt = admin.firestore.FieldValue.serverTimestamp();
      }

      tx.set(userRef, updatePayload, { merge: true });
    });

    if (!userData) {
      return { status: "no_user_doc" };
    }

    if (!shouldSend) {
      return { status: "skipped" };
    }

    const email = userData.email || (context.auth.token && context.auth.token.email) || data.email || null;
    const firstName = userData.firstName || "";

    if (!email) {
      await logEmailEvent({
        type: "welcome_back",
        uid,
        email: null,
        status: "skipped_missing_email"
      });
      return { status: "missing_email" };
    }

    try {
      const mail = buildWelcomeBackEmail({ firstName });
      const info = await sendEmail({
        to: email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text
      });

      await logEmailEvent({
        type: "welcome_back",
        uid,
        email,
        status: "sent",
        messageId: info.messageId
      });

      return { status: "sent" };
    } catch (error) {
      console.error("Welcome back email failed:", error);
      await logEmailEvent({
        type: "welcome_back",
        uid,
        email,
        status: "failed",
        error: error.message
      });

      return { status: "failed" };
    }
  });

exports.sendBookingConfirmationEmail = functions
  .runWith(runtimeOptions)
  .firestore.document("bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    const userId = data.userId;
    const bookingId = context.params.bookingId;

    if (!userId) return null;

    let email = null;
    let firstName = "";
    try {
      const userSnap = await admin.firestore().doc(`customers_login/${userId}`).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        email = userData.email;
        firstName = userData.firstName || "";
      }
    } catch (e) {
      console.error("Failed to fetch user for booking email:", e);
    }

    if (!email) {
      await logEmailEvent({ type: "booking_confirmation", uid: userId, email: null, status: "skipped_missing_email", meta: { bookingId } });
      return null;
    }

    try {
      const mail = buildBookingConfirmationEmail({
        firstName,
        bookingId,
        fromLocation: data.fromLocation || "",
        toLocation: data.toLocation || "",
        pickupDate: data.departureDate || data.pickupDate || "",
        pickupTime: data.departureTime || data.pickupTime || "",
        vehicleName: data.vehicleName || "",
        passengers: ((data.adults || 0) + (data.children || 0) + (data.infants || 0)) || data.passengers || "",
        totalAmount: data.totalPrice || data.depositAmount || "",
        currency: data.displayCurrency || data.baseCurrency || "USD"
      });

      const info = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
      await logEmailEvent({ type: "booking_confirmation", uid: userId, email, status: "sent", messageId: info.messageId, meta: { bookingId } });
    } catch (error) {
      console.error("Booking confirmation email failed:", error);
      await logEmailEvent({ type: "booking_confirmation", uid: userId, email, status: "failed", error: error.message, meta: { bookingId } });
    }

    return null;
  });

exports.sendPaymentConfirmationEmail = functions
  .runWith(runtimeOptions)
  .firestore.document("bookings/{bookingId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const bookingId = context.params.bookingId;

    const paidStatuses = ["paid", "full_paid", "payment_complete", "fully_paid"];
    const wasNotPaid = !paidStatuses.includes(before.paymentStatus);
    const isNowPaid = paidStatuses.includes(after.paymentStatus);

    if (!wasNotPaid || !isNowPaid) return null;

    const userId = after.userId;
    if (!userId) return null;

    let email = null;
    let firstName = "";
    try {
      const userSnap = await admin.firestore().doc(`customers_login/${userId}`).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        email = userData.email;
        firstName = userData.firstName || "";
      }
    } catch (e) {
      console.error("Failed to fetch user for payment email:", e);
    }

    if (!email) {
      await logEmailEvent({ type: "payment_confirmation", uid: userId, email: null, status: "skipped_missing_email", meta: { bookingId } });
      return null;
    }

    try {
      const mail = buildPaymentConfirmationEmail({
        firstName,
        bookingId,
        fromLocation: after.fromLocation || after.from || after.pickupLocation || "",
        toLocation: after.toLocation || after.to || after.dropLocation || "",
        pickupDate: after.pickupDate || after.date || "",
        amountPaid: after.totalAmount || after.price || after.amount || "",
        currency: after.currency || "USD",
        paymentType: after.paymentStatus === "full_paid" ? "full" : "deposit"
      });

      const info = await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
      await logEmailEvent({ type: "payment_confirmation", uid: userId, email, status: "sent", messageId: info.messageId, meta: { bookingId, paymentStatus: after.paymentStatus } });
    } catch (error) {
      console.error("Payment confirmation email failed:", error);
      await logEmailEvent({ type: "payment_confirmation", uid: userId, email, status: "failed", error: error.message, meta: { bookingId } });
    }

    return null;
  });
