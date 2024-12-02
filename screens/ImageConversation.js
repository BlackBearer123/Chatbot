import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ImageConversation({ navigation }) {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("es");
  const [extractedText, setExtractedText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Sorry, we need camera roll permissions to make this work!',
            [{ text: 'OK', onPress: () => console.log('Permission denied') }]
          );
        }
      }
    })();
  }, []);

  // Function to pick an image
  const pickImage = async () => {
    try {
      console.log("Starting image picker...");
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log("Permission result:", permissionResult);
      
      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'You need to enable permission to access the image library',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
        aspect: undefined,
        allowsMultipleSelection: false,
      });

      console.log("Picker result:", JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets?.length > 0) {
        const imageUri = result.assets[0].uri;
        console.log("Selected image URI:", imageUri);
        setSelectedImage(imageUri);
        // Reset texts when new image is selected
        setExtractedText("");
        setTranslatedText("");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(
        'Error',
        'Failed to pick image: ' + error.message,
        [{ text: 'OK' }]
      );
    }
  };

  // Function to perform OCR and translation
  const processImage = async () => {
    if (!selectedImage) {
      Alert.alert("Error", "Please select an image first.");
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("image", {
      uri: selectedImage,
      name: "image.jpg",
      type: "image/jpeg",
    });
    formData.append("source_lang", sourceLang);
    formData.append("target_lang", targetLang);

    try {
      const response = await axios.post(
        "http://192.168.0.119:3000/ocr_translate",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        setExtractedText(response.data.extracted_text);
        setTranslatedText(response.data.translated_text);
      } else {
        Alert.alert("Error", "OCR and translation failed. Please try again.");
        console.error("Server response:", response);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Failed to process image: ${error.response ? error.response.data.error : error.message}`
      );
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Image Text Translator</Text>
        
        <View style={styles.languageSection}>
          <Text style={styles.label}>Source Language (Extract from):</Text>
          <Picker
            selectedValue={sourceLang}
            onValueChange={setSourceLang}
            style={styles.picker}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Spanish" value="es" />
            <Picker.Item label="French" value="fr" />
          </Picker>

          <Text style={styles.label}>Target Language (Translate to):</Text>
          <Picker
            selectedValue={targetLang}
            onValueChange={setTargetLang}
            style={styles.picker}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Spanish" value="es" />
            <Picker.Item label="French" value="fr" />
          </Picker>
        </View>

        <TouchableOpacity 
          style={styles.imagePicker} 
          onPress={pickImage}
          activeOpacity={0.7}
        >
          <Text style={styles.imagePickerText}>
            {selectedImage ? "Change Image" : "Select Image"}
          </Text>
        </TouchableOpacity>

        {selectedImage && (
          <View style={styles.imageSection}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <Button 
              title={isLoading ? "Processing..." : "Extract & Translate Text"} 
              onPress={processImage}
              disabled={isLoading}
            />
          </View>
        )}

        {extractedText ? (
          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>Extracted Text:</Text>
            <Text style={styles.resultText}>{extractedText}</Text>
          </View>
        ) : null}

        {translatedText ? (
          <View style={styles.resultSection}>
            <Text style={styles.resultLabel}>Translated Text:</Text>
            <Text style={styles.resultText}>{translatedText}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: "bold",
    textAlign: 'center',
  },
  languageSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    height: 50,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  imagePicker: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
  },
  imagePickerText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageSection: {
    marginBottom: 20,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  resultSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  resultText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
});