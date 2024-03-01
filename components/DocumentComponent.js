import React, {useEffect, useState} from 'react';
import {StyleSheet, View, Text, Button, TouchableOpacity} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from "expo-image-picker";
import {AntDesign, Ionicons} from "@expo/vector-icons";
import * as Device from "expo-device";
import {getUUID} from '../SecureStorageService';
import {initSocket} from '../Socket';
import { Platform } from 'react-native';
import * as MediaLibrary from "expo-media-library";
export default function DocumentComponent({token, tk_type, roomId, staff_id, isDarkTheme}) {
  // const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [uuid, setUuid] = useState(null);
  const socket = initSocket(token, tk_type)

  console.log(roomId)
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
  const openDocumentPicker = async () => {
      const result = await DocumentPicker.getDocumentAsync({});

      try {

      let formData = new FormData();
      if(String(Platform.OS) === 'ios'){
        formData.append('file', {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          name: result.assets[0].name
        });
        fetch(`http://172.20.15.18:8000/upload/${roomId}`, {
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
            socket.emit('file', data)
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }else{
        formData.append('file', {
          uri: result.assets[0].uri,
          type: result.assets[0].mimeType,
          name: result.assets[0].name
        });
        fetch(`http://172.20.15.18:8000/upload/${roomId}`, {
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
            socket.emit('file', data)
            console.log(data, 'ответ с сервера');
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
      console.log(formData)

    } catch (error) {
      console.error('Error processing file:', error);
    }


      if (!result.canceled) {
        // loadDbDoc(result);
      }

      // console.log(result)
  };
  return (
      <View style={styles.container}>
        <TouchableOpacity onPress={openDocumentPicker} style={isDarkTheme ? styles.buttonDark : styles.button}>
          <AntDesign name="cloudo" size={24} color="#00862b" style={{paddingRight:5}}/>
          <Text style={styles.buttonText}>Выбрать из файлов</Text>
        </TouchableOpacity>
        {/*<TouchableOpacity onPress={openImagePicket} style={styles.button}>*/}
        {/*  <Ionicons name="image-outline" size={24} color="#00862b" style={{paddingRight:5}} />*/}
        {/*  <Text style={styles.buttonText}>Выбрать из галереи</Text>*/}
        {/*</TouchableOpacity>*/}
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
    marginBottom: 120,
    alignItems: 'center',
  },
  buttonDark:{
    display:"flex",
    flexDirection:"row",
    backgroundColor: '#333334',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    color: "#00862b",
    fontWeight:"bold"
  },
});

