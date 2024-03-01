import React, {useEffect, useState, useRef} from 'react';
import {StyleSheet, View, Text,Button, TouchableOpacity} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { Platform } from 'react-native';
import {initSocket} from "../Socket";
import {getUUID} from "../SecureStorageService";
import * as Device from "expo-device";
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from "expo-media-library";
export default function CameraComponent({route}) {
  const {staff_id, token, tk_type} = route.params || {};
  const roomId = Array.isArray(route.params.roomId) ? route.params.roomId.map(room => room.id)[0] : route.params.roomId;
  // const [type, setType] = useState(CameraType.back);
  // const [permission, requestPermission] = Camera.useCameraPermissions();
  // const cameraRef = useRef(null);
  const navigation = useNavigation();
  const [uuid, setUuid] = useState(null);
  const socket = initSocket(token, tk_type)
  // const [hasPermission, setHasPermission] = useState(null)
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [image, setImage] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);

  console.log(roomId, staff_id, token, tk_type, 'CameraComponent')
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
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');
    })();
  }, []);
  const takePicture = async () => {
    if(camera){
      const data = await camera.takePictureAsync(null)
      console.log(data)
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
        }
      const asset = await MediaLibrary.createAssetAsync(data.uri);
      MediaLibrary.createAlbumAsync('Expo', asset)
        .then(() => {
          console.log('Album created!');
        })
        .catch(error => {
          console.log('err', error);
        });
      const manipResult = await ImageManipulator.manipulateAsync(
        data.uri,
        [],
        { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG } // Сжать изображение до 50% качества в формате JPEG
      );
      console.log(manipResult)
      let formData = new FormData();
          formData.append('files', {
            uri: manipResult.uri,
            type: 'image/jpeg',
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
          navigation.goBack();
    }
  }

  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View style={{ flex: 1}}>
      <Button
        title="Перевернуть камера"
        onPress={() => {
          setType(
            type === Camera.Constants.Type.back
              ? Camera.Constants.Type.front
              : Camera.Constants.Type.back
          );
        }}>
      </Button>
      <View style={styles.cameraContainer}>
        <Camera
          ref={ref => setCamera(ref)}
          style={styles.fixedRatio}
          type={type}
          ratio={'1:1'} />
      </View>

      <Button title="Сделать фотографию" onPress={() => takePicture()} />
    </View>
  );
}
const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  fixedRatio:{
    flex: 1,
    // aspectRatio: 1
  }
})

//   return (
//     <Camera style={styles.camera} type={type} ref={cameraRef}>
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity style={styles.button} onPress={toggleCameraType}>
//           <Text style={styles.text}>Перевернуть камера</Text>
//         </TouchableOpacity>
//       </View>
//       <TouchableOpacity style={styles.btnScreen} onPress={takeScreenshot}>
//       </TouchableOpacity>
//     </Camera>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   camera:{
//     flex:1,
//     zIndex:1
//   },
//   button: {
//     display:"flex",
//     flexDirection:"row",
//     backgroundColor: '#ffffff',
//     borderRadius: 10,
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     marginBottom: 10,
//     alignItems: 'center',
//   },
//   btnScreen:{
//     position: 'absolute',
//     bottom: 45,
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     marginLeft:190,
//     backgroundColor: '#ffffff',
//   },
//   buttonText: {
//     fontSize: 14,
//     color: "#00862b",
//     fontWeight:"bold"
//   },
// });
