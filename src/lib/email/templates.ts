interface InviteTemplateInput {
  recipientName?: string | null;
  temporaryPassword: string;
  loginUrl: string;
}

interface PasswordTemplateInput {
  recipientName?: string | null;
  password: string;
  loginUrl: string;
  customPasswordUsed: boolean;
}

function greeting(name?: string | null) {
  if (!name || !name.trim()) {
    return "Hello,";
  }
  return `Hello ${name.trim()},`;
}

export function buildInviteEmailTemplate(input: InviteTemplateInput) {
  const subject = "Your EMC Workspace account is ready";
  const intro = `${greeting(input.recipientName)}

Your account has been created in EMC Workspace.`;
  const credentials = `Temporary password: ${input.temporaryPassword}`;
  const nextStep = `Sign in at: ${input.loginUrl}`;

  return {
    subject,
    textBody: `${intro}

${credentials}
${nextStep}

If you did not expect this message, contact your administrator.`,
    htmlBody: `
      <p>${greeting(input.recipientName)}</p>
      <p>Your account has been created in EMC Workspace.</p>
      <p><strong>Temporary password:</strong> ${input.temporaryPassword}</p>
      <p><strong>Sign in:</strong> <a href="${input.loginUrl}">${input.loginUrl}</a></p>
      <p>If you did not expect this message, contact your administrator.</p>
    `,
  };
}

export function buildPasswordEmailTemplate(input: PasswordTemplateInput) {
  const subject = input.customPasswordUsed
    ? "Your EMC Workspace password has been updated"
    : "Your EMC Workspace password was reset";
  const intro = `${greeting(input.recipientName)}

An administrator updated your EMC Workspace password.`;

  return {
    subject,
    textBody: `${intro}

New password: ${input.password}
Sign in at: ${input.loginUrl}

If this was not expected, contact your administrator immediately.`,
    htmlBody: `
      <p>${greeting(input.recipientName)}</p>
      <p>An administrator updated your EMC Workspace password.</p>
      <p><strong>New password:</strong> ${input.password}</p>
      <p><strong>Sign in:</strong> <a href="${input.loginUrl}">${input.loginUrl}</a></p>
      <p>If this was not expected, contact your administrator immediately.</p>
    `,
  };
}
