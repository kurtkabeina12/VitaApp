import React, {useRef} from 'react';
import {WebView} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';
import {StyleSheet} from 'react-native';
import * as Device from 'expo-device';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import * as SecureStore from 'expo-secure-store';
import forge from 'node-forge';

export default function WebViewScreen() {
  const navigation = useNavigation();
  // console.log(Device.osInternalBuildId, "NameBuild");
  // console.log(Device.osName, "NameOs");

  const onWebViewMessage = async (event) => {


// Функция для шифрования сообщения
    const encryptMessage = async (message, publicKey) => {
      try {
        const publicKeyObj = forge.pki.publicKeyFromPem(publicKey);
        const encrypted = publicKeyObj.encrypt(message, 'RSA-OAEP', {
          md: forge.md.sha256.create(),
        });
        return forge.util.encode64(encrypted);
      } catch (error) {
        console.error('Ошибка при шифровании сообщения:', error);
        return null;
      }
    };

// Использование функции для шифрования сообщения
    const publicKey = `-----BEGIN PUBLIC KEY----- 
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2Qc2tgGJnFs0mmSuDViR 
HGo6SOWuN82Q7+/7yG+aFWnT2tvQxIVxcPFjAZcPQHVVb2KqkAym0nGeqy++tq+g 
/LqpF6ZOibNenK5+NAjahaNFAa1tXOEzt1f4aXq9bjAKbYgV1JU1NiE0BgeNuF+d 
mP9TCqbXDOBj/v6GmVladaI+F3MOEfZc1EsovQk+ayqyYM4kuFm7+i9JEkZER5n4 
aBAvCKXrQePq7y50Qyb+ji5kPw9DbVIrjKhTQrXjTcEvk+PbPcTb1aU24nVO4Fua 
1B/hJGXvQLpaxE/Ko4kivUQv7ogTZLGqWXUf5KUvQYMgas+mRI7u+2DG14Ylc54p 
vwIDAQAB 
-----END PUBLIC KEY-----`;

    const messageToEncrypt = 'Твоё сообщение для шифрования';

// Вызов функции для шифрования
    encryptMessage(messageToEncrypt, publicKey)
      .then(encryptedMessage => {
        if (encryptedMessage) {
          console.log('Зашифрованное сообщение:', encryptedMessage);
          // Тут можно использовать зашифрованное сообщение в дальнейшем
        }
      })
      .catch(error => {
        console.error('Ошибка:', error);
      });

    let cookies = event.nativeEvent.data;
    console.log(cookies);

    let fetchUUID = await SecureStore.getItemAsync('secure_deviceid');
    console.log(fetchUUID);

    // await SecureStore.deleteItemAsync('keys');
    fetchUUID = await SecureStore.getItemAsync('secure_deviceid');

    const gcvplk_tk_uid_cookie = cookies.split('; ').find(row => row.startsWith('gcvplk_tk_uid='));
    const gcvp_tk_token = cookies.split('; ').find(row => row.startsWith('gcvplk_tk='));
    if (gcvplk_tk_uid_cookie) {
      const gcvplk_tk_uid = gcvplk_tk_uid_cookie.split('=')[1];
      const gcvplk_tk = gcvp_tk_token.split('=')[1];
      console.log(gcvplk_tk_uid)
      if (fetchUUID) {
        console.log('1')
        fetch('http://172.20.15.18:8000/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + fetchUUID,
            'gcvp': gcvplk_tk,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Response msg:', data);
            if (data === true) {
              navigation.navigate('Чаты', {gcvplk_tk_uid: gcvplk_tk_uid});
            }
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      } else {
        const uuid = uuidv4();
        console.log(uuid, "uuid");
        await SecureStore.setItemAsync('secure_deviceid', uuid)
        console.log(Platform.OS);
        console.log(Device.osInternalBuildId);
        console.log(Device.osName);
        console.log(uuid);
        fetch('http://172.20.15.18:8000/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
            'gcvp': gcvplk_tk,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Response msg:', data);
            if (data === true) {
              navigation.navigate('Чаты', {gcvplk_tk_uid: gcvplk_tk_uid});
            }
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }
    }
  };


  return (
    <WebView
      source={{uri: 'http://corp.gcvp.local/'}}
      injectedJavaScript={`window.ReactNativeWebView.postMessage(document.cookie);`}
      onMessage={onWebViewMessage}
    />
  );
}

const styles = StyleSheet.create({})