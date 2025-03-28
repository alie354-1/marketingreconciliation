interface Template {
  headline_template: string;
  body_template: string;
  cta_template: string;
  variables: {
    required: string[];
  };
}

interface Variables {
  [key: string]: string | number;
}

export function generateCreative(template: Template, variables: Variables) {
  const creative = {
    headline: template.headline_template,
    body: template.body_template,
    cta: template.cta_template
  };

  // Validate required variables
  template.variables.required.forEach(variable => {
    if (!variables[variable]) {
      throw new Error(`Missing required variable: ${variable}`);
    }
  });

  // Replace variables in templates
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    creative.headline = creative.headline.replace(regex, String(value));
    creative.body = creative.body.replace(regex, String(value));
    creative.cta = creative.cta.replace(regex, String(value));
  });

  return creative;
}