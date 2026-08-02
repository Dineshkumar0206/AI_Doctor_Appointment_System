import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Appointments": "Appointments",
      "Patients": "Patients",
      "Settings": "Settings",
      "Logout": "Logout",
      "Navigation": "Navigation",
      "Select an Appointment": "Select an Appointment",
      "Choose an appointment from the list to view details, clinical records, and manage the consultation.": "Choose an appointment from the list to view details, clinical records, and manage the consultation.",
      "Search patients, reasons...": "Search patients, reasons...",
      "All": "All",
      "Upcoming": "Upcoming",
      "Completed": "Completed",
      "Cancelled": "Cancelled",
      "Date": "Date",
      "Time": "Time",
      "Reason": "Reason",
      "General Notes": "General Notes",
      "Clinical Records": "Clinical Records",
      "Write consultation notes here...": "Write consultation notes here...",
      "Mark Completed": "Mark Completed",
      "Reschedule": "Reschedule",
      "Cancel Appointment": "Cancel Appointment",
      "Language": "Language",
      "English": "English",
      "Tamil": "Tamil",
      "Cancel": "Cancel",
      "Save": "Save",
      "Confirm Cancel": "Confirm Cancel",
      "Are you sure you want to cancel this appointment?": "Are you sure you want to cancel this appointment?"
    }
  },
  ta: {
    translation: {
      "Dashboard": "முகப்பு (Dashboard)",
      "Appointments": "நியமனங்கள் (Appointments)",
      "Patients": "நோயாளிகள் (Patients)",
      "Settings": "அமைப்புகள் (Settings)",
      "Logout": "வெளியேறு (Logout)",
      "Navigation": "வழிசெலுத்தல் (Navigation)",
      "Select an Appointment": "ஒரு நியமனத்தை தேர்ந்தெடுக்கவும்",
      "Choose an appointment from the list to view details, clinical records, and manage the consultation.": "விவரங்களை காண பட்டியலிலிருந்து ஒரு நியமனத்தை தேர்ந்தெடுக்கவும்.",
      "Search patients, reasons...": "நோயாளிகள், காரணங்களை தேட...",
      "All": "அனைத்தும்",
      "Upcoming": "வரவிருக்கும்",
      "Completed": "முடிந்தது",
      "Cancelled": "ரத்து செய்யப்பட்டது",
      "Date": "தேதி",
      "Time": "நேரம்",
      "Reason": "காரணம்",
      "General Notes": "பொது குறிப்புகள்",
      "Clinical Records": "மருத்துவ பதிவுகள்",
      "Write consultation notes here...": "ஆலோசனை குறிப்புகளை இங்கே எழுதவும்...",
      "Mark Completed": "முடிக்கப்பட்டதாக குறிக்கவும்",
      "Reschedule": "மறுதிட்டமிடு",
      "Cancel Appointment": "ரத்து செய்",
      "Language": "மொழி (Language)",
      "English": "ஆங்கிலம்",
      "Tamil": "தமிழ்",
      "Cancel": "ரத்து செய்",
      "Save": "சேமி",
      "Confirm Cancel": "ரத்து செய்ய உறுதிப்படுத்தவும்",
      "Are you sure you want to cancel this appointment?": "இந்த நியமனத்தை உறுதியாக ரத்து செய்ய வேண்டுமா?"
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "en", // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
