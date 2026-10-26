import { useState, useRef, useEffect } from "react";
import "./App.css";
import heroImage from "./assets/ChatGPT Image Oct 2, 2026, 11_00_48 AM.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const getInitials = (name) => {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials.slice(0, 2) || "U";
};

const getStateMatch = (state, education, index) => {
  const stateScore = [...state].reduce((total, character) => total + character.charCodeAt(0), 0);
  const educationScore = [...education].reduce((total, character) => total + character.charCodeAt(0), 0);
  return 64 + ((stateScore + educationScore + index * 17) % 30);
};

const getSchemeLink = (state) => {
  const links = {
    "Andhra Pradesh": "https://jnanabhumi.ap.gov.in",
    Telangana: "https://telanganaepass.cgg.gov.in",
    "Tamil Nadu": "https://www.tnesevai.tn.gov.in",
    Karnataka: "https://ssp.postmatric.karnataka.gov.in",
    Maharashtra: "https://mahadbt.maharashtra.gov.in",
    "Uttar Pradesh": "https://scholarship.up.gov.in",
    Delhi: "https://edistrict.delhigovt.nic.in",
    "West Bengal": "https://oasis.wb.gov.in",
  };
  return links[state] || "https://scholarships.gov.in";
};

const safeJsonParse = async (response) => {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const stateLabels = {
  English: {},
  Telugu: {
    "Andaman and Nicobar Islands": "అండమాన్ మరియు నికోబార్ దీవులు",
    "Andhra Pradesh": "ఆంధ్రప్రదేశ్",
    "Arunachal Pradesh": "అరుణాచల్ ప్రదేశ్",
    "Assam": "అస్సాం",
    "Bihar": "బీహార్",
    "Chandigarh": "చండీగఢ్",
    "Chhattisgarh": "ఛత్తీస్‌గఢ్",
    "Dadra and Nagar Haveli and Daman and Diu": "దాద్రా మరియు నగర్ హవేలీ మరియు డామన్ మరియు డయ్యూ",
    "Delhi": "ఢిల్లీ",
    "Goa": "గోవా",
    "Gujarat": "గుజరాత్",
    "Haryana": "హర్యానా",
    "Himachal Pradesh": "హిమాచల్ ప్రదేశ్",
    "Jammu and Kashmir": "జమ్మూ మరియు కాశ్మీర్",
    "Jharkhand": "జార్ఖండ్",
    "Karnataka": "కర్ణాటక",
    "Kerala": "కేరళ",
    "Ladakh": "లడఖ్",
    "Lakshadweep": "లక్షద్వీప్",
    "Madhya Pradesh": "మధ్యప్రదేశ్",
    "Maharashtra": "మహారాష్ట్ర",
    "Manipur": "మణిపూర్",
    "Meghalaya": "మేఘాలయ",
    "Mizoram": "మిజోరం",
    "Nagaland": "నాగాలాండ్",
    "Odisha": "ఒడిశా",
    "Puducherry": "పుదుచ్చేరి",
    "Punjab": "పంజాబ్",
    "Rajasthan": "రాజస్థాన్",
    "Sikkim": "సిక్కిం",
    "Tamil Nadu": "తమిళనాడు",
    "Telangana": "తెలంగాణ",
    "Tripura": "త్రిపుర",
    "Uttar Pradesh": "ఉత్తర ప్రదేశ్",
    "Uttarakhand": "ఉత్తరాఖండ్",
    "West Bengal": "పశ్చిమ బెంగాల్",
  },
  Hindi: {
    "Andaman and Nicobar Islands": "अंडमान और निकोबार द्वीप समूह",
    "Andhra Pradesh": "आंध्र प्रदेश",
    "Arunachal Pradesh": "अरुणाचल प्रदेश",
    "Assam": "असम",
    "Bihar": "बिहार",
    "Chandigarh": "चंडीगढ़",
    "Chhattisgarh": "छत्तीसगढ़",
    "Dadra and Nagar Haveli and Daman and Diu": "दादरा और नगर हवेली और दमन और दीव",
    "Delhi": "दिल्ली",
    "Goa": "गोवा",
    "Gujarat": "गुजरात",
    "Haryana": "हरियाणा",
    "Himachal Pradesh": "हिमाचल प्रदेश",
    "Jammu and Kashmir": "जम्मू और कश्मीर",
    "Jharkhand": "झारखंड",
    "Karnataka": "कर्नाटक",
    "Kerala": "केरल",
    "Ladakh": "लद्दाख",
    "Lakshadweep": "लक्षद्वीप",
    "Madhya Pradesh": "मध्य प्रदेश",
    "Maharashtra": "महाराष्ट्र",
    "Manipur": "मणिपुर",
    "Meghalaya": "मेघालय",
    "Mizoram": "मिज़ोरम",
    "Nagaland": "नागालैंड",
    "Odisha": "ओडिशा",
    "Puducherry": "पुडुचेरी",
    "Punjab": "पंजाब",
    "Rajasthan": "राजस्थान",
    "Sikkim": "सिक्किम",
    "Tamil Nadu": "तमिलनाडु",
    "Telangana": "तेलंगाना",
    "Tripura": "त्रिपुरा",
    "Uttar Pradesh": "उत्तर प्रदेश",
    "Uttarakhand": "उत्तराखंड",
    "West Bengal": "पश्चिम बंगाल",
  },
  Tamil: {
    "Andaman and Nicobar Islands": "அந்தமான் நிக்கோபார் தீவுகள்",
    "Andhra Pradesh": "ஆந்திரப் பிரதேசம்",
    "Arunachal Pradesh": "அருணாச்சலப் பிரதேசம்",
    "Assam": "அசாம்",
    "Bihar": "பீகார்",
    "Chandigarh": "சண்டிகர்",
    "Chhattisgarh": "சத்தீஸ்கர்",
    "Dadra and Nagar Haveli and Daman and Diu": "தாத்ரா மற்றும் நகர் ஹவேலி மற்றும் தாமன் மற்றும் தியூ",
    "Delhi": "டெல்லி",
    "Goa": "கோவா",
    "Gujarat": "குஜராத்",
    "Haryana": "ஹரியானா",
    "Himachal Pradesh": "இமாச்சலப் பிரதேசம்",
    "Jammu and Kashmir": "ஜம்மு காஷ்மீர்",
    "Jharkhand": "ஜார்கண்ட்",
    "Karnataka": "கர்நாடகா",
    "Kerala": "கேரளா",
    "Ladakh": "லடாக்",
    "Lakshadweep": "லட்சத்தீவு",
    "Madhya Pradesh": "மத்தியப் பிரதேசம்",
    "Maharashtra": "மகாராஷ்டிரா",
    "Manipur": "மணிப்பூர்",
    "Meghalaya": "மேகாலயா",
    "Mizoram": "மிசோரம்",
    "Nagaland": "நாகாலாந்து",
    "Odisha": "ஒடிசா",
    "Puducherry": "புதுச்சேரி",
    "Punjab": "பஞ்சாப்",
    "Rajasthan": "ராஜஸ்தான்",
    "Sikkim": "சிக்கிம்",
    "Tamil Nadu": "தமிழ்நாடு",
    "Telangana": "தெலுங்கானா",
    "Tripura": "திரிபுரா",
    "Uttar Pradesh": "உத்தரப் பிரதேசம்",
    "Uttarakhand": "உத்தரகாண்ட்",
    "West Bengal": "மேற்கு வங்காளம்",
  },
};

const educationLabels = {
  English: {
    "B.Tech": "B.Tech",
    "Postgraduate": "Postgraduate",
    Intermediate: "Intermediate",
  },
  Telugu: {
    "B.Tech": "బి.టెక్ (B.Tech)",
    "Postgraduate": "పోస్ట్ గ్రాడ్యుయేట్",
    Intermediate: "ఇంటర్మీడియట్ (Intermediate)",
  },
  Hindi: {
    "B.Tech": "बी.टेक (B.Tech)",
    "Postgraduate": "स्नातकोत्तर (Postgraduate)",
    Intermediate: "इंटरमीडिएट (Intermediate)",
  },
  Tamil: {
    "B.Tech": "பி.டெக் (B.Tech)",
    "Postgraduate": "முதுகலை (Postgraduate)",
    Intermediate: "இடைநிலை (Intermediate)",
  },
};

const categoryLabels = {
  English: {
    General: "General",
    OBC: "OBC",
    SC: "SC",
    ST: "ST",
  },
  Telugu: {
    General: "జనరల్ (General)",
    OBC: "ఓబీసీ (OBC)",
    SC: "ఎస్సీ (SC)",
    ST: "ఎస్టీ (ST)",
  },
  Hindi: {
    General: "सामान्य (General)",
    OBC: "ओबीसी (OBC)",
    SC: "एससी (SC)",
    ST: "एसटी (ST)",
  },
  Tamil: {
    General: "பொது (General)",
    OBC: "ஓபிசி (OBC)",
    SC: "எஸ்சி (SC)",
    ST: "எஸ்டி (ST)",
  },
};

const getLocalizedState = (state, lang) =>
  (stateLabels[lang] && stateLabels[lang][state]) || state;
const getLocalizedEducation = (edu, lang) =>
  (educationLabels[lang] && educationLabels[lang][edu]) || edu;
const getLocalizedCategory = (cat, lang) =>
  (categoryLabels[lang] && categoryLabels[lang][cat]) || cat;

const localizedSchemes = {
  English: {
    "B.Tech": [
      ["Post-Matric Scholarship", "Education", "For students pursuing higher education after Class 10.", "National Scholarship Portal", "92%"],
      ["PM YASASVI Scholarship", "Merit-based", "Support for bright students from selected communities.", "Ministry of Social Justice", "78%"],
      ["State Professional Course Support", "State Support", "Fee support opportunities for eligible B.Tech students in {state}.", "{state} Government", "86%"],
    ],
    Undergraduate: [
      ["Central Sector Scholarship", "Higher education", "Financial support for meritorious undergraduate students.", "Ministry of Education", "88%"],
      ["Post-Matric Scholarship", "Education", "Support for students continuing education after Class 10.", "National Scholarship Portal", "82%"],
      ["State Undergraduate Support", "State Support", "Education assistance for eligible students in {state}.", "{state} Government", "79%"],
    ],
    Postgraduate: [
      ["PG Indira Gandhi Scholarship", "Postgraduate", "Support for students pursuing postgraduate studies.", "UGC", "90%"],
      ["National Fellowship Scheme", "Research", "Financial assistance for higher education and research.", "Government of India", "76%"],
      ["State Higher Education Grant", "State Support", "Higher education grants for eligible students in {state}.", "{state} Government", "74%"],
    ],
    Intermediate: [
      ["Pre-Matric Scholarship", "School education", "Support for students studying in Classes 9 and 10.", "National Scholarship Portal", "91%"],
      ["INSPIRE Scholarship", "Science education", "Encourages students to pursue science and research careers.", "Department of Science and Technology", "75%"],
      ["State School Support", "State Support", "Education support for eligible school students in {state}.", "{state} Government", "81%"],
    ],
    Diploma: [
      ["Post-Matric Scholarship", "Technical education", "Support for eligible students pursuing diploma and technical education.", "National Scholarship Portal", "87%"],
      ["Technical Education Fee Support", "Education", "Fee assistance opportunities for eligible diploma students in {state}.", "{state} Government", "80%"],
      ["Skill Development Scholarship", "Skill development", "Financial support for students building technical and vocational skills.", "Government of India", "76%"],
    ],
    additional: [
      ["Women Student Support", "State Support", "Additional education support for eligible students in {state}.", "{state} Government"],
      ["Digital Learning Grant", "Digital India", "Assistance for learning resources and digital access in {state}.", "Digital India"],
      ["Student Travel Support", "Travel Assistance", "Travel assistance opportunities for eligible students in {state}.", "{state} Government"],
    ],
  },
  Telugu: {
    "B.Tech": [
      ["పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్", "విద్య", "10వ తరగతి తర్వాత ఉన్నత విద్యను అభ్యసిస్తున్న విద్యార్థులకు ఆర్థిక సహాయం.", "నేషనల్ స్కాలర్‌షిప్ పోర్టల్", "92%"],
      ["పిఎం యశస్వి స్కాలర్‌షిప్", "మెరిట్ ఆధారిత", "ఎంపిక చేసిన వర్గాల ప్రతిభావంతులైన విద్యార్థులకు ప్రభుత్వ మద్దతు.", "సామాజిక న్యాయ మంత్రిత్వ శాఖ", "78%"],
      ["వృత్తి విద్యా కోర్సుల సహాయం", "రాష్ట్ర మద్దతు", "{state} లోని అర్హులైన బి.టెక్ విద్యార్థులకు ఫీజు సహాయ అవకాశాలు.", "{state} ప్రభుత్వం", "86%"],
    ],
    Undergraduate: [
      ["సెంట్రల్ సెక్టార్ స్కాలర్‌షిప్", "ఉన్నత విద్య", "ప్రతిభావంతులైన అండర్ గ్రాడ్యుయేట్ విద్యార్థులకు ఆర్థిక సహాయం.", "విద్యా మంత్రిత్వ శాఖ", "88%"],
      ["పోస్ట్-మెట్రిక్ స్కాలర్‌షిప్", "విద్య", "10వ తరగతి తర్వాత విద్యను కొనసాగించే విద్యార్థులకు సహాయం.", "నేషనల్ స్కాలర్‌షిప్ పోర్టల్", "82%"],
      ["రాష్ట్ర అండర్ గ్రాడ్యుయేట్ మద్దతు", "రాష్ట్ర మద్దతు", "{state} లోని అర్హులైన విద్యార్థులకు విద్యా సహాయం.", "{state} ప్రభుత్వం", "79%"],
    ],
    Postgraduate: [
      ["పీజీ ఇందిరా గాంధీ స్కాలర్‌షిప్", "పోస్ట్ గ్రాడ్యుయేట్", "పోస్ట్ గ్రాడ్యుయేషన్ చదువుతున్న విద్యార్థులకు మద్దతు.", "యూజీసీ", "90%"],
      ["నేషనల్ ఫెలోషిప్ స్కీమ్", "పరిశోధన", "ఉన్నత విద్య మరియు పరిశోధనల కోసం ఆర్థిక సహాయం.", "భారత ప్రభుత్వం", "76%"],
      ["రాష్ట్ర ఉన్నత విద్యా గ్రాంట్", "రాష్ట్ర మద్దతు", "{state} లోని అర్హులైన విద్యార్థులకు ఉన్నత విద్యా గ్రాంట్లు.", "{state} ప్రభుత్వం", "74%"],
    ],
    Intermediate: [
      ["ప్రీ-మెట్రిక్ స్కాలర్‌షిప్", "పాఠశాల విద్య", "9 మరియు 10 తరగతుల్లో చదువుతున్న విద్యార్థులకు మద్దతు.", "నేషనల్ స్కాలర్‌షిప్ పోర్టల్", "91%"],
      ["ఇన్‌స్పైర్ (INSPIRE) స్కాలర్‌షిప్", "సైన్స్ విద్య", "సైన్స్ మరియు పరిశోధన కెరీర్‌లను ప్రోత్సహించే స్కాలర్‌షిప్.", "సైన్స్ అండ్ టెక్నాలజీ విభాగం", "75%"],
      ["రాష్ట్ర పాఠశాల విద్యార్థి మద్దతు", "రాష్ట్ర మద్దతు", "{state} లోని అర్హులైన పాఠశాల విద్యార్థులకు విద్యా సహాయం.", "{state} ప్రభుత్వం", "81%"],
    ],
    additional: [
      ["మహిళా విద్యార్థి ప్రోత్సాహక పథకం", "రాష్ట్ర మద్దతు", "{state} లోని అర్హులైన విద్యార్థినులకు ప్రత్యేక విద్యా మద్దతు.", "{state} ప్రభుత్వం"],
      ["డిజిటల్ లెర్నింగ్ గ్రాంట్", "డిజిటల్ ఇండియా", "{state} లో లెర్నింగ్ వనరులు మరియు డిజిటల్ పరికరాల సహాయం.", "డిజిటల్ ఇండియా"],
      ["విద్యార్థి ప్రయాణ రాయితీ పథకం", "ప్రయాణ సహాయం", "{state} లోని అర్హులైన విద్యార్థులకు ప్రయాణ సహాయ అవకాశాలు.", "{state} ప్రభుత్వం"],
    ],
  },
  Hindi: {
    "B.Tech": [
      ["पोस्ट-मैट्रिक छात्रवृत्ति", "शिक्षा", "10वीं कक्षा के बाद उच्च शिक्षा प्राप्त करने वाले छात्रों के लिए वित्तीय सहायता।", "राष्ट्रीय छात्रवृत्ति पोर्टल", "92%"],
      ["पीएम यशस्वी छात्रवृत्ति", "मेधावी सहायता", "चयनित समुदायों के मेधावी छात्रों के लिए सरकारी सहायता।", "सामाजिक न्याय मंत्रालय", "78%"],
      ["व्यावसायिक पाठ्यक्रम सहायता", "राज्य सहायता", "{state} के पात्र बी.टेक छात्रों के लिए शुल्क सहायता अवसर।", "{state} सरकार", "86%"],
    ],
    Undergraduate: [
      ["केंद्रीय क्षेत्र छात्रवृत्ति", "उच्च शिक्षा", "मेधावी स्नातक छात्रों के लिए वित्तीय सहायता।", "शिक्षा मंत्रालय", "88%"],
      ["पोस्ट-मैट्रिक छात्रवृत्ति", "शिक्षा", "10वीं के बाद पढ़ाई जारी रखने वाले छात्रों के लिए सहायता।", "राष्ट्रीय छात्रवृत्ति पोर्टल", "82%"],
      ["राज्य स्नातक शिक्षा सहायता", "राज्य सहायता", "{state} में पात्र छात्रों के लिए शिक्षा सहायता।", "{state} सरकार", "79%"],
    ],
    Postgraduate: [
      ["पीजी इंदिरा गांधी छात्रवृत्ति", "स्नातकोत्तर", "स्नातकोत्तर की पढ़ाई करने वाले छात्रों के लिए सहायता।", "यूजीसी", "90%"],
      ["राष्ट्रीय फेलोशिप योजना", "शोध", "उच्च शिक्षा और अनुसंधान के लिए वित्तीय सहायता।", "भारत सरकार", "76%"],
      ["राज्य उच्च शिक्षा अनुदान", "राज्य सहायता", "{state} में पात्र छात्रों के लिए उच्च शिक्षा अनुदान।", "{state} सरकार", "74%"],
    ],
    Intermediate: [
      ["प्री-मैट्रिक छात्रवृत्ति", "स्कूली शिक्षा", "कक्षा 9 और 10 में पढ़ने वाले छात्रों के लिए सहायता।", "राष्ट्रीय छात्रवृत्ति पोर्टल", "91%"],
      ["इंस्पायर (INSPIRE) छात्रवृत्ति", "विज्ञान शिक्षा", "विज्ञान और अनुसंधान करियर को बढ़ावा देने हेतु सहायता।", "विज्ञान एवं प्रौद्योगिकी विभाग", "75%"],
      ["राज्य स्कूली सहायता योजना", "राज्य सहायता", "{state} में पात्र स्कूली छात्रों के लिए शिक्षा सहायता।", "{state} सरकार", "81%"],
    ],
    additional: [
      ["महिला छात्र प्रोत्साहन योजना", "राज्य सहायता", "{state} में पात्र छात्राओं के लिए अतिरिक्त शिक्षा सहायता।", "{state} सरकार"],
      ["डिजिटल लर्निंग अनुदान", "डिजिटल इंडिया", "{state} में अध्ययन सामग्री और डिजिटल पहुंच के लिए सहायता।", "डिजिटल इंडिया"],
      ["छात्र यात्रा सहायता योजना", "यात्रा सहायता", "{state} में पात्र छात्रों के लिए रियायती यात्रा सहायता।", "{state} सरकार"],
    ],
  },
  Tamil: {
    "B.Tech": [
      ["போஸ்ட்-மெட்ரிக் கல்வி உதவித்தொகை", "கல்வி", "10 ஆம் வகுப்புக்குப் பிறகு உயர்கல்வி பயிலும் மாணவர்களுக்கான நிதி உதவி.", "தேசிய கல்வி உதவித்தொகை போர்டல்", "92%"],
      ["பிஎம் யசஸ்வி உதவித்தொகை", "தகுதி அடிப்படையிலானது", "தேர்ந்தெடுக்கப்பட்ட சமூகங்களைச் சேர்ந்த சிறந்த மாணவர்களுக்கான ஆதரவு.", "சமூக நீதி அமைச்சகம்", "78%"],
      ["தொழில்முறை படிப்பு ஆதரவு", "மாநில ஆதரவு", "{state} இல் உள்ள தகுதியுடைய பி.டெக் மாணவர்களுக்கான கட்டண ஆதரவு.", "{state} அரசு", "86%"],
    ],
    Undergraduate: [
      ["மத்திய துறை உதவித்தொகை", "உயர்கல்வி", "திறமையான இளங்கலை மாணவர்களுக்கான நிதி உதவி.", "கல்வி அமைச்சகம்", "88%"],
      ["போஸ்ட்-மெட்ரிக் கல்வி உதவித்தொகை", "கல்வி", "10 ஆம் வகுப்புக்குப் பிறகு படிப்பைத் தொடரும் மாணவர்களுக்கான உதவி.", "தேசிய கல்வி உதவித்தொகை போர்டல்", "82%"],
      ["மாநில இளங்கலை கல்வி ஆதரவு", "மாநில ஆதரவு", "{state} இல் உள்ள தகுதியுடைய மாணவர்களுக்கான கல்வி உதவி.", "{state} அரசு", "79%"],
    ],
    Postgraduate: [
      ["பிஜி இந்திரா காந்தி உதவித்தொகை", "முதுகலை", "முதுகலை படிக்கும் மாணவர்களுக்கான ஆதரவு.", "யுஜிசி", "90%"],
      ["தேசிய ஆய்வு உதவித்தொகைத் திட்டம்", "ஆராய்ச்சி", "உயர்கல்வி மற்றும் ஆராய்ச்சிக்கான நிதி உதவி.", "இந்திய அரசு", "76%"],
      ["மாநில உயர்கல்வி மானியம்", "மாநில ஆதரவு", "{state} இல் உள்ள தகுதியுடைய மாணவர்களுக்கான உயர்கல்வி மானியங்கள்.", "{state} அரசு", "74%"],
    ],
    Intermediate: [
      ["ப்ரீ-மெட்ரிக் கல்வி உதவித்தொகை", "பள்ளிக் கல்வி", "9 மற்றும் 10 ஆம் வகுப்புகளில் படிக்கும் மாணவர்களுக்கான ஆதரவு.", "தேசிய கல்வி உதவித்தொகை போர்டல்", "91%"],
      ["இன்ஸ்பயர் (INSPIRE) உதவித்தொகை", "அறிவியல் கல்வி", "அறிவியல் மற்றும் ஆராய்ச்சி படிப்பை ஊக்குவிக்கும் உதவித்தொகை.", "அறிவியல் மற்றும் தொழில்நுட்பத் துறை", "75%"],
      ["மாநில பள்ளி மாணவர் ஆதரவு", "மாநில ஆதரவு", "{state} இல் உள்ள தகுதியுடைய பள்ளி மாணவர்களுக்கான கல்வி உதவி.", "{state} அரசு", "81%"],
    ],
    additional: [
      ["மகளிர் மாணவர் ஆதரவுத் திட்டம்", "மாநில ஆதரவு", "{state} இல் உள்ள தகுதியுடைய மாணவிகளுக்கான சிறப்பு கல்வி ஆதரவு.", "{state} அரசு"],
      ["டிஜிட்டல் கற்றல் மானியம்", "டிஜிட்டல் இந்தியா", "{state} இல் கற்றல் வளங்கள் மற்றும் டிஜிட்டல் அணுகலுக்கான உதவி.", "டிஜிட்டல் இந்தியா"],
      ["மாணவர் பயண உதவித் திட்டம்", "பயண உதவி", "{state} இல் உள்ள தகுதியுடைய மாணவர்களுக்கான பயண உதவி.", "{state} அரசு"],
    ],
  },
};

const translations = {
  English: {
    welcome: "WELCOME TO GOVAI",
    signIn: "Sign in to your account",
    create: "Sign up for your account",
    continue: "Continue your journey to better benefits.",
    save: "Save your profile and find support made for you.",
    name: "Full name",
    email: "Email address",
    password: "Password",
    remember: "Remember me",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInButton: "Sign in",
    createButton: "Sign up",
    newUser: "New to GovAI?",
    existingUser: "Already have an account?",
    createLink: "Sign up",
    signInLink: "Login",
    accountCreated: "Account created. Sign in to continue.",
    navAsk: "Ask GovAI",
    navEligibility: "My Eligibility",
    navSaved: "Saved Schemes",
    personalized: "PERSONALIZED ASSISTANCE",
    greeting: "Good morning",
    tagline: "Find the government support you are entitled to.",
    conversation: "CONVERSATION",
    ask: "How can I help you today?",
    clear: "Clear chat",
    intro:
      "Namaste! Ask about scholarships, fee support, fellowships, and other education benefits.",
    placeholder: "Ask in English, Telugu, Hindi, Tamil...",
    profile: "YOUR PROFILE",
    personalize: "Personalize your results",
    update: "Update my profile",
    logout: "Logout",
    sidebarKicker: "Your civic intelligence layer",
    needHelp: "Need help?",
    talkSupport: "Talk to our support team",
    kbUpdated: "Knowledge base updated",
    today: "today",
    suggestScholarship: "What scholarships are available for students?",
    suggestFeeSupport: "How can I apply for fee reimbursement?",
    suggestScholarshipQuery: "What scholarships are available for students?",
    suggestFeeSupportQuery: "How can I apply for fee reimbursement?",
    checkingBackend: "GovAI is checking the backend...",
    backendOffline: "The backend is not running yet. Start CapstoneServer.java in Eclipse and try again.",
    educationLevel: "Education level",
    stateUT: "State / Union Territory",
    socialCategory: "Social category",
    familyIncome: "Annual family income",
    optional: "Optional",
    incomePlaceholder: "e.g. Rs 3,00,000",
    basedOnProfile: "BASED ON YOUR PROFILE AND STATE",
    potentialSchemesIn: "Potential schemes in",
    resultsCount: "results",
    viewAllSchemes: "View all schemes",
    showFewerSchemes: "Show fewer schemes",
    match: "match",
    source: "Source",
    schemeDetails: "SCHEME DETAILS",
    likelyEligibility: "Likely eligibility",
    potentialBenefit: "Potential benefit",
    documents: "Documents",
    officialSource: "Official source",
    tuitionBenefit: "Tuition or education support",
    docProof: "Identity, income, education proof",
    eligibilityProfile: "Your eligibility profile",
    savedSchemesTitle: "Your saved schemes",
    eligibilityDesc: "Keep your details current to improve every recommendation.",
    savedSchemesDesc: "Schemes you save will appear here for quick access.",
    returnAsk: "Return to Ask GovAI",
    exploreMoreSchemes: "Explore more schemes",
    noSavedSchemes: "You haven't saved any schemes yet. Browse schemes in Ask GovAI and click the heart icon on any card to save it for quick reference.",
    footerNotice: "GovAI uses official government sources wherever available.",
    footerLinks: "Privacy · Accessibility · About",
    availableForEligible: "Available for eligible applicants in {state}.",
    notifications: "Notifications",
    voiceInput: "Voice input",
    sendQuestion: "Send question",
    closeDetails: "Close scheme details",
    saveScheme: "Save scheme",
    removeSaved: "Remove from saved",
    emailNotAvailable: "Email not available",
    studentsIn: "students in",
    stateLabel: "State",
    categoryLabel: "Category",
    incomeLabel: "Annual Family Income",
    notSpecified: "Not specified",
  },
  Telugu: {
    welcome: "గోవైకి స్వాగతం",
    signIn: "మీ ఖాతాలోకి సైన్ ఇన్ చేయండి",
    create: "మీ ఖాతాను సృష్టించండి",
    continue: "మెరుగైన ప్రయోజనాల కోసం మీ ప్రయాణాన్ని కొనసాగించండి.",
    save: "మీ ప్రొఫైల్‌ను సేవ్ చేసి, మీకు సరైన సహాయాన్ని పొందండి.",
    name: "పూర్తి పేరు",
    email: "ఈమెయిల్ చిరునామా",
    password: "పాస్‌వర్డ్",
    remember: "నన్ను గుర్తుంచుకోండి",
    showPassword: "పాస్‌వర్డ్ చూపించండి",
    hidePassword: "పాస్‌వర్డ్ దాచండి",
    signInButton: "సైన్ ఇన్",
    createButton: "ఖాతా సృష్టించండి",
    newUser: "గోవైకి కొత్తవారా?",
    existingUser: "ఇప్పటికే ఖాతా ఉందా?",
    createLink: "ఖాతాను సృష్టించండి",
    signInLink: "బదులుగా సైన్ ఇన్ చేయండి",
    accountCreated: "ఖాతా సృష్టించబడింది. కొనసాగడానికి సైన్ ఇన్ చేయండి.",
    navAsk: "గోవైని అడగండి",
    navEligibility: "నా అర్హత",
    navSaved: "సేవ్ చేసిన పథకాలు",
    personalized: "వ్యక్తిగత సహాయం",
    greeting: "శుభోదయం",
    tagline: "మీకు లభించే ప్రభుత్వ సహాయాన్ని కనుగొనండి.",
    conversation: "సంభాషణ",
    ask: "ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
    clear: "చాట్ తొలగించండి",
    intro:
      "నమస్కారం! స్కాలర్‌షిప్‌లు, ఫీజు సహాయం, ఫెలోషిప్‌లు మరియు ఇతర విద్యా ప్రయోజనాల గురించి అడగండి.",
    placeholder: "ఇంగ్లీష్, తెలుగు, హిందీ, తమిళంలో అడగండి...",
    profile: "మీ ప్రొఫైల్",
    personalize: "మీ ఫలితాలను వ్యక్తిగతీకరించండి",
    update: "నా ప్రొఫైల్‌ను నవీకరించండి",
    logout: "లాగ్ అవుట్",
    sidebarKicker: "మీ ప్రభుత్వ పథకాల మార్గదర్శి",
    needHelp: "సహాయం కావాలా?",
    talkSupport: "మా మద్దతు బృందంతో మాట్లాడండి",
    kbUpdated: "సమాచార డేటాబేస్ నవీకరించబడింది",
    today: "నేడు",
    suggestScholarship: "విద్యార్థుల కోసం ఏ స్కాలర్‌షిప్‌లు అందుబాటులో ఉన్నాయి?",
    suggestFeeSupport: "ఫీజు రీయింబర్స్‌మెంట్ కోసం ఎలా దరఖాస్తు చేయాలి?",
    suggestScholarshipQuery: "విద్యార్థుల కోసం ఏ స్కాలర్‌షిప్‌లు అందుబాటులో ఉన్నాయి?",
    suggestFeeSupportQuery: "ఫీజు రీయింబర్స్‌మెంట్ కోసం ఎలా దరఖాస్తు చేయాలి?",
    checkingBackend: "GovAI సమాధానాన్ని సిద్ధం చేస్తోంది...",
    backendOffline: "బ్యాకెండ్ ఇంకా ప్రారంభం కాలేదు. Eclipse లో CapstoneServer.java ని ప్రారంభించండి.",
    educationLevel: "విద్యార్హత",
    stateUT: "రాష్ట్రం / కేంద్రపాలిత ప్రాంతం",
    socialCategory: "సామాజిక వర్గం",
    familyIncome: "వార్షిక కుటుంబ ఆదాయం",
    optional: "ఐచ్ఛికం",
    incomePlaceholder: "ఉదా: ₹3,00,000",
    basedOnProfile: "మీ ప్రొఫైల్ మరియు రాష్ట్రం ఆధారంగా",
    potentialSchemesIn: "అందుబాటులో ఉన్న పథకాలు -",
    resultsCount: "ఫలితాలు",
    viewAllSchemes: "అన్ని పథకాలను వీక్షించండి",
    showFewerSchemes: "తక్కువ పథకాలను చూపించు",
    match: "సరిపోలిక",
    source: "మూలం",
    schemeDetails: "పథకం వివరాలు",
    likelyEligibility: "అర్హత ప్రమాణాలు",
    potentialBenefit: "లభించే ప్రయోజనం",
    documents: "అవసరమైన పత్రాలు",
    officialSource: "అధికారిక మూలం",
    tuitionBenefit: "ట్యూషన్ ఫీజు లేదా విద్యా సహాయం",
    docProof: "గుర్తింపు, ఆదాయం, విద్యా ధృవీకరణ పత్రాలు",
    eligibilityProfile: "మీ అర్హత ప్రొఫైల్",
    savedSchemesTitle: "మీరు సేవ్ చేసిన పథకాలు",
    eligibilityDesc: "మరింత ఖచ్చితమైన సిఫార్సుల కోసం మీ వివరాలను ఎప్పటికప్పుడు సరిచూసుకోండి.",
    savedSchemesDesc: "మీరు సేవ్ చేసిన పథకాలు త్వరిత పరిశీలన కోసం ఇక్కడ కనిపిస్తాయి.",
    returnAsk: "గోవై చాట్‌కి తిరిగి వెళ్లండి",
    exploreMoreSchemes: "మరిన్ని పథకాలను అన్వేషించండి",
    noSavedSchemes: "మీరు ఇంకా ఏ పథకాన్నీ సేవ్ చేయలేదు. గోవై చాట్‌లో పథకాలను పరిశీలించి, కార్డ్‌పై ఉన్న హార్ట్ ఐకాన్ క్లిక్ చేసి సేవ్ చేయండి.",
    footerNotice: "గోవై అధికారిక ప్రభుత్వ సమాచారాన్ని మాత్రమే ఉపయోగిస్తుంది.",
    footerLinks: "గోప్యత · ప్రాప్యత · గురించి",
    availableForEligible: "{state} లోని అర్హులైన దరఖాస్తుదారులకు అందుబాటులో ఉంది.",
    notifications: "నోటిఫికేషన్లు",
    voiceInput: "వాయిస్ ఇన్‌పుట్",
    sendQuestion: "ప్రశ్న పంపండి",
    closeDetails: "వివరాలను మూసివేయండి",
    saveScheme: "పథకాన్ని సేవ్ చేయండి",
    removeSaved: "సేవ్ చేసిన వాటి నుండి తొలగించు",
    emailNotAvailable: "ఈమెయిల్ అందుబాటులో లేదు",
    studentsIn: "విద్యార్థులు -",
    stateLabel: "రాష్ట్రం",
    categoryLabel: "వర్గం",
    incomeLabel: "వార్షిక కుటుంబ ఆదాయం",
    notSpecified: "పేర్కొనబడలేదు",
  },
  Hindi: {
    welcome: "गोवएआई में आपका स्वागत है",
    signIn: "अपने खाते में साइन इन करें",
    create: "अपना खाता बनाएं",
    continue: "बेहतर लाभों के लिए अपनी यात्रा जारी रखें।",
    save: "अपनी प्रोफ़ाइल सहेजें और अपने लिए सही सहायता पाएं।",
    name: "पूरा नाम",
    email: "ईमेल पता",
    password: "पासवर्ड",
    remember: "मुझे याद रखें",
    showPassword: "पासवर्ड दिखाएं",
    hidePassword: "पासवर्ड छिपाएं",
    signInButton: "साइन इन",
    createButton: "खाता बनाएं",
    newUser: "GovAI पर नए हैं?",
    existingUser: "पहले से खाता है?",
    createLink: "खाता बनाएं",
    signInLink: "इसके बजाय साइन इन करें",
    accountCreated: "खाता बन गया। जारी रखने के लिए साइन इन करें।",
    navAsk: "GovAI से पूछें",
    navEligibility: "मेरी पात्रता",
    navSaved: "सहेजी गई योजनाएं",
    personalized: "व्यक्तिगत सहायता",
    greeting: "सुप्रभात",
    tagline: "अपने लिए उपलब्ध सरकारी सहायता खोजें।",
    conversation: "बातचीत",
    ask: "आज मैं आपकी कैसे मदद कर सकता हूं?",
    clear: "चैट साफ़ करें",
    intro:
      "नमस्ते! छात्रवृत्ति, शुल्क सहायता, फेलोशिप और अन्य शिक्षा लाभों के बारे में पूछें।",
    placeholder: "अंग्रेज़ी, तेलुगु, हिंदी, तमिल में पूछें...",
    profile: "आपकी प्रोफ़ाइल",
    personalize: "अपने परिणामों को व्यक्तिगत बनाएं",
    update: "मेरी प्रोफ़ाइल अपडेट करें",
    logout: "लॉग आउट",
    sidebarKicker: "आपकी सरकारी योजना मार्गदर्शिका",
    needHelp: "मदद चाहिए?",
    talkSupport: "हमारी सहायता टीम से बात करें",
    kbUpdated: "ज्ञानकोष अपडेट किया गया",
    today: "आज",
    suggestScholarship: "छात्रों के लिए कौन सी छात्रवृत्तियां उपलब्ध हैं?",
    suggestFeeSupport: "फीस प्रतिपूर्ति के लिए आवेदन कैसे करें?",
    suggestScholarshipQuery: "छात्रों के लिए कौन सी छात्रवृत्तियां उपलब्ध हैं?",
    suggestFeeSupportQuery: "फीस प्रतिपूर्ति के लिए आवेदन कैसे करें?",
    checkingBackend: "GovAI उत्तर तैयार कर रहा है...",
    backendOffline: "बैकएंड अभी चालू नहीं है। Eclipse में CapstoneServer.java शुरू करें।",
    educationLevel: "शिक्षा स्तर",
    stateUT: "राज्य / केंद्र शासित प्रदेश",
    socialCategory: "सामाजिक श्रेणी",
    familyIncome: "वार्षिक पारिवारिक आय",
    optional: "वैकल्पिक",
    incomePlaceholder: "उदा: ₹3,00,000",
    basedOnProfile: "आपकी प्रोफ़ाइल और राज्य के आधार पर",
    potentialSchemesIn: "उपलब्ध योजनाएं -",
    resultsCount: "परिणाम",
    viewAllSchemes: "सभी योजनाएं देखें",
    showFewerSchemes: "कम योजनाएं दिखाएं",
    match: "सटीकता",
    source: "स्रोत",
    schemeDetails: "योजना का विवरण",
    likelyEligibility: "संभावित पात्रता",
    potentialBenefit: "संभावित लाभ",
    documents: "आवश्यक दस्तावेज़",
    officialSource: "आधिकारिक स्रोत",
    tuitionBenefit: "ट्यूशन या शिक्षा सहायता",
    docProof: "पहचान, आय, शिक्षा प्रमाण",
    eligibilityProfile: "आपकी पात्रता प्रोफ़ाइल",
    savedSchemesTitle: "आपकी सहेजी गई योजनाएं",
    eligibilityDesc: "सटीक सिफारिशों के लिए अपने विवरण हमेशा अपडेट रखें।",
    savedSchemesDesc: "त्वरित पहुंच के लिए आपके द्वारा सहेजी गई योजनाएं यहां दिखाई देंगी।",
    returnAsk: "GovAI पर वापस जाएं",
    exploreMoreSchemes: "और योजनाएं देखें",
    noSavedSchemes: "आपने अभी तक कोई योजना सहेजी नहीं है। योजनाओं को देखें और सहेजने के लिए कार्ड पर दिए गए दिल के निशान पर क्लिक करें।",
    footerNotice: "GovAI उपलब्ध आधिकारिक सरकारी स्रोतों का उपयोग करता है।",
    footerLinks: "गोपनीयता · पहुंच · परिचय",
    availableForEligible: "{state} में पात्र आवेदकों के लिए उपलब्ध।",
    notifications: "सूचनाएं",
    voiceInput: "आवाज इनपुट",
    sendQuestion: "प्रश्न भेजें",
    closeDetails: "विवरण बंद करें",
    saveScheme: "योजना सहेजें",
    removeSaved: "सहेजे गए से हटाएं",
    emailNotAvailable: "ईमेल उपलब्ध नहीं है",
    studentsIn: "छात्र -",
    stateLabel: "राज्य",
    categoryLabel: "श्रेणी",
    incomeLabel: "वार्षिक पारिवारिक आय",
    notSpecified: "निर्दिष्ट नहीं",
  },
  Tamil: {
    welcome: "GovAI க்கு வரவேற்கிறோம்",
    signIn: "உங்கள் கணக்கில் உள்நுழையவும்",
    create: "உங்கள் கணக்கை உருவாக்கவும்",
    continue: "சிறந்த நலன்களுக்காக உங்கள் பயணத்தைத் தொடருங்கள்.",
    save: "உங்கள் சுயவிவரத்தைச் சேமித்து சரியான உதவியைப் பெறுங்கள்.",
    name: "முழு பெயர்",
    email: "மின்னஞ்சல் முகவரி",
    password: "கடவுச்சொல்",
    remember: "என்னை நினைவில் கொள்க",
    showPassword: "கடவுச்சொல்லைக் காட்டு",
    hidePassword: "கடவுச்சொல்லை மறை",
    signInButton: "உள்நுழை",
    createButton: "கணக்கை உருவாக்கு",
    newUser: "GovAI க்கு புதியவரா?",
    existingUser: "ஏற்கனவே கணக்கு உள்ளதா?",
    createLink: "கணக்கை உருவாக்கு",
    signInLink: "அதற்குப் பதிலாக உள்நுழை",
    accountCreated: "கணக்கு உருவாக்கப்பட்டது. தொடர உள்நுழையவும்.",
    navAsk: "GovAI யிடம் கேளுங்கள்",
    navEligibility: "எனது தகுதி",
    navSaved: "சேமித்த திட்டங்கள்",
    personalized: "தனிப்பயன் உதவி",
    greeting: "காலை வணக்கம்",
    tagline: "உங்களுக்கு கிடைக்க வேண்டிய அரசு நலத்திட்டங்களைக் கண்டறியுங்கள்.",
    conversation: "உரையாடல்",
    ask: "இன்று நான் உங்களுக்கு எப்படி உதவலாம்?",
    clear: "உரையாடலை அழி",
    intro:
      "வணக்கம்! உதவித்தொகைகள், கட்டண உதவி, கல்வி உதவித்தொகைகள் மற்றும் பிற கல்வி நலன்களைப் பற்றி கேளுங்கள்.",
    placeholder: "ஆங்கிலம், தெலுங்கு, இந்தி, தமிழில் கேளுங்கள்...",
    profile: "உங்கள் சுயவிவரம்",
    personalize: "உங்கள் முடிவுகளைத் தனிப்பயனாக்குங்கள்",
    update: "எனது சுயவிவரத்தைப் புதுப்பி",
    logout: "வெளியேறு",
    sidebarKicker: "உங்கள் அரசு நலத்திட்ட வழிகாட்டி",
    needHelp: "உதவி தேவையா?",
    talkSupport: "எங்கள் ஆதரவுக் குழுவிடம் பேசுங்கள்",
    kbUpdated: "தகவல் தளம் புதுப்பிக்கப்பட்டது",
    today: "இன்று",
    suggestScholarship: "மாணவர்களுக்கான உதவித்தொகைகள் என்னென்ன உள்ளன?",
    suggestFeeSupport: "கல்விக் கட்டணத் திருப்பிச் செலுத்துதலுக்கு எப்படி விண்ணப்பிப்பது?",
    suggestScholarshipQuery: "மாணவர்களுக்கான உதவித்தொகைகள் என்னென்ன உள்ளன?",
    suggestFeeSupportQuery: "கல்விக் கட்டணத் திருப்பிச் செலுத்துதலுக்கு எப்படி விண்ணப்பிப்பது?",
    checkingBackend: "GovAI பதிலை தயார் செய்கிறது...",
    backendOffline: "பின்தளம் இன்னும் இயங்கவில்லை. Eclipse இல் CapstoneServer.java ஐத் தொடங்கவும்.",
    educationLevel: "கல்வித் தகுதி",
    stateUT: "மாநிலம் / யூனியன் பிரதேசம்",
    socialCategory: "சமூகப் பிரிவு",
    familyIncome: "ஆண்டு குடும்ப வருமானம்",
    optional: "விருப்பத்தேர்வு",
    incomePlaceholder: "எ.கா: ₹3,00,000",
    basedOnProfile: "உங்கள் சுயவிவரம் மற்றும் மாநிலத்தின் அடிப்படையில்",
    potentialSchemesIn: "கிடைக்கக்கூடிய திட்டங்கள் -",
    resultsCount: "முடிவுகள்",
    viewAllSchemes: "அனைத்து திட்டங்களையும் காண்க",
    showFewerSchemes: "குறைவான திட்டங்களைக் காட்டு",
    match: "பொருத்தம்",
    source: "ஆதாரம்",
    schemeDetails: "திட்ட விவரங்கள்",
    likelyEligibility: "தகுதி வரம்பு",
    potentialBenefit: "சாத்தியமான நன்மை",
    documents: "தேவையான ஆவணங்கள்",
    officialSource: "அதிகாரப்பூர்வ ஆதாரம்",
    tuitionBenefit: "கல்வி உதவித்தொகை அல்லது கட்டண ஆதரவு",
    docProof: "அடையாளம், வருமானம், கல்வி சான்றிதழ்கள்",
    eligibilityProfile: "உங்கள் தகுதி சுயவிவரம்",
    savedSchemesTitle: "நீங்கள் சேமித்த திட்டங்கள்",
    eligibilityDesc: "துல்லியமான பரிந்துரைகளுக்கு உங்கள் விவரங்களைப் புதுப்பித்த நிலையில் வைத்திருங்கள்.",
    savedSchemesDesc: "நீங்கள் சேமிக்கும் திட்டங்கள் விரைவான அணுகலுக்கு இங்கே தோன்றும்.",
    returnAsk: "GovAI க்குத் திரும்பு",
    exploreMoreSchemes: "மேலும் திட்டங்களை ஆராயுங்கள்",
    noSavedSchemes: "நீங்கள் இன்னும் எந்த திட்டங்களையும் சேமிக்கவில்லை. திட்டங்களை உலாவவும், சேமிக்க ஹார்ட் ஐகானைக் கிளிக் செய்யவும்.",
    footerNotice: "GovAI அதிகாரப்பூர்வ அரசு மூலங்களைப் பயன்படுத்துகிறது.",
    footerLinks: "தனியுரிமை · அணுகல்தன்மை · எங்களை பற்றி",
    availableForEligible: "{state} இல் உள்ள தகுதியுடைய விண்ணப்பதாரர்களுக்குக் கிடைக்கும்.",
    notifications: "அறிவிப்புகள்",
    voiceInput: "குரல் உள்ளீடு",
    sendQuestion: "கேள்வி அனுப்பு",
    closeDetails: "விவரங்களை மூடு",
    saveScheme: "திட்டத்தைச் சேமி",
    removeSaved: "சேமிக்கப்பட்டதிலிருந்து அகற்று",
    emailNotAvailable: "மின்னஞ்சல் கிடைக்கவில்லை",
    studentsIn: "மாணவர்கள் -",
    stateLabel: "மாநிலம்",
    categoryLabel: "பிரிவு",
    incomeLabel: "ஆண்டு குடும்ப வருமானம்",
    notSpecified: "குறிப்பிடப்படவில்லை",
  },
};

const ALL_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const ALL_EDUCATIONS = ["Intermediate", "Diploma", "B.Tech", "Postgraduate"];
const ALL_CATEGORIES = ["General", "OBC", "SC", "ST"];

function App() {
  const [authUser, setAuthUser] = useState(
    () =>
      localStorage.getItem("govaiUser") || sessionStorage.getItem("govaiUser"),
  );
  const [authEmail, setAuthEmail] = useState(
    () => localStorage.getItem("govaiEmail") || sessionStorage.getItem("govaiEmail") || "",
  );
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("govaiRememberMe") === "true";
  });
  const [authMode, setAuthMode] = useState(() => {
    const hasSaved = localStorage.getItem("govaiRememberMe") === "true";
    return hasSaved ? "signin" : "register";
  });
  const [authForm, setAuthForm] = useState(() => {
    try {
      if (localStorage.getItem("govaiRememberMe") === "true") {
        const saved = localStorage.getItem("govaiSavedCreds");
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            name: "",
            email: parsed.email || "",
            password: parsed.password || "",
          };
        }
      }
    } catch {}
    return {
      name: "",
      email: "",
      password: "",
    };
  });
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState(
    () => localStorage.getItem("govaiLanguage") || "English",
  );
  const [activeView, setActiveView] = useState("Ask GovAI");
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [backendAnswer, setBackendAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAllSchemes, setShowAllSchemes] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [savedSchemeKeys, setSavedSchemeKeys] = useState(() => {
    try {
      const saved = localStorage.getItem("govaiSavedSchemes");
      return saved
        ? JSON.parse(saved)
        : ["Post-Matric Scholarship", "PM YASASVI Scholarship", "Women Student Support"];
    } catch {
      return ["Post-Matric Scholarship", "PM YASASVI Scholarship", "Women Student Support"];
    }
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState([]);
  const [selectedNotif, setSelectedNotif] = useState(null);
    const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const [appliedProfile, setAppliedProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("govaiProfile");
      return saved
        ? JSON.parse(saved)
        : {
            education: "B.Tech",
            state: "Andhra Pradesh",
            category: "General",
            income: "",
          };
    } catch {
      return {
        education: "B.Tech",
        state: "Andhra Pradesh",
        category: "General",
        income: "",
      };
    }
  });

  const [profileForm, setProfileForm] = useState(appliedProfile);

  const text = translations[language] || translations.English;
  const navItems = [
    { value: "Ask GovAI", label: text.navAsk },
    { value: "My Eligibility", label: text.navEligibility },
    { value: "Saved Schemes", label: text.navSaved },
  ];
  const activeViewLabel =
    navItems.find((item) => item.value === activeView)?.label || activeView;

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem("govaiLanguage", newLanguage);
  };

  const toggleSaveScheme = (schemeKey) => {
    setSavedSchemeKeys((current) => {
      const exists = current.includes(schemeKey);
      const next = exists
        ? current.filter((k) => k !== schemeKey)
        : [...current, schemeKey];
      localStorage.setItem("govaiSavedSchemes", JSON.stringify(next));
      return next;
    });
  };

  const selectLanguageFromChip = (event) => {
    const languageByLabel = {
      English: "English",
      తెలుగు: "Telugu",
      हिन्दी: "Hindi",
      தமிழ்: "Tamil",
    };
    const selectedLanguage = languageByLabel[event.target.textContent];
    if (selectedLanguage) handleLanguageChange(selectedLanguage);
  };

  const localizedStateName = getLocalizedState(appliedProfile.state, language);
  const localizedEducationName = getLocalizedEducation(appliedProfile.education, language);

  const rawEduSchemes =
    (localizedSchemes[language] && localizedSchemes[language][appliedProfile.education]) ||
    localizedSchemes.English[appliedProfile.education];
  const englishEduSchemes = localizedSchemes.English[appliedProfile.education] || [];

  const schemes = rawEduSchemes.map(
    ([name, _tag, detailTemplate, sourceTemplate], index) => {
      const stableKey = englishEduSchemes[index] ? englishEduSchemes[index][0] : name;
      const detail = detailTemplate.replaceAll("{state}", localizedStateName);
      const source = sourceTemplate.replaceAll("{state}", localizedStateName);
      return {
        key: stableKey,
        name: `${localizedStateName} ${name}`,
        tag: localizedStateName,
        detail: `${detail} ${text.availableForEligible.replace("{state}", localizedStateName)}`,
        source,
        link: getSchemeLink(appliedProfile.state),
        fit: `${getStateMatch(appliedProfile.state, appliedProfile.education, index)}%`,
      };
    },
  );

  const rawAdditionalSchemes =
    (localizedSchemes[language] && localizedSchemes[language].additional) ||
    localizedSchemes.English.additional;
  const englishAdditionalSchemes = localizedSchemes.English.additional || [];

  const additionalSchemes = rawAdditionalSchemes.map(
    ([name, _tag, detailTemplate, sourceTemplate], index) => {
      const stableKey = englishAdditionalSchemes[index] ? englishAdditionalSchemes[index][0] : name;
      const detail = detailTemplate.replaceAll("{state}", localizedStateName);
      const source = sourceTemplate.replaceAll("{state}", localizedStateName);
      return {
        key: stableKey,
        name: `${localizedStateName} ${name}`,
        tag: localizedStateName,
        detail: `${detail} ${text.availableForEligible.replace("{state}", localizedStateName)}`,
        source,
        link: getSchemeLink(appliedProfile.state),
        fit: `${getStateMatch(appliedProfile.state, appliedProfile.education, index + 3)}%`,
      };
    },
  );

  const ALL_STATE_SCHEMES_REGISTRY = {
    "Andhra Pradesh": [
      {
        id: "ap-vidya-deevena-2026",
        state: "Andhra Pradesh",
        title: "Jagananna Vidya Deevena & Vasathi Deevena",
        description: "100% Full college fee reimbursement & ₹20,000 yearly hostel maintenance fund for AP students.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Jagananna Vidya Deevena (RTF) & Vasathi Deevena (MTF)",
          body: `Government of Andhra Pradesh provides 100% full fee reimbursement and up to ₹20,000/year Vasathi Deevena financial assistance for hostel/mess expenses deposited directly via DBT into the mother's bank account for students pursuing Polytechnic, ITI, Degree, B.Tech (${appliedProfile.education}), Pharmacy, MBA, and MCA for the academic session.`,
          benefit: "100% Full Tuition Fee Reimbursement + ₹20,000/year Vasathi maintenance grant (quarterly DBT)",
          eligibility: [
            "Permanent resident of Andhra Pradesh",
            "Family annual income below ₹2,50,000 (landholding < 10 acres wetland / < 25 acres dryland)",
            `Pursuing ${appliedProfile.education}, Degree, Engineering, Medicine, or Postgraduate courses`,
            "Minimum 75% aggregate college biometric attendance required",
            "No family member should be a government employee or income tax payee",
          ],
          deadline: "31 December (2026–2027 Fresh & Renewal)",
          steps: [
            "Submit bonafide & admission details to your College Scholarship Coordinator",
            "College verifies and forwards profile via Jnanabhumi Portal (jnanabhumi.ap.gov.in)",
            "Complete Biometric / Aadhaar e-KYC at Grama/Ward Sachivalayam",
            "Welfare and Education Assistant (WEA) verifies eligibility",
            "Funds credited directly via DBT to mother's Aadhaar-linked bank account",
          ],
          documents: [
            "Aadhaar Card of Student & Mother",
            "Integrated Caste & Income Certificate (issued by Meeseva / Sachivalayam)",
            "College Admission Allotment Order & Fee Receipt",
            "Mother's Bank Account Passbook (Aadhaar NPCI linked)",
            "Ration Card / Rice Card",
            "Previous Year Passed Marksheets",
          ],
          link: "https://jnanabhumi.ap.gov.in",
        },
      },
      {
        id: "ap-post-matric-2026",
        state: "Andhra Pradesh",
        title: "AP Social & Tribal Welfare Post-Matric Assistance",
        description: "Special academic allowance, exam fee concessions, and career assistance in AP.",
        type: "scholarship",
        time: "Live for",
        detail: {
          heading: "AP Social & Tribal Welfare Post-Matric Assistance",
          body: "State financial assistance for SC, ST, BC, EBC, Kapu, and Minority students covering college examination fees, special book allowances, and residential grants across Andhra Pradesh for the academic cycle.",
          benefit: "Full Tuition Waiver + ₹5,000 to ₹12,000 annual book & exam allowance",
          eligibility: [
            "SC, ST, BC, EBC, Kapu, Minority, or Differently-abled students from Andhra Pradesh",
            "Family annual income: SC/ST up to ₹2.5L, BC/EBC/Kapu up to ₹2.0L",
            "Pursuing post-matric courses in recognized institutions",
          ],
          deadline: "15 January 2027",
          steps: [
            "Apply online via Jnanabhumi portal",
            "Complete village secretariat biometric authentication",
            "District Welfare Officer approves sanction list",
          ],
          documents: ["Aadhaar Card", "Income Certificate", "Caste Certificate", "College ID", "Bank Passbook"],
          link: "https://jnanabhumi.ap.gov.in",
        },
      },
    ],
    "Telangana": [
      {
        id: "ts-epass-2026",
        state: "Telangana",
        title: "Telangana ePASS Post-Matric RTF & MTF Registration",
        description: "Reimbursement of Tuition Fee (RTF) & Maintenance Fee (MTF) for college students in Telangana.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Telangana ePASS Post-Matric Scholarship (RTF & MTF)",
          body: `Telangana ePASS provides full tuition fee reimbursement (RTF) directly to colleges and monthly hostel/mess maintenance fee (MTF) directly to student bank accounts for Intermediate, Degree, ${appliedProfile.education}, Medicine, and PG courses for.`,
          benefit: "Full Tuition Fee Waiver (up to ₹1,20,000/yr) + up to ₹1,400/month MTF mess stipend",
          eligibility: [
            "Telangana domicile students belonging to SC, ST, BC, EBC, Minority, or Disabled categories",
            "Annual family income: SC/ST ≤ ₹2,00,000; BC/EBC/Minority ≤ ₹1,50,000 (Rural) / ₹2,00,000 (Urban)",
            "Admitted under Convener Quota (DOST / TS EAMCET / ICET / POLYCET / PGECET)",
            "Minimum 75% attendance in the current academic semester",
          ],
          deadline: "31 December",
          steps: [
            "Visit telanganaepass.cgg.gov.in and click Post-Matric Scholarship Registration",
            "Enter SSC Hall Ticket Number, Year of Pass, and Aadhaar Number",
            "Upload CET Allotment Order, Caste, Income, and Bonafide certificates",
            "Submit hard copy with attachments to college verification officer",
            "District Welfare Officer approves and releases funds via Treasury DBT",
          ],
          documents: [
            "Aadhaar Card",
            "Latest MeeSeva Income & Caste Certificate",
            "DOST / TS EAMCET / ECET Allotment Order",
            "Bank Passbook copy (Nationalized bank seeded with Aadhaar)",
            "Bonafide Certificate for past 7 consecutive years of study",
            "SSC & Intermediate marks memo",
          ],
          link: "https://telanganaepass.cgg.gov.in",
        },
      },
      {
        id: "ts-vidya-nidhi-2026",
        state: "Telangana",
        title: "Telangana Overseas Vidya Nidhi Scheme",
        description: "Financial assistance grant of ₹20 Lakhs for pursuing Master's and PhD degrees abroad.",
        type: "scholarship",
        time: "Live",
        detail: {
          heading: "Telangana Overseas Vidya Nidhi Scheme",
          body: "Govt of Telangana grants ₹20 Lakhs scholarship plus one-way economy airfare and visa fees for eligible SC, ST, BC, and Minority graduates seeking Master's/Doctoral studies in USA, UK, Australia, Canada, Germany, Singapore, and Japan.",
          benefit: "₹20,00,000 direct grant in two installments + Airfare & Visa charges",
          eligibility: [
            "Graduate with minimum 60% marks in Engineering / Medicine / Science / Humanities",
            "Family annual income below ₹5,00,000",
            "Valid score in GRE / GMAT / TOEFL / IELTS with confirmed admission in accredited foreign university",
          ],
          deadline: "31 January 2027 (Spring/Fall Intake)",
          steps: [
            "Register on telanganaepass.cgg.gov.in -> Overseas Scholarship",
            "Upload I-20 / Offer letter, visa, GRE/TOEFL score cards, caste and income proof",
            "Appear before State Level Selection Committee interview",
          ],
          documents: ["Passport & Visa", "I-20 / Admission Letter", "Degree Certificate", "Caste & Income Certificate", "Aadhaar Card"],
          link: "https://telanganaepass.cgg.gov.in",
        },
      },
    ],
    "Tamil Nadu": [
      {
        id: "tn-pudhumai-2026",
        state: "Tamil Nadu",
        title: "TN Pudhumai Penn & Thamizh Pudhalvan Scheme",
        description: "₹1,000 monthly bank allowance for government school students pursuing higher education.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Pudhumai Penn & Thamizh Pudhalvan Scheme",
          body: `Tamil Nadu Higher Education Department provides ₹1,000 per month deposited directly into student bank accounts for girl students (Pudhumai Penn) and boy students (Thamizh Pudhalvan) from Govt schools pursuing ${appliedProfile.education}, B.Sc, MBBS, Diploma, and ITI.`,
          benefit: "₹1,000 per month (₹12,000 annually) direct bank transfer until degree completion",
          eligibility: [
            "Studied in Tamil Nadu Government Schools from Classes 6 to 12",
            "Pursuing full-time Undergraduate degree, Engineering, Medical, or Polytechnic diploma",
            "No family income ceiling for this scheme",
          ],
          deadline: "15 December",
          steps: [
            "Apply through college nodal officer on penkalvi.tn.gov.in / umay.tn.gov.in",
            "EMIS number verification from school records",
            "Monthly DBT directly credited into Aadhaar seeded bank account",
          ],
          documents: ["EMIS School ID / TC", "Aadhaar Card", "College Admission Proof", "Bank Passbook"],
          link: "https://www.tnesevai.tn.gov.in",
        },
      },
    ],
    "Karnataka": [
      {
        id: "ka-ssp-2026",
        state: "Karnataka",
        title: "Karnataka State Scholarship Portal (SSP) Post-Matric",
        description: "Unified fee concession, Vidyasiri food & accommodation stipends in Karnataka.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "State Scholarship Portal (SSP) Post-Matric & Vidyasiri",
          body: `SSP Karnataka unifies Social Welfare, Backward Classes Welfare, and Minority Departments delivering tuition fee concessions, Vidyasiri food & accommodation stipends (₹1,500/month), and fee concessions for PUC, Diploma, Degree, ${appliedProfile.education}, and PG programs for.`,
          benefit: "Full College Fee Waiver + ₹1,500/month Vidyasiri stipend + book grant",
          eligibility: [
            "Karnataka domicile student",
            "SC/ST family annual income up to ₹2.5L; Cat-1 up to ₹2.5L; 2A/2B/3A/3B up to ₹1.0L",
            "Enrolled in recognized institute with Kutumba Family ID",
          ],
          deadline: "15 January 2027",
          steps: [
            "Register with Aadhaar and Kutumba ID on ssp.postmatric.karnataka.gov.in",
            "Provide Student e-Attestation number for academic documents",
            "College verification and departmental approval for e-payment",
          ],
          documents: ["Kutumba ID", "Aadhaar Card", "Caste & Income RD Number", "e-Attestation Documents", "College Fee Receipt"],
          link: "https://ssp.postmatric.karnataka.gov.in",
        },
      },
      {
        id: "ka-yuva-nidhi-2026",
        state: "Karnataka",
        title: "Karnataka Yuva Nidhi Unemployment Allowance",
        description: "₹3,000/month for degree holders and ₹1,500/month for diploma holders in Karnataka.",
        type: "welfare",
        time: "Live",
        detail: {
          heading: "Karnataka Yuva Nidhi Scheme",
          body: "Yuva Nidhi provides continuous monthly financial assistance for up to 2 years for educated youth in Karnataka who completed graduation or diploma while seeking employment.",
          benefit: "₹3,000/month for Graduates / B.Tech and ₹1,500/month for Diploma holders via DBT",
          eligibility: [
            "Domicile of Karnataka who graduated or completed diploma",
            "Unemployed for 6 months after graduation and not enrolled in higher education",
            "Aadhaar-linked bank account",
          ],
          deadline: "Ongoing Portal Enrollment",
          steps: [
            "Apply on sevasindhuservices.karnataka.gov.in using Aadhaar & Degree Register number",
            "Submit monthly self-declaration of unemployment on the portal",
          ],
          documents: ["Degree / Diploma Certificate", "Aadhaar Card", "Domicile Certificate", "Bank Account Passbook"],
          link: "https://sevasindhuservices.karnataka.gov.in",
        },
      },
    ],
    "Maharashtra": [
      {
        id: "mh-mahadbt-2026",
        state: "Maharashtra",
        title: "MahaDBT Post-Matric & Higher Education Scholarships",
        description: "50% to 100% Tuition fee waiver & Rajarshi Shahu Maharaj fee reimbursement.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "MahaDBT Scholarship & Rajarshi Shahu Maharaj Scheme",
          body: `Government of Maharashtra through MahaDBT offers 50% to 100% reimbursement of tuition fees and exam fees for EBC, OBC, VJNT, SC, ST, and SEBC students in Engineering (${appliedProfile.education}), Architecture, Pharmacy, Management, and Medical courses for.`,
          benefit: "50% to 100% Full Tuition Fee & Exam Fee Waiver + monthly maintenance allowance",
          eligibility: [
            "Maharashtra Domicile student admitted through CAP (Centralized Admission Process)",
            "Family annual income: SC/ST up to ₹2.5L; OBC/EBC up to ₹8.0L (for 50% waiver)",
            "Not more than 2 beneficiaries from the same family",
          ],
          deadline: "31 December",
          steps: [
            "Create profile on mahadbt.maharashtra.gov.in with Aadhaar authentication",
            "Select scheme under Social Justice / Tribal / Higher Education Department",
            "Upload CAP allotment, income certificate from Tehsildar, and fee receipt",
            "Principal scrutinizes and forwards to State Directorate for DBT approval",
          ],
          documents: ["CAP Allotment Letter", "Domicile & Nationality Certificate", "Tehsildar Income Certificate", "Caste & Validity Certificate", "10th/12th/Diploma Marksheets"],
          link: "https://mahadbt.maharashtra.gov.in",
        },
      },
      {
        id: "mh-ladki-bahin-2026",
        state: "Maharashtra",
        title: "Mukhyamantri Majhi Ladki Bahin Yojana",
        description: "₹1,500 monthly financial assistance for eligible women aged 21–65 years.",
        type: "welfare",
        time: "Active",
        detail: {
          heading: "Mukhyamantri Majhi Ladki Bahin Yojana",
          body: "Direct cash assistance of ₹1,500/month credited directly into Aadhaar-seeded bank accounts of eligible women in Maharashtra to foster financial independence and nutrition security.",
          benefit: "₹1,500 per month (₹18,000 annually) direct cash transfer",
          eligibility: [
            "Resident of Maharashtra aged 21 to 65 years",
            "Family annual income not exceeding ₹2,50,000",
            "Owns valid bank account with Aadhaar DBT enabled",
          ],
          deadline: "Active Regular Enrollment",
          steps: [
            "Apply via Nari Shakti Doot App or at nearest Setu Kendra / Gram Panchayat",
            "Submit Aadhaar, Ration Card, and Income Certificate",
          ],
          documents: ["Aadhaar Card", "Ration Card (Yellow/Orange)", "Income Certificate / Hamipatra", "Bank Passbook"],
          link: "https://ladakibahin.maharashtra.gov.in",
        },
      },
    ],
    "Uttar Pradesh": [
      {
        id: "up-scholarship-2026",
        state: "Uttar Pradesh",
        title: "UP Post-Matric Scholarship & Fee Reimbursement",
        description: "100% Fee reimbursement and maintenance allowances across UP universities.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "UP Post-Matric Scholarship & Shulk Pratipoorti System",
          body: `Uttar Pradesh Social Welfare, Backward Classes Welfare, and Minority Welfare Departments provide 100% reimbursement of non-refundable college fees along with monthly maintenance stipends for Class 11, 12, BA, B.Sc, B.Tech (${appliedProfile.education}), MBBS, B.Ed, and Diploma students for.`,
          benefit: "100% Non-refundable fee refund + up to ₹12,000 annual maintenance allowance",
          eligibility: [
            "Domicile of Uttar Pradesh",
            "Family annual income: SC/ST up to ₹2,50,000; General/OBC/Minority up to ₹2,00,000",
            "Enrolled in recognized university or college listed in UP Master Database",
          ],
          deadline: "20 December",
          steps: [
            "Register on scholarship.up.gov.in with Digilocker authentication",
            "Fill academic, caste, and income certificate application numbers",
            "Lock final printout and submit to College Scholarship Incharge",
            "District Welfare Committee verifies and approves treasury disbursement",
          ],
          documents: ["Digilocker verified Aadhaar", "Income & Caste Certificate Number", "High School Roll Number", "Fee Receipt", "Bank Passbook with NPCI mapping"],
          link: "https://scholarship.up.gov.in",
        },
      },
      {
        id: "up-abhyudaya-2026",
        state: "Uttar Pradesh",
        title: "UP Mukhyamantri Abhyudaya Free Coaching",
        description: "Free premier coaching for UPSC, JEE, NEET, CDS & free digital tablets.",
        type: "skill",
        time: "Live",
        detail: {
          heading: "UP Mukhyamantri Abhyudaya Yojana",
          body: "Free top-tier coaching classes conducted by IAS/IPS officers and subject experts across all 75 districts of Uttar Pradesh for competitive exams (Civil Services, JEE Advanced, NEET, CDS, Banking), along with free digital tablets for qualifying students.",
          benefit: "100% Free physical & virtual coaching + Free tablet device + study materials",
          eligibility: [
            "Resident of Uttar Pradesh",
            "Eligible candidate preparing for UPSC, UPPSC, JEE, NEET, NDA, or CDS",
            "Qualify the state level Abhyudaya entrance exam",
          ],
          deadline: "30 November (Batch Admission)",
          steps: [
            "Register at abhyuday.up.gov.in",
            "Select examination stream and preferred district centre",
            "Appear in online screening test and attend physical/virtual classes",
          ],
          documents: ["Aadhaar Card", "Educational Qualification Marksheets", "Passport Photo", "Domicile Certificate"],
          link: "http://abhyuday.up.gov.in",
        },
      },
    ],
    "Delhi": [
      {
        id: "dl-merit-means-2026",
        state: "Delhi",
        title: "Delhi Higher Education Merit-cum-Means Assistance",
        description: "100% Tuition fee waiver for low-income students in Delhi State Universities.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Delhi Merit-cum-Means Financial Assistance & Jai Bhim Yojana",
          body: "Delhi Higher Education Department provides 100% tuition fee waiver for students with annual family income up to ₹2.50 Lakhs and 50% waiver for income up to ₹6.00 Lakhs pursuing degree/diploma programs in Delhi State Universities (DTU, NSUT, IIIT-D, IPU, Ambedkar University, DSEU).",
          benefit: "100% Tuition fee waiver (up to ₹2.5 Lakhs/yr) + free laptop assistance for SC/ST",
          eligibility: [
            "Delhi domicile with candidate having passed qualifying exam from a Delhi school/college",
            "Family annual income up to ₹2.5 Lakhs (100% waiver) or ₹2.5L-₹6.0L (50% waiver)",
            "Pursuing undergraduate/professional courses in Delhi state universities",
          ],
          deadline: "15 January 2027",
          steps: [
            "Apply via Delhi e-District portal (edistrict.delhigovt.nic.in)",
            "Upload revenue department income certificate & academic records",
            "University Nodal Officer verifies admission and forwards for sanction",
          ],
          documents: ["Delhi Domicile / School Certificate", "SDM Income Certificate", "Aadhaar Card", "University Fee Structure & Receipts"],
          link: "https://edistrict.delhigovt.nic.in",
        },
      },
    ],
    "West Bengal": [
      {
        id: "wb-svmcm-2026",
        state: "West Bengal",
        title: "Swami Vivekananda Merit-cum-Means Scholarship",
        description: "₹12,000 to ₹60,000/year assistance for Higher Secondary, UG, and PG students.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Swami Vivekananda Merit-cum-Means Scholarship (SVMCM 4.0)",
          body: "Government of West Bengal provides direct financial assistance of ₹1,000 to ₹5,000 per month for meritorious students from economically weaker sections pursuing Higher Secondary, Undergraduate, Engineering, Medical, and Postgraduate studies.",
          benefit: "₹1,000 to ₹5,000/month (₹12,000 to ₹60,000/year) direct bank transfer",
          eligibility: [
            "West Bengal resident enrolled in WB recognized institutions",
            "Minimum 60% marks in previous qualifying board / university examination",
            "Annual family income not exceeding ₹2,50,000",
          ],
          deadline: "31 January 2027",
          steps: [
            "Register on svmcm.wbhed.gov.in using Board/Council roll number",
            "Upload income certificate issued by BDO/SDO/Joint BDO",
            "Head of Institution verifies records online",
          ],
          documents: ["Marksheet of last qualifying exam", "Income Certificate from SDO/BDO", "Domicile Certificate", "Bank Passbook copy with IFSC"],
          link: "https://svmcm.wbhed.gov.in",
        },
      },
    ],
    "Bihar": [
      {
        id: "br-pms-2026",
        state: "Bihar",
        title: "Bihar Post-Matric Scholarship & Student Credit Card",
        description: "Full institutional fee subsidy & ₹4,00,000 Education Loan at 1% interest.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Bihar Post Matric Scholarship & Student Credit Card",
          body: "Bihar Government operates the dedicated PMS Online portal for SC, ST, BC, and EBC students offering institutional fee support, alongside the Bihar Student Credit Card scheme providing up to ₹4,00,000 education loan at just 1% simple interest for girls and 4% for boys.",
          benefit: "Full College Fee Waiver + ₹4,00,000 Low-Interest Higher Education Credit",
          eligibility: [
            "Permanent resident of Bihar",
            "SC, ST, BC, or EBC student pursuing post-matric courses in recognized colleges",
            "Family annual income below ₹3,00,000",
          ],
          deadline: "31 December",
          steps: [
            "Register on pmsonline.bih.nic.in or via MNSSBY portal",
            "Upload fee receipts, bonafide certificate, and residential proof",
            "District Programme Officer (DPO) verifies and releases DBT",
          ],
          documents: ["Residential / Domicile Certificate", "Caste Certificate", "Income Certificate", "Bonafide Certificate & Fee Structure", "Aadhaar Card"],
          link: "http://pmsonline.bih.nic.in",
        },
      },
    ],
    "Rajasthan": [
      {
        id: "rj-anuprati-2026",
        state: "Rajasthan",
        title: "Mukhyamantri Anuprati & Uttar Matric Chhatravriti",
        description: "100% Free premier competitive coaching + ₹40,000 annual residential allowance.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Mukhyamantri Anuprati Coaching Scheme & Uttar Matric",
          body: "Rajasthan Social Justice and Empowerment Department sponsors full coaching fees at reputed coaching institutes plus an annual ₹40,000 residential allowance for rural students, along with 100% post-matric fee reimbursement for SC/ST/OBC/EWS/MBC candidates.",
          benefit: "100% Free Premier Coaching + ₹40,000 annual residential allowance + full college tuition waiver",
          eligibility: [
            "Domicile of Rajasthan with Jan Aadhaar Card",
            "Family annual income up to ₹8,00,000 (EBC/OBC/EWS/SC/ST)",
            "Minimum 60% in Class 10/12 for engineering/medical and 50% for civil services",
          ],
          deadline: "31 December",
          steps: [
            "Log in to Rajasthan SSO Portal (sso.rajasthan.gov.in) using Jan Aadhaar ID",
            "Select SJMS portal (Scholarship/Anuprati)",
            "Choose course and preferred coaching institute",
            "State merit list issued for seat allocation",
          ],
          documents: ["Jan Aadhaar Card", "Aadhaar Card", "Bonafide Certificate", "Income Certificate", "10th/12th Marksheets"],
          link: "https://sso.rajasthan.gov.in",
        },
      },
    ],
    "Gujarat": [
      {
        id: "gj-mysy-2026",
        state: "Gujarat",
        title: "Digital Gujarat MYSY & Post-Matric Scholarship",
        description: "50% Tuition fee subsidy up to ₹2,00,000 for Higher Education students in Gujarat.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Mukhyamantri Yuva Swavalamban Yojana (MYSY)",
          body: "Government of Gujarat provides 50% tuition fee subsidy (up to ₹2 Lakhs/year in Medical, ₹50,000/year in Engineering/Pharmacy, ₹10,000/year in Degree) along with ₹1,200/month hostel lodging assistance for students in.",
          benefit: "Up to ₹2,00,000 annual tuition subsidy + ₹12,000/year hostel allowance + ₹10,000 book grant",
          eligibility: [
            "Gujarat resident with at least 80 percentile in 10th/12th Board examinations",
            "Family annual income not exceeding ₹6,00,000",
          ],
          deadline: "15 January 2027",
          steps: [
            "Apply on mysy.guj.nic.in or digitalgujarat.gov.in",
            "Submit verified documents at designated Government Help Centres",
          ],
          documents: ["Income Certificate", "Marksheets", "Admission Letter", "Hostel Certificate", "Aadhaar Card"],
          link: "https://mysy.guj.nic.in",
        },
      },
    ],
    "Kerala": [
      {
        id: "kl-egrantz-2026",
        state: "Kerala",
        title: "Kerala e-Grantz 3.0 & DCE Merit Scholarship",
        description: "Direct fee reimbursement, lump sum grant, and monthly boarding stipends in Kerala.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Kerala e-Grantz 3.0 Post-Matric & Higher Education",
          body: "Directorate of Collegiate Education (DCE) and SC/ST/OBC Development Department deliver complete tuition fee waivers, annual lump sum book grants, and monthly pocket money to students across degree and professional colleges for.",
          benefit: "100% Tuition fee waiver + ₹1,500 to ₹4,500 annual book grant + monthly hostel stipend",
          eligibility: [
            "Kerala native pursuing post-matric courses in recognized institutions",
            "Family annual income: SC/ST - No income limit; OEC/OBC ≤ ₹2,50,000",
          ],
          deadline: "31 December",
          steps: [
            "Register on egrantz.kerala.gov.in using Aadhaar and SSLC details",
            "Institution level verification and sanction by District Development Officer",
          ],
          documents: ["Aadhaar", "Income Certificate", "Caste Certificate", "Bank Passbook", "SSLC / Plus Two Certificate"],
          link: "https://egrantz.kerala.gov.in",
        },
      },
    ],
    "Madhya Pradesh": [
      {
        id: "mp-mmvy-2026",
        state: "Madhya Pradesh",
        title: "MP Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)",
        description: "100% College fees paid by MP Government for Engineering, Medical & Degree students.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)",
          body: "Under MMVY, Government of Madhya Pradesh pays the full tuition fee of meritorious students admitted to IITs, NITs, Medical Colleges, Law Universities, and state engineering/degree colleges for the session.",
          benefit: "100% Full Tuition Fee paid directly to institute + MPTAAS tribal welfare stipends",
          eligibility: [
            "Resident of Madhya Pradesh with 70% in MP Board or 85% in CBSE/ICSE in Class 12",
            "Family annual income less than ₹6,00,000",
          ],
          deadline: "31 December",
          steps: ["Register on scholarshipportal.mp.nic.in / tribal.mp.gov.in", "Verify institutional admission"],
          documents: ["Aadhaar", "Income Certificate", "12th Marksheet", "Admission Fee Receipt", "Domicile Certificate"],
          link: "http://scholarshipportal.mp.nic.in",
        },
      },
    ],
    "Odisha": [
      {
        id: "od-medhabruti-2026",
        state: "Odisha",
        title: "Odisha State Scholarship Portal (e-Medhabruti & PRERANA)",
        description: "Merit scholarships of ₹10,000 to ₹15,000/year & Post-Matric support in Odisha.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Odisha State Scholarship Portal (e-Medhabruti & PRERANA)",
          body: "Higher Education and ST & SC Development Department of Odisha provides e-Medhabruti merit scholarships (₹10,000/yr for General UG/PG and ₹15,000/yr for Technical/Professional) and PRERANA Post-Matric assistance for.",
          benefit: "₹10,000 to ₹15,000 annual scholarship grant + complete post-matric fee reimbursement",
          eligibility: [
            "Permanent resident of Odisha",
            "Minimum 60% aggregate in preceding examination",
            "Family annual income not exceeding ₹6.0 Lakhs (e-Medhabruti) / ₹2.5 Lakhs (PRERANA)",
          ],
          deadline: "31 December",
          steps: ["Register on scholarship.odisha.gov.in with Aadhaar", "Submit validated institute profile"],
          documents: ["Aadhaar Card", "Resident Certificate", "Income Certificate", "Bank Account Details", "Mark Sheets"],
          link: "https://scholarship.odisha.gov.in",
        },
      },
    ],
    "Punjab": [
      {
        id: "pb-ambedkar-2026",
        state: "Punjab",
        title: "Punjab Dr. B.R. Ambedkar Post-Matric Scholarship",
        description: "Zero-fee admission Freeship Card & monthly maintenance stipends for Punjab students.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Punjab Dr. B.R. Ambedkar Post-Matric Scholarship Scheme",
          body: "Provides full fee exemption at the time of admission and monthly maintenance allowance for SC and Backward Classes students pursuing post-matric courses across Punjab for.",
          benefit: "100% Free ship card / Zero fee admission + monthly maintenance allowance",
          eligibility: [
            "Punjab domicile SC/BC student",
            "Family annual income below ₹2,50,000",
          ],
          deadline: "15 January 2027",
          steps: ["Apply on punjabscholarships.gov.in to obtain Freeship Card", "Submit card at college for zero fee admission"],
          documents: ["Aadhaar Card", "Caste Certificate", "Income Certificate", "Residence Certificate"],
          link: "https://punjabscholarships.gov.in",
        },
      },
    ],
    "Haryana": [
      {
        id: "hr-harchhatravratti-2026",
        state: "Haryana",
        title: "Haryana Har-Chhatravratti Centralized Scholarship Portal",
        description: "Unified scholarship portal for Post-Matric, Merit, and Higher Education in Haryana.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Har-Chhatravratti Higher Education Scholarship System",
          body: "Haryana Higher Education Department provides complete post-matric fee reimbursement, Haryana State Merit scholarships, and consolidated stipend schemes for SC, BC, and General category students for.",
          benefit: "100% Tuition fee waiver + ₹7,000 to ₹14,000 annual maintenance allowance",
          eligibility: [
            "Haryana domicile with Parivar Pehchan Patra (PPP ID)",
            "Family annual income verified via Parivar Pehchan Patra (PPP)",
          ],
          deadline: "31 December",
          steps: ["Login with PPP (Family ID) on harchhatravratti.highereduhry.ac.in", "Select scheme and submit"],
          documents: ["Parivar Pehchan Patra (PPP ID)", "Aadhaar Card", "Income & Caste certificates", "Fee Receipt"],
          link: "https://harchhatravratti.highereduhry.ac.in",
        },
      },
    ],
    "Assam": [
      {
        id: "as-pragyan-2026",
        state: "Assam",
        title: "Assam Pragyan Bharati & Fee Waiver Scheme",
        description: "100% Free college admission, textbook grant, and hostel subsidy for Assam students.",
        type: "scholarship",
        time: "Active",
        detail: {
          heading: "Assam Pragyan Bharati & Higher Education Fee Exemption",
          body: "Directorate of Higher Education Assam offers 100% free admission in government and provincialized colleges, ₹1,000 annual textbook grant, and ₹2,000 monthly mess subsidy for degree and post-graduate students for the academic session.",
          benefit: "100% Free College Admission + ₹1,000 Book grant + ₹2,000/mo mess subsidy",
          eligibility: [
            "Permanent resident / domicile of Assam",
            "Family annual income below ₹2,00,000 from all sources",
            "Minimum 75% attendance in previous academic session",
          ],
          deadline: "31 December",
          steps: [
            "Register on Assam Samarth eGov portal (assamsamarth.edu.in)",
            "Upload income certificate from Circle Officer",
            "College principal verifies and approves fee waiver at admission",
          ],
          documents: ["Aadhaar Card", "Circle Officer Income Certificate", "Marksheet", "Ration Card"],
          link: "https://dhe.assam.gov.in",
        },
      },
    ],
  };

  const userStateNotifs = ALL_STATE_SCHEMES_REGISTRY[appliedProfile.state] || [];
  const stateSchemes = userStateNotifs.length > 0
    ? userStateNotifs.map((notification, index) => ({
        key: notification.id,
        name: notification.title,
        tag: localizedStateName,
        detail: notification.description,
        source: `${localizedStateName} Government`,
        link: notification.link || getSchemeLink(appliedProfile.state),
        fit: `${getStateMatch(appliedProfile.state, appliedProfile.education, index)}%`,
      }))
    : [
        {
          key: `${appliedProfile.state}-student-scholarship`,
          name: `${localizedStateName} Student Scholarship`,
          tag: localizedStateName,
          detail: `State scholarship support for eligible ${localizedEducationName} students in ${localizedStateName}.`,
          source: `${localizedStateName} Government`,
          link: getSchemeLink(appliedProfile.state),
          fit: `${getStateMatch(appliedProfile.state, appliedProfile.education, 0)}%`,
        },
        {
          key: `${appliedProfile.state}-education-assistance`,
          name: `${localizedStateName} Education Fee Assistance`,
          tag: localizedStateName,
          detail: `Education fee and study support opportunities for eligible ${localizedEducationName} students from ${localizedStateName}.`,
          source: `${localizedStateName} Education Department`,
          link: getSchemeLink(appliedProfile.state),
          fit: `${getStateMatch(appliedProfile.state, appliedProfile.education, 1)}%`,
        },
        {
          key: `${appliedProfile.state}-skill-development`,
          name: `${localizedStateName} Skill Development Grant`,
          tag: localizedStateName,
          detail: `Skill training and career development assistance for eligible students in ${localizedStateName}.`,
          source: `${localizedStateName} Government`,
          link: getSchemeLink(appliedProfile.state),
          fit: `${getStateMatch(appliedProfile.state, appliedProfile.education, 2)}%`,
        },
      ];
  const allSchemes = [...stateSchemes, ...schemes, ...additionalSchemes];
  const visibleSchemes = showAllSchemes ? allSchemes : allSchemes.slice(0, 3);
  const savedSchemes = allSchemes.filter((scheme) => savedSchemeKeys.includes(scheme.key));

  const otherNotifs = Object.entries(ALL_STATE_SCHEMES_REGISTRY)
    .filter(([st]) => st !== appliedProfile.state)
    .flatMap(([, list]) => list);
  const allNotificationsList = userStateNotifs.length > 0 ? [...userStateNotifs, ...otherNotifs] : Object.values(ALL_STATE_SCHEMES_REGISTRY).flat();

  const currentNotifications = allNotificationsList.map((notif) => ({
    ...notif,
    unread: !readNotifIds.includes(notif.id),
  }));

  const unreadNotifCount = currentNotifications.filter((n) => n.unread).length;

  const markAllNotifsRead = () => {
    setReadNotifIds((prev) => [
      ...new Set([...prev, ...currentNotifications.map((n) => n.id)]),
    ]);
  };

  const askGovAIAboutNotif = async (notif) => {
    const targetState = notif.state || appliedProfile.state;
    const schemeTitle = notif.title;
    const localizedSt = getLocalizedState(targetState, language);
    const localizedEdu = getLocalizedEducation(appliedProfile.education, language);
    const q =
      language === "Telugu"
        ? `${localizedSt} లో ${localizedEdu} విద్యార్థి ${schemeTitle} కోసం ఎలా దరఖాస్తు చేసుకోవాలి? అర్హత, ప్రయోజనాలు, అవసరమైన పత్రాలు మరియు ప్రక్రియను వివరించండి.`
        : language === "Hindi"
          ? `${localizedSt} में ${localizedEdu} के छात्र ${schemeTitle} के लिए कैसे आवेदन कर सकते हैं? पात्रता, लाभ और प्रक्रिया बताएं।`
          : language === "Tamil"
            ? `${localizedSt} இல் ${localizedEdu} மாணவர்கள் ${schemeTitle} திட்டத்திற்கு எவ்வாறு விண்ணப்பிப்பது? தகுதிகள் மற்றும் பலன்களை விளக்குங்கள்.`
            : `How can a ${appliedProfile.education} student apply for ${schemeTitle} in ${targetState}? Please explain eligibility, financial benefits, required documents, and step-by-step procedure.`;


    setActiveView("Ask GovAI");
    setSelectedNotif(null);
    setShowNotifications(false);
    setQuestion("");
    setSubmittedQuestion(q);
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, language, profile: appliedProfile }),
      });
      if (!response.ok) throw new Error("Backend request failed");
      const data = await response.json();
      setBackendAnswer(data.answer);
    } catch {
      setBackendAnswer(text.backendOffline);
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    const submitted = question.trim();
    setSubmittedQuestion(submitted);
    setQuestion("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: submitted, language, profile: appliedProfile }),
      });
      if (!response.ok) throw new Error("Backend request failed");
      const data = await response.json();
      setBackendAnswer(data.answer);
    } catch {
      setBackendAnswer(text.backendOffline);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileForm = (field, value) =>
    setProfileForm((current) => ({ ...current, [field]: value }));

  const handleUpdateProfile = () => {
    setAppliedProfile(profileForm);
    localStorage.setItem("govaiProfile", JSON.stringify(profileForm));
    const localizedEdu = getLocalizedEducation(profileForm.education, language);
    const localizedSt = getLocalizedState(profileForm.state, language);
    const q =
      language === "Telugu"
        ? `${localizedSt} లో ${localizedEdu} విద్యార్థిగా నేను ఏ ప్రభుత్వ పథకాలకు అర్హుడను?`
        : language === "Hindi"
          ? `${localizedSt} में ${localizedEdu} छात्र के रूप में मैं किन सरकारी योजनाओं के लिए पात्र हूं?`
          : language === "Tamil"
            ? `${localizedSt} இல் ${localizedEdu} மாணவராக நான் எந்த அரசு நலத்திட்டங்களுக்குத் தகுதியுடையவன்?`
            : `What schemes am I eligible for as a ${profileForm.education} student in ${profileForm.state}?`;
    setQuestion(q);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError("");
    setAuthMessage("");
    setAuthLoading(true);
    const normalizedEmail = authForm.email.trim().toLowerCase();
    const normalizedPassword = authForm.password.trim();
    const normalizedName = authForm.name.trim();
    const payload =
      authMode === "signin"
        ? { email: normalizedEmail, password: normalizedPassword }
        : {
            name: normalizedName,
            email: normalizedEmail,
            password: normalizedPassword,
          };
    try {
      const response = await fetch(
        `${API_BASE_URL}/${authMode === "signin" ? "login" : "register"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Authentication failed");
      }

      if (authMode === "register") {
        setAuthMode("signin");
        setAuthForm({ name: "", email: normalizedEmail, password: "" });
        setAuthMessage(text.accountCreated);
      } else {
        const signedInUser = data.name || data.user || normalizedEmail.split("@")[0];
        setAuthUser(signedInUser);
        setAuthEmail(normalizedEmail);

        const storage = rememberMe ? localStorage : sessionStorage;
        localStorage.removeItem("govaiUser");
        sessionStorage.removeItem("govaiUser");
        localStorage.removeItem("govaiEmail");
        sessionStorage.removeItem("govaiEmail");

        storage.setItem("govaiUser", signedInUser);
        storage.setItem("govaiEmail", normalizedEmail);

        if (rememberMe) {
          localStorage.setItem("govaiRememberMe", "true");
          localStorage.setItem(
            "govaiSavedCreds",
            JSON.stringify({ email: normalizedEmail, password: normalizedPassword })
          );
          setAuthForm({ name: "", email: normalizedEmail, password: normalizedPassword });
        } else {
          localStorage.removeItem("govaiRememberMe");
          localStorage.removeItem("govaiSavedCreds");
          setAuthForm({ name: "", email: "", password: "" });
        }

        setAuthError("");
        setAuthMessage("");
        setShowPassword(false);
      }
    } catch (error) {
      setAuthError(error.message || "Could not connect to the backend.");
      setAuthMessage("");
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = () => {
    setAuthUser(null);
    setAuthEmail("");
    setAuthMode("signin");
    setAuthError("");
    setAuthMessage("");
    setShowPassword(false);

    const isRemembered = localStorage.getItem("govaiRememberMe") === "true";
    if (isRemembered) {
      setRememberMe(true);
      try {
        const saved = localStorage.getItem("govaiSavedCreds");
        if (saved) {
          const parsed = JSON.parse(saved);
          setAuthForm({
            name: "",
            email: parsed.email || "",
            password: parsed.password || "",
          });
        }
      } catch {
        setAuthForm({ name: "", email: "", password: "" });
      }
    } else {
      setRememberMe(false);
      setAuthForm({ name: "", email: "", password: "" });
    }

    localStorage.removeItem("govaiUser");
    sessionStorage.removeItem("govaiUser");
    localStorage.removeItem("govaiEmail");
    sessionStorage.removeItem("govaiEmail");
  };

  if (!authUser)
    return (
      <div className={authMode === "signin" ? "auth-shell signin-shell" : "auth-shell"}>
        <div className="auth-visual" onClick={selectLanguageFromChip}>
          <div className="brand">
            <span className="brand-mark">G</span>
            <span>
              Gov<span className="brand-accent">AI</span>
            </span>
          </div>
          <label className="auth-language-control">
            <span>Language</span>
            <select
              value={language}
              onChange={(event) => handleLanguageChange(event.target.value)}
              aria-label="Language"
            >
              <option value="English">English</option>
              <option value="Telugu">తెలుగు</option>
              <option value="Hindi">हिन्दी</option>
              <option value="Tamil">தமிழ்</option>
            </select>
          </label>
          <img className="auth-hero-image" src={heroImage} alt="GovAI multilingual government assistance" />
        </div>
        <main className="auth-card">
          <div className="auth-card-top">
            <span className="eyebrow">{text.welcome}</span>
            <h2>{authMode === "signin" ? text.signIn : text.create}</h2>
            <p>{authMode === "signin" ? text.continue : text.save}</p>
          </div>
          <form className={authMode === "signin" ? "auth-form signin-form" : "auth-form"} onSubmit={submitAuth}>
            {authMode === "register" && (
              <label>
                {text.name}
                <input
                  required
                  value={authForm.name}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, name: event.target.value })
                  }
                  placeholder="Arjun Sharma"
                />
              </label>
            )}
            <label className={authMode === "signin" ? "email-field" : ""}>
              {text.email}
              <span className="email-input-wrap">
                <input
                  required
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="username email"
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm({ ...authForm, email: event.target.value })
                  }
                  placeholder="you@example.com"
                />
                {authMode === "signin" && (
                  <button
                    type="button"
                    className="change-email"
                    onClick={() => document.getElementById("email")?.focus()}
                  >
                    Change
                  </button>
                )}
              </span>
            </label>
            <label>
              {text.password}
              <input
                required
                minLength="6"
                name="password"
                id="password"
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                type={showPassword ? "text" : "password"}
                value={authForm.password}
                onChange={(event) =>
                  setAuthForm({ ...authForm, password: event.target.value })
                }
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? text.hidePassword : text.showPassword}
                title={showPassword ? text.hidePassword : text.showPassword}
              >
                {showPassword ? "◉" : "◌"}
              </button>
            </label>
            {authMode === "signin" && (
              <div className="signin-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(event) => setShowPassword(event.target.checked)}
                  />
                  <span>{text.showPassword}</span>
                </label>
                <button type="button" className="forgot-password" onClick={() => setAuthMessage("Password recovery is not available yet.")}>
                  Forgot Password?
                </button>
              </div>
            )}
            {authMessage && <p className="auth-success">{authMessage}</p>}
            {authError && <p className="auth-error">{authError}</p>}
            <button className="auth-submit" disabled={authLoading}>
              {authLoading
                ? "Connecting..."
                : authMode === "signin"
                  ? "Login"
                  : text.createButton}{" "}
              {authMode !== "signin" && <span>→</span>}
            </button>
          </form>
          <div className="auth-switch">
            {authMode === "signin" ? text.newUser : text.existingUser}{" "}
            <button
              onClick={() => {
                setAuthMode(authMode === "signin" ? "register" : "signin");
                setAuthError("");
                setAuthMessage("");
              }}
            >
              {authMode === "signin" ? text.createLink : text.signInLink}
            </button>
          </div>
          <p className="auth-note">{text.save}</p>
        </main>
      </div>
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">G</span>
          <span>
            Gov<span className="brand-accent">AI</span>
          </span>
        </div>
        <p className="sidebar-kicker">{text.sidebarKicker}</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item, index) => (
            <button
              className={
                activeView === item.value ? "nav-item active" : "nav-item"
              }
              onClick={() => setActiveView(item.value)}
              key={item.value}
            >
              <span className="nav-icon">{["+", "◌", "▱"][index]}</span>
              {item.label}
              {index === 2 && <span className="nav-count">{savedSchemeKeys.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">?</span>
            <div>
              <strong>{text.needHelp}</strong>
              <span>{text.talkSupport}</span>
            </div>
            <span className="arrow">↗</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">
              {activeView === "Ask GovAI" ? text.personalized : text.profile}
            </span>
            <h1>{activeViewLabel}</h1>
          </div>
          <div className="header-actions">
            <div className="header-profile">
              <div className="avatar">{getInitials(authUser)}</div>
              <strong>{authUser}</strong>
              <button className="header-logout" onClick={signOut}>{text.logout}</button>
            </div>
            <label className="language-select">
              <select
                value={language}
                onChange={(event) => handleLanguageChange(event.target.value)}
                aria-label="Language"
              >
                <option value="English">English</option>
                <option value="Telugu">తెలుగు</option>
                <option value="Hindi">हिन्दी</option>
                <option value="Tamil">தமிழ்</option>
              </select>
            </label>
            <div className="notification-bar-container" ref={notifRef}>
              <button
                type="button"
                className={`notification-bell-btn ${showNotifications ? "active" : ""}`}
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label={text.notifications}
                title={text.notifications}
              >
                <svg
                  className="bell-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotifCount > 0 && (
                  <span className="notification-badge-dot">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notif-top">
                    <div className="notif-title-group">
                      <strong>{text.notifications}</strong>
                      {unreadNotifCount > 0 && (
                        <span className="notif-count-pill">{unreadNotifCount} new</span>
                      )}
                    </div>
                    {unreadNotifCount > 0 && (
                      <button type="button" className="notif-mark-read" onClick={markAllNotifsRead}>
                        {language === "Telugu"
                          ? "అన్నీ చదివినట్లు గుర్తించు"
                          : language === "Hindi"
                            ? "सभी पढ़े गए"
                            : language === "Tamil"
                              ? "அனைத்தும் படிக்கப்பட்டது"
                              : "Mark all read"}
                      </button>
                    )}
                  </div>
                  <div className="notif-items-list">
                    {currentNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`notif-card ${notif.unread ? "is-unread" : ""}`}
                        onClick={() => {
                          setReadNotifIds((prev) => [...new Set([...prev, notif.id])]);
                          setSelectedNotif(notif);
                          setShowNotifications(false);
                        }}
                      >
                        <div className="notif-icon-bubble">
                          {notif.type === "scholarship" && "🎓"}
                          {notif.type === "match" && "✨"}
                          {notif.type === "system" && "🔔"}
                        </div>
                        <div className="notif-details">
                          <div className="notif-row">
                            <span className="notif-heading">{notif.title}</span>
                            <time className="notif-stamp">{notif.time}</time>
                          </div>
                          <p className="notif-text">{notif.description}</p>
                        </div>
                        {notif.unread && <span className="notif-active-dot" />}
                      </div>
                    ))}
                  </div>
                  <div className="notif-bottom">
                    <button
                      type="button"
                      className="notif-close-action"
                      onClick={() => setShowNotifications(false)}
                    >
                      {language === "Telugu"
                        ? "మూసివేయి"
                        : language === "Hindi"
                          ? "बंद करें"
                          : language === "Tamil"
                            ? "மூடு"
                            : "Close"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Notification Detail Modal */}
        {selectedNotif && selectedNotif.detail && (
          <div className="notif-detail-overlay" onClick={() => setSelectedNotif(null)}>
            <div className="notif-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="notif-detail-header">
                <div className="notif-detail-icon">
                  {selectedNotif.type === "scholarship" && "🎓"}
                  {selectedNotif.type === "match" && "✨"}
                  {selectedNotif.type === "system" && "🔔"}
                </div>
                <div>
                  <span className="notif-detail-eyebrow">
                    {selectedNotif.type === "scholarship"
                      ? language === "Telugu" ? "స్కాలర్‌షిప్ అప్‌డేట్" : language === "Hindi" ? "छात्रवृत्ति अपडेट" : language === "Tamil" ? "உதவித்தொகை புதுப்பிப்பு" : "Scholarship Update"
                      : selectedNotif.type === "match"
                        ? language === "Telugu" ? "పథకం మ్యాచ్" : language === "Hindi" ? "योजना मिलान" : language === "Tamil" ? "திட்டம் பொருத்தம்" : "Scheme Match"
                        : language === "Telugu" ? "సిస్టమ్ నోటిస్" : language === "Hindi" ? "सिस्टम नोटिस" : language === "Tamil" ? "கணினி அறிவிப்பு" : "System Notice"}
                  </span>
                  <h2 className="notif-detail-title">{selectedNotif.detail.heading}</h2>
                  <span className="notif-detail-time">{selectedNotif.time}</span>
                </div>
                <button
                  type="button"
                  className="notif-detail-close"
                  onClick={() => setSelectedNotif(null)}
                  aria-label="Close"
                >×</button>
              </div>

              <div className="notif-detail-body">
                <p className="notif-detail-desc">{selectedNotif.detail.body}</p>

                <div className="notif-detail-grid">
                  <div className="notif-detail-section">
                    <h4>{language === "Telugu" ? "అర్హత వివరాలు" : language === "Hindi" ? "पात्रता विवरण" : language === "Tamil" ? "தகுதி விவரங்கள்" : "Eligibility Details"}</h4>
                    <ul className="notif-detail-list">
                      {selectedNotif.detail.eligibility.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="notif-detail-section">
                    <h4>{language === "Telugu" ? "ప్రయోజనం" : language === "Hindi" ? "लाभ" : language === "Tamil" ? "பலன்" : "Benefit"}</h4>
                    <p className="notif-benefit-text">{selectedNotif.detail.benefit}</p>

                    <h4 className="notif-deadline-label">{language === "Telugu" ? "చివరి తేదీ" : language === "Hindi" ? "अंतिम तिथि" : language === "Tamil" ? "கடைசி தேதி" : "Deadline"}</h4>
                    <p className={`notif-deadline-value ${selectedNotif.detail.deadline !== "N/A" && selectedNotif.detail.deadline !== "Varies by scheme — check each scheme for deadlines" && selectedNotif.detail.deadline !== "वर्तించదు" && selectedNotif.detail.deadline !== "लागू नहीं" && selectedNotif.detail.deadline !== "பொருந்தாது" ? "has-deadline" : ""}`}>
                      📅 {selectedNotif.detail.deadline}
                    </p>
                  </div>
                </div>

                {selectedNotif.detail.steps.length > 0 && (
                  <div className="notif-detail-section notif-steps-section">
                    <h4>{language === "Telugu" ? "దరఖాస్తు చేయడానికి దశలు" : language === "Hindi" ? "आवेदन के चरण" : language === "Tamil" ? "விண்ணப்பிக்கும் படிகள்" : "How to Apply"}</h4>
                    <ol className="notif-steps-list">
                      {selectedNotif.detail.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {selectedNotif.detail.documents.length > 0 && (
                  <div className="notif-detail-section">
                    <h4>{language === "Telugu" ? "అవసరమైన పత్రాలు" : language === "Hindi" ? "आवश्यक दस्तावेज़" : language === "Tamil" ? "தேவையான ஆவணங்கள்" : "Required Documents"}</h4>
                    <div className="notif-docs-grid">
                      {selectedNotif.detail.documents.map((doc, i) => (
                        <span key={i} className="notif-doc-chip">📄 {doc}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="notif-detail-footer">
                  {selectedNotif.detail.link && (
                    <a
                      href={selectedNotif.detail.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="notif-apply-btn"
                    >
                      {language === "Telugu" ? "పోర్టల్‌కి వెళ్ళండి →" : language === "Hindi" ? "पोर्टल पर जाएं →" : language === "Tamil" ? "போர்டலுக்கு செல்லுங்கள் →" : "Visit Portal →"}
                    </a>
                  )}
                  <button
                    type="button"
                    className="notif-ask-ai-btn"
                    style={{
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.85rem"
                    }}
                    onClick={() => askGovAIAboutNotif(selectedNotif)}
                  >
                    💬 {language === "Telugu" ? "మరింత GovAI అడగండి" : language === "Hindi" ? "GovAI से इसके बारे में पूछें" : language === "Tamil" ? "GovAI-யிடம் மேலும் கேளுங்கள்" : "Ask GovAI Guide"}
                  </button>
                  {(selectedNotif.type === "scholarship" || selectedNotif.type === "match") && (
                    <button
                      type="button"
                      className="notif-explore-btn"
                      onClick={() => { setActiveView("Ask GovAI"); setSelectedNotif(null); }}
                    >
                      {language === "Telugu" ? "పథకాలు చూడండి" : language === "Hindi" ? "योजनाएं देखें" : language === "Tamil" ? "திட்டங்களை காண்க" : "Browse Schemes"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="notif-detail-dismiss"
                    onClick={() => setSelectedNotif(null)}
                  >
                    {language === "Telugu" ? "మూసివేయి" : language === "Hindi" ? "बंद करें" : language === "Tamil" ? "மூடு" : "Dismiss"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === "Ask GovAI" && (
          <>
            <section className="welcome-row">
              <div>
                <h2>
                  {text.greeting}, {authUser} <span className="sun">✦</span>
                </h2>
                <p>{text.tagline}</p>
              </div>
              <div className="status-pill">
                <span className="status-dot" /> {text.kbUpdated}{" "}
                <strong>{text.today}</strong>
              </div>
            </section>
            <section className="ask-grid">
              <div className="conversation-panel panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-label">{text.conversation}</span>
                    <h3>{text.ask}</h3>
                  </div>
                  <button
                    className="clear-button"
                    onClick={() => {
                      setSubmittedQuestion("");
                      setBackendAnswer("");
                    }}
                  >
                    {text.clear}
                  </button>
                </div>
                <div className="chat-area">
                  <div className="message assistant">
                    <div className="bot-avatar">G</div>
                    <div>
                      <span className="message-meta">
                        GovAI <time>09:41 AM</time>
                      </span>
                      <p>{text.intro}</p>
                      <div className="suggestions">
                        <button
                          onClick={() =>
                            setQuestion(text.suggestScholarshipQuery)
                          }
                        >
                          {text.suggestScholarship} <span>→</span>
                        </button>
                          <button
                            onClick={() =>
                              setQuestion(text.suggestFeeSupportQuery)
                            }
                          >
                            {text.suggestFeeSupport} <span>→</span>
                          </button>
                      </div>
                    </div>
                  </div>
                  {submittedQuestion && (
                    <div className="message user">
                      <div>
                        <span className="message-meta">
                          You <time>now</time>
                        </span>
                        <p>{submittedQuestion}</p>
                      </div>
                      <div className="avatar small">{getInitials(authUser)}</div>
                    </div>
                  )}
                  {isLoading && (
                    <p className="loading-message">
                      {text.checkingBackend}
                    </p>
                  )}
                  {backendAnswer && (
                    <div className="message assistant backend-message">
                      <div className="bot-avatar">G</div>
                      <div>
                        <span className="message-meta">
                          GovAI <time>just now</time>
                        </span>
                        <p>{backendAnswer}</p>
                      </div>
                    </div>
                  )}
                </div>
                <form className="composer" onSubmit={submitQuestion}>
                  <input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder={text.placeholder}
                    aria-label={text.ask}
                  />
                  <button
                    type="button"
                    className="voice-button"
                    aria-label={text.voiceInput}
                  >
                    ◉
                  </button>
                  <button
                    className="send-button"
                    type="submit"
                    aria-label={text.sendQuestion}
                    disabled={isLoading}
                  >
                    ↑
                  </button>
                </form>
              </div>
              <aside className="profile-panel panel">
                <div className="panel-heading">
                  <div>
                    <span className="panel-label">{text.profile}</span>
                    <h3>{text.personalize}</h3>
                  </div>
                  <span className="edit-mark">✎</span>
                </div>
                <p className="profile-intro">{text.save}</p>
                <div className="form-fields">
                  <label>
                    {text.educationLevel}
                    <select
                      value={profileForm.education}
                      onChange={(event) =>
                        updateProfileForm("education", event.target.value)
                      }
                    >
                      {ALL_EDUCATIONS.map((edu) => (
                        <option value={edu} key={edu}>
                          {getLocalizedEducation(edu, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {text.stateUT}
                    <select
                      value={profileForm.state}
                      onChange={(event) =>
                        updateProfileForm("state", event.target.value)
                      }
                    >
                      {ALL_STATES.map((st) => (
                        <option value={st} key={st}>
                          {getLocalizedState(st, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {text.socialCategory}
                    <select
                      value={profileForm.category}
                      onChange={(event) =>
                        updateProfileForm("category", event.target.value)
                      }
                    >
                      {ALL_CATEGORIES.map((cat) => (
                        <option value={cat} key={cat}>
                          {getLocalizedCategory(cat, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {text.familyIncome}{" "}
                    <span className="optional">{text.optional}</span>
                    <input
                      value={profileForm.income}
                      onChange={(event) =>
                        updateProfileForm("income", event.target.value)
                      }
                      placeholder={text.incomePlaceholder}
                    />
                  </label>
                </div>
                <button
                  className="profile-button"
                  onClick={handleUpdateProfile}
                >
                  {text.update} <span>→</span>
                </button>
              </aside>
            </section>
            <section className="matched-section">
              <div className="section-heading">
                <div>
                  <span className="panel-label">{text.basedOnProfile}</span>
                  <h3>
                    {text.potentialSchemesIn} {localizedStateName}{" "}
                    <span className="result-count">{allSchemes.length} {text.resultsCount}</span>
                  </h3>
                </div>
                <button
                  className="text-button"
                  onClick={() => setShowAllSchemes((visible) => !visible)}
                >
                  {showAllSchemes ? text.showFewerSchemes : text.viewAllSchemes} <span>{showAllSchemes ? "↑" : "↗"}</span>
                </button>
              </div>
              <div className="scheme-grid">
                {visibleSchemes.map((scheme) => (
                  <article
                    className="scheme-card"
                    key={scheme.name}
                    onClick={() => setSelectedScheme(scheme)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setSelectedScheme(scheme);
                      }
                    }}
                  >
                    <div className="scheme-top">
                      <span className="scheme-icon">✥</span>
                      <span className="match">{scheme.fit} {text.match}</span>
                    </div>
                    <span className="scheme-tag">{scheme.tag}</span>
                    <h4>{scheme.name}</h4>
                    <p>{scheme.detail}</p>
                    <div className="scheme-foot">
                      <a
                        className="scheme-link"
                        href={scheme.link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {text.source}: {scheme.source} ↗
                      </a>
                      <button
                        className={savedSchemeKeys.includes(scheme.key) ? "saved" : ""}
                        aria-label={
                          savedSchemeKeys.includes(scheme.key)
                            ? `${text.removeSaved}: ${scheme.name}`
                            : `${text.saveScheme}: ${scheme.name}`
                        }
                        title={
                          savedSchemeKeys.includes(scheme.key)
                            ? text.removeSaved
                            : text.saveScheme
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSaveScheme(scheme.key);
                        }}
                      >
                        {savedSchemeKeys.includes(scheme.key) ? "♥" : "♡"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {selectedScheme && (
                <div className="scheme-details" role="dialog" aria-label={`${selectedScheme.name} details`}>
                  <div>
                    <span className="panel-label">{text.schemeDetails}</span>
                    <h3>{selectedScheme.name}</h3>
                    <p>{selectedScheme.detail}</p>
                  </div>
                  <button className="details-close" onClick={() => setSelectedScheme(null)} aria-label={text.closeDetails}>×</button>
                  <div className="details-grid">
                    <div><strong>{text.likelyEligibility}</strong><span>{localizedEducationName} {text.studentsIn} {localizedStateName}</span></div>
                    <div><strong>{text.potentialBenefit}</strong><span>{text.tuitionBenefit}</span></div>
                    <div><strong>{text.documents}</strong><span>{text.docProof}</span></div>
                    <div>
                      <strong>{text.officialSource}</strong>
                      <a className="scheme-link" href={selectedScheme.link} target="_blank" rel="noreferrer">
                        {selectedScheme.source} ↗
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeView === "Saved Schemes" && (
          <section className="profile-view panel">
            <span className="panel-label">{text.navSaved.toUpperCase()}</span>
            <h2>{text.savedSchemesTitle}</h2>
            <p>{text.savedSchemesDesc}</p>

            {savedSchemes.length > 0 ? (
              <div className="saved-schemes-view">
                <div className="scheme-grid">
                  {savedSchemes.map((scheme) => (
                    <article
                      className="scheme-card"
                      key={scheme.name}
                      onClick={() => setSelectedScheme(scheme)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          setSelectedScheme(scheme);
                        }
                      }}
                    >
                      <div className="scheme-top">
                        <span className="scheme-icon">✥</span>
                        <span className="match">{scheme.fit} {text.match}</span>
                      </div>
                      <span className="scheme-tag">{scheme.tag}</span>
                      <h4>{scheme.name}</h4>
                      <p>{scheme.detail}</p>
                      <div className="scheme-foot">
                          <a
                            className="scheme-link"
                            href={scheme.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {text.source}: {scheme.source} ↗
                          </a>
                        <button
                          className="saved"
                          aria-label={`${text.removeSaved}: ${scheme.name}`}
                          title={text.removeSaved}
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSaveScheme(scheme.key);
                          }}
                        >
                          ♥
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {selectedScheme && (
                  <div className="scheme-details" role="dialog" aria-label={`${selectedScheme.name} details`}>
                    <div>
                      <span className="panel-label">{text.schemeDetails}</span>
                      <h3>{selectedScheme.name}</h3>
                      <p>{selectedScheme.detail}</p>
                    </div>
                    <button className="details-close" onClick={() => setSelectedScheme(null)} aria-label={text.closeDetails}>×</button>
                    <div className="details-grid">
                      <div><strong>{text.likelyEligibility}</strong><span>{localizedEducationName} {text.studentsIn} {localizedStateName}</span></div>
                      <div><strong>{text.potentialBenefit}</strong><span>{text.tuitionBenefit}</span></div>
                      <div><strong>{text.documents}</strong><span>{text.docProof}</span></div>
                      <div>
                        <strong>{text.officialSource}</strong>
                        <a className="scheme-link" href={selectedScheme.link} target="_blank" rel="noreferrer">
                          {selectedScheme.source} ↗
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ marginTop: "24px" }}>
                  <button
                    className="profile-button"
                    onClick={() => setActiveView("Ask GovAI")}
                  >
                    {text.exploreMoreSchemes} <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-saved">
                <p>{text.noSavedSchemes}</p>
                <button
                  className="profile-button"
                  style={{ margin: "0 auto", width: "220px" }}
                  onClick={() => setActiveView("Ask GovAI")}
                >
                  {text.returnAsk} <span>→</span>
                </button>
              </div>
            )}
          </section>
        )}

        {activeView === "My Eligibility" && (
          <section className="profile-view panel">
            <span className="panel-label">{text.navEligibility.toUpperCase()}</span>
            <h2>{text.eligibilityProfile}</h2>
            <p>{text.eligibilityDesc}</p>

            <div className="account-details">
              <div className="avatar profile-avatar">{getInitials(authUser)}</div>
              <div>
                <strong>{authUser}</strong>
                <span>{authEmail || text.emailNotAvailable}</span>
              </div>
            </div>

            <div className="eligibility-grid">
              <div className="eligibility-card">
                <span>{text.educationLevel}</span>
                <strong>{getLocalizedEducation(appliedProfile.education, language)}</strong>
              </div>
              <div className="eligibility-card">
                <span>{text.stateLabel}</span>
                <strong>{localizedStateName}</strong>
              </div>
              <div className="eligibility-card">
                <span>{text.categoryLabel}</span>
                <strong>{getLocalizedCategory(appliedProfile.category, language)}</strong>
              </div>
              <div className="eligibility-card">
                <span>{text.incomeLabel}</span>
                <strong>{appliedProfile.income || text.notSpecified}</strong>
              </div>
            </div>

            <button
              className="profile-button"
              onClick={() => setActiveView("Ask GovAI")}
            >
              {text.returnAsk} <span>→</span>
            </button>
          </section>
        )}

        <footer>
          <span>
            {text.footerNotice}
          </span>
          <span>{text.footerLinks}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
