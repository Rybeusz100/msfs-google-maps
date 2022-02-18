import SimConnectPybind11Module as SimConnect
import os
from math import degrees

class Connection:
    def __init__(self):
        self.hSimConnect = None
    
    def connect(self):
        self.hSimConnect = SimConnect.Connect()
        if self.hSimConnect is not None:
            SimConnect.AddDataToDefinition(self.hSimConnect)
            return True
        return False
    
    def disconnect(self):
        SimConnect.Disconnect(self.hSimConnect)

    def get_position(self):
        SimConnect.RequestData(self.hSimConnect)
        position = SimConnect.GetPosition()
        if 'ConnectionEnded' in position:
            self.disconnect()
            os._exit(0)
        
        position['heading'] = degrees(position['heading'])
        return position
