#include <iostream>
#include <Windows.h>
#include "SimConnect.h"
#include <pybind11/pybind11.h>

namespace py = pybind11;

enum DATA_DEFINE_ID
{
    DEFINITION_1
};

enum DATA_REQUEST_ID
{
    REQUEST_1
};

struct DataStruct
{
    double latitude;
    double longitude;
    double heading;
};

DataStruct CurrentPosition;
bool ConnectionEndedBySim = false;

void CALLBACK MyDispatchProc(SIMCONNECT_RECV* pData, DWORD cbData, void* pContext)
{
    switch (pData->dwID)
    {
    case SIMCONNECT_RECV_ID_SIMOBJECT_DATA:
    {
        SIMCONNECT_RECV_SIMOBJECT_DATA* pObjData = (SIMCONNECT_RECV_SIMOBJECT_DATA*)pData;
        switch (pObjData->dwRequestID)
        {
        case REQUEST_1:
        {
            DataStruct* pS = (DataStruct*)&pObjData->dwData;
            CurrentPosition = *pS;
            break;
        }
        }
        break;
    }
    case SIMCONNECT_RECV_ID_QUIT:
        ConnectionEndedBySim = true;
        break;
    default:
        break;
    }
}

HANDLE Connect()
{
    HANDLE hSimConnect = NULL;
    HRESULT hr;

    hr = SimConnect_Open(&hSimConnect, "SimConnect Position", NULL, 0, 0, 0);
    if (SUCCEEDED(hr))
        return hSimConnect;
    else
        return NULL;
}

void Disconnect(HANDLE& hSimConnect)
{
    SimConnect_Close(hSimConnect);
}

void AddDataToDefinition(HANDLE& hSimConnect)
{
    SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Plane Latitude", "degrees");
    SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Plane Longitude", "degrees");
    SimConnect_AddToDataDefinition(hSimConnect, DEFINITION_1, "Plane Heading Degrees True", "radians");
}

void RequestData(HANDLE& hSimConnect)
{
    HRESULT hr;
    hr = SimConnect_RequestDataOnSimObject(hSimConnect, REQUEST_1, DEFINITION_1, SIMCONNECT_OBJECT_ID_USER, SIMCONNECT_PERIOD_ONCE);
    SimConnect_CallDispatch(hSimConnect, MyDispatchProc, NULL);
}

py::dict GetPosition()
{
    using namespace pybind11::literals;

    if (ConnectionEndedBySim)
    {
        py::dict d("ConnectionEnded"_a = true);
        return d;
    }

    py::dict d("latitude"_a = CurrentPosition.latitude, "longitude"_a = CurrentPosition.longitude, "heading"_a = CurrentPosition.heading);
    return d;
}


PYBIND11_MODULE(SimConnectPybind11Module, m)
{
    m.doc() = "Pybind11 module for getting aircraft's position from simulator";
    m.def("Connect", &Connect);
    m.def("Disconnect", &Disconnect);
    m.def("AddDataToDefinition", &AddDataToDefinition);
    m.def("RequestData", &RequestData);
    m.def("GetPosition", &GetPosition);
}