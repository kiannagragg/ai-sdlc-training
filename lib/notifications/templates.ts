function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;color:#18181b;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:24px 16px;">
        <table role="presentation" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:24px 32px;background-color:#18181b;">
              <h1 style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">Meridian LMS</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;text-align:center;">
              <p style="margin:0;">Meridian Leave Management System</p>
              <p style="margin:4px 0 0;">This is an automated notification. Please do not reply directly.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function header(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#18181b;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">${text}</p>`;
}

function details(items: { label: string; value: string }[]): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 0;font-size:13px;font-weight:500;color:#71717a;width:120px;vertical-align:top;">${item.label}</td>
      <td style="padding:8px 0;font-size:13px;color:#18181b;">${item.value}</td>
    </tr>`,
    )
    .join('');
  return `<table role="presentation" style="width:100%;border-collapse:collapse;">${rows}</table>`;
}

export function leaveSubmittedTemplate(
  employeeName: string,
  leaveType: string,
  dates: string,
  managerName: string,
): { subject: string; html: string } {
  const subject = `Leave Request Submitted — ${leaveType}`;
  const html = wrapHtml(`
    ${header('Leave Request Submitted')}
    ${paragraph(`Dear ${managerName},`)}
    ${paragraph(`${employeeName} has submitted a new leave request for your review.`)}
    ${details([
      { label: 'Employee', value: employeeName },
      { label: 'Leave Type', value: leaveType },
      { label: 'Dates', value: dates },
    ])}
    ${paragraph('Please log in to the system to approve or reject this request.')}
  `);
  return { subject, html };
}

export function leaveApprovedTemplate(
  employeeName: string,
  leaveType: string,
  dates: string,
): { subject: string; html: string } {
  const subject = `Leave Approved — ${leaveType}`;
  const html = wrapHtml(`
    ${header('Leave Approved')}
    ${paragraph(`Dear ${employeeName},`)}
    ${paragraph('Your leave request has been approved.')}
    ${details([
      { label: 'Leave Type', value: leaveType },
      { label: 'Dates', value: dates },
    ])}
    ${paragraph('Enjoy your time off. If you have any questions, please contact your manager.')}
  `);
  return { subject, html };
}

export function leaveRejectedTemplate(
  employeeName: string,
  leaveType: string,
  dates: string,
  reason: string,
): { subject: string; html: string } {
  const subject = `Leave Rejected — ${leaveType}`;
  const html = wrapHtml(`
    ${header('Leave Request Rejected')}
    ${paragraph(`Dear ${employeeName},`)}
    ${paragraph('Unfortunately, your leave request has been rejected.')}
    ${details([
      { label: 'Leave Type', value: leaveType },
      { label: 'Dates', value: dates },
      { label: 'Reason', value: reason },
    ])}
    ${paragraph('If you would like to discuss this further, please reach out to your manager.')}
  `);
  return { subject, html };
}

export function leaveCancelledTemplate(
  managerName: string,
  employeeName: string,
  leaveType: string,
  dates: string,
): { subject: string; html: string } {
  const subject = `Leave Cancelled — ${leaveType}`;
  const html = wrapHtml(`
    ${header('Leave Request Cancelled')}
    ${paragraph(`Dear ${managerName},`)}
    ${paragraph(`${employeeName} has cancelled their leave request.`)}
    ${details([
      { label: 'Employee', value: employeeName },
      { label: 'Leave Type', value: leaveType },
      { label: 'Dates', value: dates },
    ])}
    ${paragraph('No further action is required on your end.')}
  `);
  return { subject, html };
}

export function balanceOverrideTemplate(
  employeeName: string,
  leaveType: string,
  year: number,
  changes: string,
): { subject: string; html: string } {
  const subject = `Leave Balance Updated — ${leaveType} ${year}`;
  const html = wrapHtml(`
    ${header('Leave Balance Override')}
    ${paragraph(`Dear ${employeeName},`)}
    ${paragraph('Your leave balance has been updated by an administrator.')}
    ${details([
      { label: 'Leave Type', value: leaveType },
      { label: 'Year', value: String(year) },
      { label: 'Changes', value: changes },
    ])}
    ${paragraph('You can view your updated balance in the system. If you believe this is an error, please contact HR.')}
  `);
  return { subject, html };
}
