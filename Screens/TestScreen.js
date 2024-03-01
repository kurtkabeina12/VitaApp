import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function TestScreen() {
  fetch('http://172.20.15.18:8000/test', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log('Response msg:', data.detail);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  return (
    <View>
      <Text>TestScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({})