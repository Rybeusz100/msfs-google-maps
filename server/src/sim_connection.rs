use std::{
    mem::transmute_copy,
    sync::{mpsc, Arc, Mutex},
    thread::{self, JoinHandle},
    time::Duration,
};

mod enums;
// mod fake_route;
mod structs;

pub use enums::*;
// use fake_route::FakeRoute;
pub use structs::*;

pub fn start() -> (JoinHandle<()>, SimWorkerConn) {
    let (tx, rx) = mpsc::channel::<Message>();
    let route = Arc::new(Mutex::new(Route::new()));

    let handle;
    {
        let route = route.clone();
        // let mut fake_route = FakeRoute::new(
        //     Position {
        //         lat: 50.076707070424845,
        //         lon: 19.778160533188096,
        //         alt: 0f64,
        //         hdg: 0f64,
        //     },
        // );
        handle = thread::spawn(move || 'thread: loop {
            // route.lock().unwrap().add_point(fake_route.get_position());
            // thread::sleep(Duration::from_millis(500));

            let mut conn = simconnect::SimConnector::new();
            while !conn.connect("msfs-google-map") {
                trace!("Connection to the simulator failed, retrying");
                thread::sleep(Duration::from_millis(500));
                if let Ok(Message::Stop) = rx.try_recv() {
                    info!("Message::Stop received, stopping simconnect");
                    break 'thread;
                }
            }

            info!("Connected to the simulator");
            prepare_position_data(&conn);

            '_main: loop {
                match rx.try_recv() {
                    Ok(Message::Stop) => {
                        info!("Message::Stop received, stopping simconnect");
                        break 'thread;
                    }
                    Ok(Message::Restart) => {
                        info!("Message::Restart received, restarting simconnect");
                        continue 'thread;
                    }
                    _ => (),
                }

                match conn.get_next_message() {
                    Ok(simconnect::DispatchResult::SimobjectData(data)) => unsafe {
                        if let DEFINE_ID_POSITION = data.dwDefineID {
                            #[allow(unaligned_references)]
                            let mut position: Position = transmute_copy(&data.dwData);
                            position.hdg = position.hdg.to_degrees();
                            if position.is_ok() {
                                route.lock().unwrap().add_point(position);
                            }
                        }
                    },
                    Ok(simconnect::DispatchResult::Quit(_)) => {
                        info!("Connection ended by the simulator, restarting simconnect");
                        continue 'thread;
                    }
                    Ok(simconnect::DispatchResult::Exception(_)) => {
                        warn!("Exception received, restarting simconnect");
                        continue 'thread;
                    }
                    _ => (),
                }
                thread::sleep(Duration::from_millis(200));
            }
        })
    }

    (
        handle,
        SimWorkerConn {
            tx: Mutex::new(tx),
            route,
        },
    )
}

fn prepare_position_data(conn: &simconnect::SimConnector) {
    conn.add_data_definition(
        DEFINE_ID_POSITION,
        "PLANE LATITUDE",
        "Degrees",
        simconnect::SIMCONNECT_DATATYPE_SIMCONNECT_DATATYPE_FLOAT64,
        u32::MAX,
    );
    conn.add_data_definition(
        DEFINE_ID_POSITION,
        "PLANE LONGITUDE",
        "Degrees",
        simconnect::SIMCONNECT_DATATYPE_SIMCONNECT_DATATYPE_FLOAT64,
        u32::MAX,
    );
    conn.add_data_definition(
        DEFINE_ID_POSITION,
        "Plane Alt Above Ground",
        "Feet",
        simconnect::SIMCONNECT_DATATYPE_SIMCONNECT_DATATYPE_FLOAT64,
        u32::MAX,
    );
    conn.add_data_definition(
        DEFINE_ID_POSITION,
        "Plane Heading Degrees True",
        "Radians",
        simconnect::SIMCONNECT_DATATYPE_SIMCONNECT_DATATYPE_FLOAT64,
        u32::MAX,
    );
    conn.request_data_on_sim_object(
        DEFINE_ID_POSITION,
        DEFINE_ID_POSITION,
        simconnect::SIMCONNECT_OBJECT_ID_USER,
        simconnect::SIMCONNECT_PERIOD_SIMCONNECT_PERIOD_SECOND,
        0,
        0,
        0,
        0,
    );
}
