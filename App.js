import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Button,
  ActivityIndicator,
} from "react-native";

import Config from "react-native-config";

import { Picker } from "@react-native-picker/picker";
import * as Clipboard from "expo-clipboard";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Configuration, OpenAIApi } from "openai";

const VITE_GOOGLE_API_KEY = Config.GOOGLE_API_KEY;
const VITE_OPENAI_KEY = Config.OPENAI_API_KEY;
const VITE_DEEPL_API_KEY = Config.DEEPL_API_KEY;
export default function App() {
  const [formData, setFormData] = useState({
    language: "French",
    message: "",
    model: "gemini-1.5-flash",
  });
  const [error, setError] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [translation, setTranslation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const supportedLanguages = {
    "gpt-3.5-turbo": [
      "Spanish",
      "French",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
      "Japanese",
    ],
    "gpt-4": [
      "Spanish",
      "French",
      "Telugu",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
      "Japanese",
      "Korean",
    ],
    "gpt-4-turbo": [
      "Spanish",
      "French",
      "Telugu",
      "Japanese",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
      "Korean",
      "Arabic",
    ],
    "gemini-1.5-pro-001": [
      "Spanish",
      "French",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
    ],
    "gemini-1.5-flash-001": [
      "Spanish",
      "French",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
    ],
    "gemini-1.5-pro-002": [
      "Spanish",
      "French",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
      "Japanese",
      "Korean",
    ],
    "gemini-1.5-flash-002": [
      "Spanish",
      "French",
      "German",
      "Italian",
      "Portuguese",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
      "Japanese",
      "Korean",
      "Arabic",
    ],
    deepl: [
      "Spanish",
      "French",
      "Japanese",
      "German",
      "Italian",
      "Dutch",
      "Russian",
      "Chinese (Simplified)",
      "Polish",
      "Portuguese",
    ],
  };
  const deepLLanguageCodes = {
    Spanish: "ES",
    French: "FR",
    German: "DE",
    Italian: "IT",
    Dutch: "NL",
    Russian: "RU",
    "Chinese (Simplified)": "ZH",
    Japanese: "JA",
    Portuguese: "PT",
    Polish: "PL",
  };
  const exportToCSV = async () => {
    try {
      const response = await fetch(
        "https://translation-app-ooq8.onrender.com/api/export",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export data to CSV");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "output_file.csv"; // Specify the filename
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // Clean up URL object
    } catch (error) {
      console.error("Export error:", error);
      setError("Failed to export data. Please try again.");
    }
  };
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };
  const translateWithDeepL = async (text, toLang) => {
    try {
      const targetLangCode = deepLLanguageCodes[toLang];
      if (!targetLangCode) {
        throw new Error(`Unsupported language: ${toLang}`);
      }

      const response = await fetch(`https://api-free.deepl.com/v2/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          auth_key: VITE_DEEPL_API_KEY, // Ensure this variable is defined
          text: text,
          source_lang: "EN", // Fixed to English source
          target_lang: targetLangCode, // Use the mapped language code
        }),
      });

      if (!response.ok) {
        throw new Error(
          `DeepL API request failed with status ${response.status}`
        );
      }

      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error("DeepL Translation Error:", error);
      throw new Error(
        "Failed to translate with DeepL. Please check the API key, language codes, or try again later."
      );
    }
  };

  const translate = async () => {
    const { language, message, model } = formData;

    try {
      setIsLoading(true);

      let translatedText = "";

      if (model.startsWith("gpt")) {
        const response = await VITE_OPENAI_KEY.createChatCompletion({
          model: model,
          messages: [
            {
              role: "system",
              content: `Translate this sentence into ${language}.`,
            },
            { role: "user", content: message },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });
        translatedText = response.data.choices[0].message.content.trim();
      } else if (model.startsWith("gemini")) {
        const genAIModel = VITE_GOOGLE_API_KEY.getGenerativeModel({
          model: "gemini-1.5-flash",
        });
        const prompt = `Translate the text: ${message} into ${language}`;

        const result = await genAIModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        translatedText = response.text();
      } else if (model === "deepl") {
        translatedText = await translateWithDeepL(message, language);
      }

      setTranslation(translatedText);
      setIsLoading(false);

      // Send translation result to the backend
      await fetch(
        "https://translation-app-ooq8.onrender.com/api/translations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            original_message: message,
            translated_message: translatedText,
            language: language,
            model: model,
            ranking: 4,
            rating: 4,
            classification: "translation",
          }),
        }
      );
    } catch (error) {
      console.error("Translation error:", error);
      setError("Translation failed. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOnSubmit = (e) => {
    e.preventDefault();
    if (!formData.message) {
      setError("Please enter the message.");
      return;
    }
    translate();
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(translation)
      .then(() => displayNotification())
      .catch((err) => console.error("Failed to copy:", err));
  };

  const displayNotification = () => {
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };
  return (
    <View style={styles.container}>
      <StatusBar></StatusBar>
      <View style={styles.sidebar}>
        <Text style={styles.heading}>Models</Text>
        <View style={styles.choices}>
          {[
            "gpt-3.5-turbo",
            "gpt-4",
            "gpt-4-turbo",
            "gemini-1.5-pro-001",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro-002",
            "gemini-1.5-flash-002",
            "deepl",
          ].map((model) => (
            <TouchableOpacity
              key={model}
              style={[
                styles.modelOption,
                formData.model === model && styles.active,
              ]}
              onPress={() => setFormData({ ...formData, model })}
            >
              <Text>{model}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.main}>
        <Text style={styles.title}>Translation App</Text>
        <Text>Selected Model: {formData.model}</Text>
        <View style={styles.choicesLang}>
          <Text style={styles.label}>To:</Text>
          <Picker
            selectedValue={formData.language}
            onValueChange={(itemValue) =>
              setFormData({ ...formData, language: itemValue })
            }
          >
            {supportedLanguages[formData.model]?.map((lang) => (
              <Picker.Item key={lang} label={lang} value={lang} />
            ))}
          </Picker>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="Type your message here...."
          value={formData.message}
          onChangeText={(text) => setFormData({ ...formData, message: text })}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button title="Translate" onPress={handleOnSubmit} />
        <View style={styles.translation}>
          {isLoading ? (
            <BeatLoader size={12} color="red" />
          ) : (
            <Text>{translation}</Text>
          )}
        </View>
        {showNotification && (
          <View style={styles.notification}>
            <Text style={styles.notificationText}>Copied to clipboard!</Text>
          </View>
        )}
        <Button
          title="Export to CSV"
          onPress={exportToCSV}
          style={styles.exportBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 25,
  },
  sidebar: {
    width: "30%",
    backgroundColor: "#f4f4f4",
    padding: 20,
  },
  main: {
    width: "75%",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modelOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  active: {
    backgroundColor: "#e0e0e0",
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
  },
  textInput: {
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  error: {
    color: "red",
  },
  copyButton: {
    padding: 10,
    backgroundColor: "#d4d4d4",
    marginTop: 10,
  },
  translation: {
    fontSize: 18,
    marginTop: 20,
  },
});
