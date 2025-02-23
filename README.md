# ESP32 Smart Parking System

## Overview
This project is a **Smart Parking System** using an ESP32 microcontroller. It utilizes an **ultrasonic sensor** to detect vehicle presence and communicates the status to a **WebSocket server**. Additionally, it integrates **state management** for multiple parking spaces and provides a placeholder for **UPI-based payments** for parking.

## Features
- **Real-time Parking Space Detection** using an ultrasonic sensor
- **WebSocket Communication** for instant updates
- **State Management** for multiple parking spots
- **UPI Payment Integration** (Future implementation)
- **WiFi Connectivity** to access parking information remotely

## Hardware Requirements
- ESP32 development board
- Ultrasonic Sensor (HC-SR04)
- WiFi connection

## Software Requirements
- Arduino IDE with ESP32 board support
- WebSocket Client

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

## Future Enhancements
- Mobile app for viewing parking status and payments.
- AI-based occupancy detection for more accuracy.
- Data analytics dashboard for parking space usage statistics.

## Contributing
Feel free to fork and improve the project! Open an issue for any suggestions or bug reports.

## License
NC- Not for Commercial Use.
Developed by Chris Nikhil Fernando.

