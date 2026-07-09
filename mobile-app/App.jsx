import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'

function DashboardScreen() {
  const [location, setLocation] = useState(null)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      let loc = await Location.getCurrentPositionAsync({})
      setLocation(loc)
    })()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stanfliet OTA Energy</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Meter Status</Text>
        <Text style={styles.value}>SM-2026-0001</Text>
        <Text style={styles.status}>Online ?</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Balance</Text>
        <Text style={styles.value}>R245.50</Text>
        <Text style={styles.subtext}>114.5 kWh remaining</Text>
      </View>
      {location && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Location</Text>
          <Text style={styles.subtext}>Lat: {location.coords.latitude.toFixed(4)}</Text>
          <Text style={styles.subtext}>Lng: {location.coords.longitude.toFixed(4)}</Text>
        </View>
      )}
    </View>
  )
}

function PurchaseScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Purchase Electricity</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Amounts</Text>
        <Text style={styles.value}>R50 - 23.3 kWh</Text>
        <Text style={styles.value}>R100 - 46.6 kWh</Text>
        <Text style={styles.value}>R200 - 93.3 kWh</Text>
        <Text style={styles.value}>R500 - 233.2 kWh</Text>
      </View>
    </View>
  )
}

function TransferScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Credits</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Send to Another Meter</Text>
        <Text style={styles.subtext}>Enter meter serial and amount to transfer credits securely.</Text>
      </View>
    </View>
  )
}

function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Info</Text>
        <Text style={styles.subtext}>Name: John Dube</Text>
        <Text style={styles.subtext}>Meter: SM-2026-0001</Text>
        <Text style={styles.subtext}>Type: Single Phase</Text>
      </View>
    </View>
  )
}

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#1a365d', tabBarInactiveTintColor: '#718096' }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard', tabBarIcon: () => <Text>??</Text> }} />
        <Tab.Screen name="Purchase" component={PurchaseScreen} options={{ tabBarLabel: 'Buy', tabBarIcon: () => <Text>??</Text> }} />
        <Tab.Screen name="Transfer" component={TransferScreen} options={{ tabBarLabel: 'Transfer', tabBarIcon: () => <Text>??</Text> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>??</Text> }} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginBottom: 20, marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardTitle: { fontSize: 14, color: '#718096', marginBottom: 8 },
  value: { fontSize: 22, fontWeight: 'bold', color: '#2d3748', marginBottom: 4 },
  status: { fontSize: 14, color: '#48bb78', fontWeight: '600' },
  subtext: { fontSize: 14, color: '#718096', marginTop: 2 }
})
