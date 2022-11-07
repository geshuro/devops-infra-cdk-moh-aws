import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { configure } from 'mobx';
import i18n from 'roddeh-i18n';
import {
  renderError,
  renderProgress,
  websiteBaseName,
  initializeAppContext,
  supportedLanguages,
  defaultLanguage,
  ApplicationContext,
} from '@aws-ee/core-ui';

import pluginRegistry from './plugin-registry';
import 'toastr/build/toastr.css';
import 'react-table/react-table.css';
import App from './App';

const requireTranslationsIfExists = () => {
  try {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    return require('./i18n/translations.json');
    // eslint-disable-next-line no-empty
  } catch (err) {}
  return {};
};

// return 'ja' to test Japanese
const determineLanguage = () => navigator.language;

// Bootstrap the app
// Set language
const translations = requireTranslationsIfExists();

const language = supportedLanguages[determineLanguage()] || supportedLanguages[defaultLanguage!] || 'en';
if (!translations[language]) {
  i18n.translator.add(translations[language]);
} else {
  console.warn(`'No translation defined for language selected: ${language}`);
}

// Enable mobx strict mode, changes to state must be contained in actions
configure({ enforceActions: 'always' });

// Initialize appContext object registering various Mobx stores etc
const appContext = initializeAppContext(pluginRegistry);

// Render page loading message
renderProgress();

// Trigger the app startup sequence
(async () => {
  try {
    await appContext.appRunner.run();
    ReactDOM.render(
      <ApplicationContext.Provider value={appContext}>
        <BrowserRouter basename={websiteBaseName}>
          <App />
        </BrowserRouter>
      </ApplicationContext.Provider>,
      document.getElementById('root'),
    );
  } catch (err) {
    console.log(err);
    renderError(err as Error);
    try {
      appContext.cleaner.cleanup();
    } catch (error) {
      // ignore
      console.log(error);
    }
  }
})();
