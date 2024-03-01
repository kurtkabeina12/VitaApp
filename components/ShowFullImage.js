import React, { useState } from 'react';
import {Modal, Dimensions, View, Button, TouchableOpacity, Text} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { ImageBackground } from 'react-native';
import {useNavigation} from "@react-navigation/native";

export default function ShowFullImage({ route }) {
  const navigate = useNavigation();
  const deviceHeight = Dimensions.get('window').height;
  const deviceWidth = Dimensions.get('window').width;
  const { Url, isDarkTheme } = route.params;

  const closeModalAndReturn = () => {
    navigate.goBack();
  };

  return (
    <>
      <View style={{ flex:1, backgroundColor: isDarkTheme ? "#171717" : "white" }}>
        <ImageZoom
          cropWidth={deviceWidth}
          cropHeight={deviceHeight}
          imageWidth={deviceWidth}
          imageHeight={deviceHeight}
        >
          <ImageBackground
            source={{ uri: Url }}
            resizeMode="center"
            style={{ width: '100%', height: '100%' }}
          />
        </ImageZoom>
      </View>
      <TouchableOpacity style={{display:"flex", backgroundColor: isDarkTheme ? "#171717" : "white", alignItems:'center', paddingBottom:10}} onPress={closeModalAndReturn}>
        <Text style={{color: isDarkTheme ? "white" : "black"}}>Закрыть</Text>
      </TouchableOpacity>
    </>
  );
}
