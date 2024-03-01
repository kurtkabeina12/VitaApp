import React, {useEffect, useRef, useState} from 'react';
import {WebView} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';
import {
  Image, Keyboard,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback, useColorScheme,
  View
} from 'react-native';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import * as SecureStore from 'expo-secure-store';
import forge from 'node-forge';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import logoImage from '../assets/logo.png'
import logoDark from '../assets/logoDark.png'
import { getUUID, setUUID, getGCVPToken, setGCVPToken, deleteGCVPToken } from '../SecureStorageService';
import {initSocket} from "../Socket";
import { Appearance } from 'react-native';

export default function TestLoginScreen()  {
  const navigation = useNavigation();
  const [publickKey, setpublickKey] = useState("")
  const [gcvpToken, setGcvpToken] = useState("")
  const [loginError, setLoginError] = useState(false);
  const colorSheme = useColorScheme();
  const isDarkTheme = colorSheme === 'dark';

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getGCVPToken();
      console.log(token + " токен проверка в начале")
      const fetchUUID = await getUUID();
      // console.log(fetchUUID);
      if (token) {
        setGcvpToken(token);
        fetch('http://172.20.15.18:8000/auth', {
          method: 'POST',
          headers: {
            'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + fetchUUID,
            'gcvp_token': token,
          },
        })
          .then((response) => response.json())
          .then(async (data)  => {
            console.log('Response auth:', data);

            if(data === false){
               await deleteGCVPToken();
            }else{
              setGcvpToken(data.gcvp_token)
              const gcvPToken = data.gcvp_token;
              await setGCVPToken(gcvPToken);
              console.log(gcvPToken, "токен в базе store")
              navigation.navigate('Чаты', {gcvplk_tk_uid:data.staff_id, token:data.access_token, tk_type: data.token_type, tokenDlyDelete:token, isDarkTheme:isDarkTheme});
            }
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }else{
        setGcvpToken("");
        fetch('http://172.20.15.18:8000/auth', {
          method: 'POST',
          headers: {
            'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + fetchUUID,
            'gcvp_token': token,
          },
        })
          .then((response) => response.json())
          .then(async (data)  => {
            console.log(data)
            // setGcvpToken(data.gcvp_token)
            // const gcvPToken = data.gcvp_token;
            // await setGCVPToken(gcvPToken);
            // console.log(gcvPToken, "токен в базе store")
            // console.log('Response auth if token null:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }
    };

    fetchToken();
  }, []);


  useEffect(() => {
    fetch('http://172.20.15.18:8000/getpublic', {
    })
      .then((response) => response.json())
      .then((pbkey) => {
        console.log('Response getpublic:', pbkey);
        setpublickKey(pbkey)
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);
  const encryptPassword = (password, publickKey) => {
    const publicKeys = forge.pki.publicKeyFromPem(publickKey);
    // const encryptedPassword = publicKeys.encrypt(password, 'RSA-OAEP', {
    //   md: forge.md.sha256.create(),
    // });
    const encryptedPassword = publicKeys.encrypt(password, 'RSAES-PKCS1-V1_5');
    return forge.util.encode64(encryptedPassword);
    // return encryptedPassword
  };



  const phoneValidationSchema = Yup.object({
    phoneNumber: Yup.string()
      .matches(/7\d*$/, 'Номер телефона должен начинаться с 7')
      .required('Введите номер телефона'),
  });
  const formik = useFormik({
    initialValues: {
      phoneNumber: '',
      password: '',
    },
    validationSchema: phoneValidationSchema,

    onSubmit: async values => {
      const encryptedPassword = encryptPassword(values.password, publickKey);
      const encryptedPhoneNumber = encryptPassword(values.phoneNumber, publickKey)
      const fetchUUID = await getUUID();
      const token = await getGCVPToken();
console.log("token on submit " + token)
      if (fetchUUID) {
        console.log('1');
        fetch('http://172.20.15.18:8000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + fetchUUID,
            'gcvp_token': gcvpToken,
          },
          body: JSON.stringify({
            phone:encryptedPhoneNumber,
            pwd: encryptedPassword,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Response msg:', data);
            if(!data){
              setLoginError(true);
              console.log("неправильный пароль")
            }else{
              setGcvpToken(data.gcvp_token)
              const gcvPToken = data.gcvp_token;
              setGCVPToken(gcvPToken);
              //navigation.navigate('Test')
              navigation.navigate('Чаты', {gcvplk_tk_uid:data.staff_id, token:data.access_token, tk_type: data.token_type,tokenDlyDelete:token, isDarkTheme:isDarkTheme});
            }
            // console.log(data.staff_id)
            // console.log(data.access_token)
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        // console.log(fetchUUID, 'uuidFetch')
      } else {
        const uuid = uuidv4();
        // console.log(uuid, "uuid");
        await setUUID(uuid);
        // console.log(Platform.OS);
        // console.log(Device.osInternalBuildId);
        // console.log(Device.osName);
        // console.log(uuid);
        fetch('http://172.20.15.18:8000/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'gcvp_info': Platform.OS + "/" + Device.osInternalBuildId + "/" + Device.osName + "/" + uuid,
            'gcvp_token': gcvpToken,
          },
          body: JSON.stringify({
            phone:encryptedPhoneNumber,
            pwd: encryptedPassword,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Response msg:', data);
            if(!data){
              setLoginError(true);
              console.log("Непавильны")
            }else{
              setGcvpToken(data.gcvp_token)
              setGCVPToken(gcvpToken);
              //navigation.navigate('Test')
              navigation.navigate('Чаты', {
                gcvplk_tk_uid: data.staff_id,
                token: data.access_token,
                tk_type: data.token_type,
                tokenDlyDelete:token,
                isDarkTheme:isDarkTheme
              });
            }
            // console.log(data.staff_id)
            // console.log(data.access_token)

          })
          .catch((error) => {
            console.error('Error:', error);
          });
      }

    }

    //   fetch('http://172.20.15.18:8000/login', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       phone_pwd: values,
    //     }),
    //   })
    //     .then((response) => response.json())
    //     .then((data) => {
    //       console.log('Response msg:', data);
    //         navigation.navigate('Чаты', {gcvplk_tk_uid:data});
    //     })
    //     .catch((error) => {
    //       console.error('Error:', error);
    //     });
    // },
  });


  return (
    <View style={{flex:1}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={isDarkTheme ? styles.containerDark : styles.container}>
            <KeyboardAvoidingView>
              <View style={{ marginTop: 75, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={isDarkTheme ? logoDark : logoImage}
                  style={{height:200, width:208}}
                />
                {loginError && <Text style={{color: 'red', fontSize: 17, fontWeight: "600", marginTop: 15}}>Введены неверные данные</Text>}
                {!loginError && <Text style={{color:isDarkTheme ? "#d4d4d8" : '#3a3a3d', fontSize: 17, fontWeight: "600", marginTop: 15 }}> Войдите в ваш аккаунт</Text>}
              </View>

              <View style={{ marginTop: 50 }}>
                <View>

                  <Text style={{ fontSize: 18, fontWeight: "600", color: isDarkTheme ? "#d4d4d8" : "#696969" }}>Номер телефона</Text>
                  <TextInput
                    placeholder='Введите номер телефона'
                    style={{ color: isDarkTheme ? "white" : "black" , borderBottomColor: isDarkTheme ? "#d1d5db" : 'gray', borderBottomWidth: 1, marginVertical: 10, width: 300 }}
                    onChangeText={text => {
                      const newText = text.replace(/[^0-9]/g, '');
                      if (newText.length <= 11) {
                        formik.setFieldValue('phoneNumber', newText);
                      }
                    }}
                    onBlur={formik.handleBlur('phoneNumber')}
                    value={formik.values.phoneNumber ? formik.values.phoneNumber : '+7'}
                    keyboardType='numeric'
                  />

                  {formik.touched.phoneNumber && formik.errors.phoneNumber ? (
                    <Text>{formik.errors.phoneNumber}</Text>
                  ) : null}

                </View>
              </View>

              <View style={{ marginTop: 10 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: isDarkTheme ? "#d4d4d8" : "#696969" }}>Пароль</Text>
                  <TextInput
                    secureTextEntry={true}
                    placeholder='Введите пароль'
                    style={{ color: isDarkTheme ? "white" : "black", borderBottomColor: isDarkTheme ? "#d1d5db" : 'gray', borderBottomWidth: 1, marginVertical: 10, width: 300 }}
                    onChangeText={text => formik.setFieldValue('password', text)}
                    value={formik.values.password}
                  />
                </View>
              </View>

              <Pressable style={{ width: 200, backgroundColor: isDarkTheme ? "#01591e" : "#00862b", marginTop: 50, padding: 15, marginLeft: 'auto', marginRight: 'auto', borderRadius: 6 }} onPress={formik.handleSubmit}>
                <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", textAlign: "center" }}>Войти</Text>
              </Pressable>

            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    alignItems: "center"
  },
  containerDark:{
    flex: 1,
    backgroundColor: "black",
    padding: 10,
    alignItems: "center"
  },
})