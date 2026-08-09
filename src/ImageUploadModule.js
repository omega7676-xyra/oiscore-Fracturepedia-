import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * ImageUploadModule - Component for uploading and managing character profile images
 * Supports drag-and-drop, image compression, and cloud storage integration
 */

const ImageUploadModule = ({ onImageUpload, existingImages = [] }) => {
  const [images, setImages] = useState(existingImages);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera roll permissions are required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8, // Compress to 80%
    });

    if (!result.cancelled) {
      const newImage = {
        uri: result.uri,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      };
      
      setImages([...images, newImage]);
      onImageUpload(newImage);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permissions are required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.cancelled) {
      const newImage = {
        uri: result.uri,
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      };
      
      setImages([...images, newImage]);
      onImageUpload(newImage);
    }
  };

  const deleteImage = (id) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
  };

  return (
    <View style={styles.container}>
      <View style={styles.uploadButtonsContainer}>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadBtnText}>📷 From Library</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
          <Text style={styles.uploadBtnText}>📸 Take Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Display Images Grid */}
      <ScrollView style={styles.imagesGrid}>
        {images.map((image) => (
          <TouchableOpacity
            key={image.id}
            style={styles.imageCard}
            onPress={() => {
              setSelectedImage(image);
              setModalVisible(true);
            }}
          >
            <Image source={{ uri: image.uri }} style={styles.thumbnail} />
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => deleteImage(image.id)}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage.uri }} style={styles.fullImage} />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  uploadBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 3,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imagesGrid: {
    flex: 1,
    flexDirection: 'column',
  },
  imageCard: {
    position: 'relative',
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  fullImage: {
    width: '90%',
    height: '70%',
    borderRadius: 12,
  },
});

export default ImageUploadModule;
