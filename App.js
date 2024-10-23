import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Button, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';


export default function App() {
  const [formData, setFormData] = useState({
    model: 'gpt-3.5-turbo',
    language: 'English',
    message: '',
  });
  const [translation, setTranslation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  
  const supportedLanguages = {
    "gpt-3.5-turbo": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese"],
    "gpt-4": ["Spanish", "French", "Telugu", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
    "gpt-4-turbo": ["Spanish", "French", "Telugu", "Japanese", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Korean", "Arabic"],
    "gemini-1.5-pro-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
    "gemini-1.5-flash-001": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)"],
    "gemini-1.5-pro-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean"],
    "gemini-1.5-flash-002": ["Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Russian", "Chinese (Simplified)", "Japanese", "Korean", "Arabic"],
    "deepl": ["Spanish", "French", "Japanese", "German", "Italian", "Dutch", "Russian", "Chinese (Simplified)", "Polish", "Portuguese"],
  };
  const deepLLanguageCodes = {
    "Spanish": "ES",
    "French": "FR",
    "German": "DE",
    "Italian": "IT",
    "Dutch": "NL",
    "Russian": "RU",
    "Chinese (Simplified)": "ZH",
    "Japanese": "JA",
    "Portuguese": "PT",
    "Polish": "PL",
  };
  const handleInputChange = (name, value) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setError('');
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setString(translation);
      alert('Translation copied to clipboard!');
    } catch (error) {
      setError('Failed to copy translation.');
    }
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
          auth_key: Config.VITE_DEEPL_API_KEY, // Ensure this variable is defined
          text: text,
          source_lang: "EN", // Fixed to English source
          target_lang: targetLangCode, // Use the mapped language code
        }),
      });
  
      if (!response.ok) {
        throw new Error(`DeepL API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      return data.translations[0].text;
    } catch (error) {
      console.error("DeepL Translation Error:", error);
      throw new Error("Failed to translate with DeepL. Please check the API key, language codes, or try again later.");
    }
  };
  const translate = async () => {
    const { language, message, model } = formData;

    try {
      setIsLoading(true);

      let translatedText = '';

      if (model.startsWith('gpt')) {
        const response = await openai.createChatCompletion({
          model: model,
          messages: [
            {
              role: 'system',
              content: `Translate this sentence into ${language}.`,
            },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
          max_tokens: 100,
        });
        translatedText = response.data.choices[0].message.content.trim();
      } else if (model.startsWith('gemini')) {
        const genAIModel = googleGenAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
        });
        const prompt = `Translate the text: ${message} into ${language}`;
        const result = await genAIModel.generateContent(prompt);
        const response = await result.response;
        translatedText = response.text();
      } else if (model === 'deepl') {
        translatedText = await translateWithDeepL(message, language);
      }

      setTranslation(translatedText);
      setIsLoading(false);

      // Send translation result to the backend
      await fetch('https://translation-app-ooq8.onrender.com/api/translations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_message: message,
          translated_message: translatedText,
          language: language,
          model: model,
        }),
      });
    } catch (error) {
      console.error('Translation error:', error);
      setError('Translation failed. Please try again.');
      setIsLoading(false);
    }
  };

  const handleOnSubmit = () => {
    const { message } = formData;

    if (!message) {
      setError('Please enter a message to translate.');
      return;
    }

    translate();
  };

  return (
    
    <View style={styles.container}>    
      <View style={styles.sidebar}>
        <Text style={styles.heading}>Models</Text>
        {["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gemini-1.5-pro-001", "gemini-1.5-flash-001","gemini-1.5-pro-002", "gemini-1.5-flash-002","deepl"].map((model) => (
          <TouchableOpacity
            key={model}
            style={[styles.modelOption, formData.model === model && styles.active]}
            onPress={() => handleInputChange("model", model)}
          >
            <Text>{model}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.main}>
        <Text style={styles.title}>Translation App</Text>
        <Text>Selected Model: {formData.model}</Text>
        <Picker
          selectedValue={formData.language}
          onValueChange={(itemValue) => handleInputChange("language", itemValue)}
        >
          {supportedLanguages[formData.model]?.map((lang) => (
            <Picker.Item key={lang} label={lang} value={lang} />
          ))}
        </Picker>

        <TextInput
          style={styles.textInput}
          placeholder="Type your message here..."
          value={formData.message}
          onChangeText={(text) => handleInputChange("message", text)}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Translate" onPress={handleOnSubmit} />

        <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
          <Text>Copy Translation</Text>
        </TouchableOpacity>

        {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
        <Text style={styles.translation}>{translation}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  sidebar: {
    width: "28%",
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
    fontSize: 30,
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
    backgroundColor: "#f0f0f0",
    marginTop: 10,
  },
  translation: {
    fontSize: 18,
    marginTop: 20,
  },
});
