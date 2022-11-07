const isLocalDev = process.env.REACT_APP_LOCAL_DEV === 'true';
const awsRegion = process.env.REACT_APP_AWS_REGION;
const apiPath = process.env.REACT_APP_API_URL;
const websiteUrl = process.env.REACT_APP_WEBSITE_URL;
// websiteBaseName is used as a root path for the website
// for example, https://<domain name>/<websiteBaseName>/<component or web page>
const websiteBaseName = process.env.PUBLIC_URL;
const stage = process.env.REACT_APP_STAGE;
const region = process.env.REACT_APP_REGION;
const autoLogoutTimeoutInMinutes = process.env.REACT_APP_AUTO_LOGOUT_TIMEOUT_IN_MINUTES || 30;

const supportedLanguagesStr = process.env.REACT_APP_SUPPORTED_LANGUAGES;
const defaultLanguage = process.env.REACT_APP_DEFAULT_LANGUAGE;

const namespace = process.env.REACT_APP_NAMESPACE;

const branding = {
  login: {
    title: process.env.REACT_APP_BRAND_LOGIN_TITLE,
    subtitle: process.env.REACT_APP_BRAND_LOGIN_SUBTITLE,
  },
  main: {
    title: process.env.REACT_APP_BRAND_MAIN_TITLE,
  },
  page: {
    title: process.env.REACT_APP_BRAND_PAGE_TITLE,
  },
};

// If undefined, default to English. This helps in unit tests that may exist outside of a preference for language.
function getSupportedLanguages(): Record<string, string> {
  try {
    return JSON.parse(supportedLanguagesStr || '{"en":"en"}');
  } catch {
    console.warn(
      "No internationalization has been configured. Check the 'supportedLanguages' fields in the solution settings.",
    );
  }
  return { en: 'en' };
}

const supportedLanguages = getSupportedLanguages();

const isNullOrUndefined = (str: string | undefined) => str === 'null' || str === 'undefined';

const version = process.env.REACT_APP_VERSION;
const versionDisclaimerHeader = isNullOrUndefined(process.env.REACT_APP_VERSION_DISCLAIMER_HEADER)
  ? null
  : process.env.REACT_APP_VERSION_DISCLAIMER_HEADER;
const versionDisclaimerContent = isNullOrUndefined(process.env.REACT_APP_VERSION_DISCLAIMER_CONTENT)
  ? null
  : process.env.REACT_APP_VERSION_DISCLAIMER_CONTENT;

export {
  awsRegion,
  apiPath,
  isLocalDev,
  websiteUrl,
  websiteBaseName,
  stage,
  region,
  branding,
  autoLogoutTimeoutInMinutes,
  supportedLanguages,
  defaultLanguage,
  version,
  versionDisclaimerHeader,
  versionDisclaimerContent,
  namespace,
};
