# ESP32 Smart Parking System

## Overview
This project is a **Smart Parking System** using an ESP32 microcontroller. It utilizes an **ultrasonic sensor** to detect vehicle presence and communicates the status to a **WebSocket server**. Additionally, it integrates **state management** for multiple parking spaces and provides a placeholder for **UPI-based payments** for parking. To enable remote access from outside the local network, **Ngrok** is used to expose the ESP32 WebSocket server over the internet.

## Features
- **Real-time Parking Space Detection** using an ultrasonic sensor
- **WebSocket Communication** for instant updates
- **State Management** for multiple parking spots
- **UPI Payment Integration** (Future implementation)
- **WiFi Connectivity** to access parking information remotely
- **Ngrok Tunnel** to allow external access to the ESP32 WebSocket server

## Hardware Requirements
- **ESP32 development board** (Wi-Fi enabled)
- **Ultrasonic Sensor (HC-SR04)** for distance measurement
- **WiFi connection** to communicate with the WebSocket server

## Software Requirements
- **Arduino IDE** with ESP32 board support
- **WebSocket Client** for communication
- **Ngrok** for secure tunneling

## Installation
### 1. Flashing the ESP32
1. Clone this repository:
   ```sh
   git clone https://github.com/ChrsNikhil/ESP32-Smart-Parking.git
   ```
2. Open the `esp32_parking.ino` file in Arduino IDE.
3. Install required libraries:
   - WiFi.h
   - WebSocketsServer.h
4. Configure WiFi credentials in the code:
   ```cpp
   const char* ssid = "Your_SSID";
   const char* password = "Your_PASSWORD";
   ```
5. Upload the code to your ESP32 board.

### 2. Running the WebSocket Server
1. Ensure your ESP32 and client device are on the same WiFi network.
2. The ESP32's IP address will be displayed in the Serial Monitor.
3. Connect a WebSocket client to `ws://<ESP32_IP>:81/`

### 3. Setting Up Ngrok for Remote Access
1. Download and install Ngrok from [ngrok.com](https://ngrok.com/).
2. Authenticate Ngrok with your account:
   ```sh
   ngrok config add-authtoken <YOUR_AUTH_TOKEN>
   ```
3. Run Ngrok to expose the ESP32 WebSocket server:
   ```sh
   ngrok http 81
   ```
4. Copy the generated **public URL** and use it to connect remotely.

## Parking Space State Management
The system supports **multiple parking spots**. Each space is assigned a unique ID, and its status (`occupied` or `available`) is managed in real-time. The WebSocket server broadcasts updates to connected clients whenever a state change occurs.

Example data format:
```json
{
    "parking_spots": {
        "1": "occupied",
        "2": "available",
        "3": "occupied"
    }
}
```

## UPI Payment Integration (Upcoming)
- Users will be able to scan a **dynamic UPI QR code** generated based on the parking duration.
- The system will verify payment and mark the parking slot as paid.
- Integration will be done using a **UPI Payment API**.

## How the Ultrasonic Sensor Works
- The **HC-SR04 ultrasonic sensor** sends out an ultrasonic pulse.
- The pulse bounces off objects (vehicles) and returns to the sensor.
- The ESP32 calculates the time taken and converts it to distance.
- If the distance is below a certain threshold (e.g., 10 cm), the parking space is marked as **occupied**.
- Otherwise, it is marked as **available**.

## Future Enhancements
- Mobile app for viewing parking status and payments.
- AI-based occupancy detection for more accuracy.
- Data analytics dashboard for parking space usage statistics.

## Contributing
Feel free to fork and improve the project! Open an issue for any suggestions or bug reports.

## License
NC- Not for Commercial Use.
Developed by **Chris Nikhil Fernando**.

