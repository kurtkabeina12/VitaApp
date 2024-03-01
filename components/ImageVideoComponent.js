import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, Button, TouchableOpacity} from 'react-native';
import * as ImagePicker from "expo-image-picker";
import {Entypo, Ionicons} from "@expo/vector-icons";
import {useNavigation} from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';
import {getUUID} from '../SecureStorageService';
import * as Device from "expo-device";
import {initSocket} from '../Socket';
import { Platform } from 'react-native';
import CameraComponent from "./CameraComponent";
export default function ImageVideoComponent({token, tk_type, roomId, staff_id, isDarkTheme}) {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);
  const [uuid, setUuid] = useState(null);
  const socket = initSocket(token, tk_type)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const uuid = await getUUID();
        setUuid(uuid);
        // console.log(uuid);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };

    fetchToken();
  }, []);

  const openImagePicket = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    // if (!result.canceled) {
      console.log(result);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [],
        { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG } // Сжать изображение до 50% качества в формате JPEG
      );
      console.log(manipResult)
      let response = await fetch(manipResult.uri);
      let blob = await response.blob();

      let base64 = await blobToBase64(blob);
      let formData = new FormData();
      if(String(Platform.OS) === 'ios'){
        formData.append('files', {
          uri: manipResult.uri,
          type: "image/jpeg",
          name: 'myImage.jpeg'
        });
        fetch(`http://172.20.15.18:8000/upload_img/${roomId}`, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'authorization': tk_type + " " + token,
            'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
          },
          method: 'POST',
          body: formData,
        })
          .then(response => response.json())
          .then(data => {
            console.log(data, 'ответ с сервера');
            socket.emit('img', data)
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }else{
        formData.append('files', {
          // uri: result.assets[0].uri,
          uri: manipResult.uri,
          type: "image/jpeg",
          name: 'myImage.jpeg'
        });
        fetch(`http://172.20.15.18:8000/upload_img/${roomId}`, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'authorization': tk_type + " " + token,
            'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
          },
          method: 'POST',
          body: formData,
        })
          .then(response => response.json())
          .then(data => {
            console.log(data, 'ответ с сервера');
            socket.emit('img', data)
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
      console.log(formData)

    } catch (error) {
      console.error('Error processing image:', error);
    }

    // const manipResult = await ImageManipulator.manipulateAsync(
    //       result.assets[0].uri,
    //       [],
    //       { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Сжать изображение до 50% качества в формате JPEG
    //     );
    //     let response = await fetch(manipResult.uri);
    //     let blob = await response.blob();
    //     // let base64 = await blobToBase64(blob);
    //     // setImageUri(base64);
    //     // const date = new Date();
    //     // const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    //     // const ImageObj ={
    //     //   image: imageUri,
    //     //   staff_id: staff_id,
    //     //   roomId:roomId,
    //     //   msgtext:'',
    //     //   msgdt: dateString,
    //     // }
    // let formData = new FormData();
    // formData.append('image', blob, 'myImage.jpeg');
    //
    //   fetch('http://172.20.15.18:8000/upload', {
    //     method: 'POST',
    //     // headers: {
    //     // 'Content-Type': 'multipart/form-data'
    //     // },
    //     body: formData,
    //   })
    //     .then(response => response.json())
    //     .then(data => {
    //       console.log(data);
    //     })
    //     .catch(error => {
    //       console.error('Error:', error);
    //     });
  };
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const createImage = () => {
    console.log(roomId, 'roomIdCreateImage');
    navigation.navigate('Camera', {
      roomId: roomId,
      staff_id: staff_id,
      token: token,
      tk_type: tk_type
    });
    console.log('1');
  };


  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
      <TouchableOpacity onPress={createImage} style={isDarkTheme ? styles.buttonDark : styles.button}>
        <Entypo name="camera" size={24} color="#00862b" style={{paddingRight:5}} />
        <Text style={styles.buttonText}>Создать изображение</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={openImagePicket} style={isDarkTheme ? styles.buttonDark : styles.button}>
        <Ionicons name="image-outline" size={24} color="#00862b" style={{paddingRight:5}} />
        <Text style={styles.buttonText}>Выбрать из галереи</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop:'20%'
  },
  button: {
    display:"flex",
    flexDirection:"row",
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonDark:{
    display:"flex",
    flexDirection:"row",
    backgroundColor: '#333334',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: "#00862b",
    fontWeight:"bold"
  },
  buttons:{
    marginBottom:55
  }
});

